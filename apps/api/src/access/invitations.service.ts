import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import type { InvitacionEmpresa } from '../generated/prisma/client.js';
import type { AccessContext } from './access.types.js';
import { AuthService, rethrowConflict } from './auth.service.js';
import {
  hashPassword,
  newToken,
  tokenHash,
  verifyPassword,
} from './access.crypto.js';
import {
  bodyObject,
  email,
  id,
  invitationToken,
  password,
  role,
  text,
} from './access.input.js';

const INVITATION_DURATION_MS = 48 * 60 * 60 * 1000;

function invitationView(invitation: InvitacionEmpresa) {
  return {
    id: invitation.idInvitacion.toString(),
    correo: invitation.correo,
    rol: invitation.rol,
    creadoPorId: invitation.creadoPorId.toString(),
    creadoEn: invitation.creadoEn,
    expiraEn: invitation.expiraEn,
    estado: invitation.aceptadaEn
      ? 'ACEPTADA'
      : invitation.revocadaEn
        ? 'REVOCADA'
        : invitation.expiraEn <= new Date()
          ? 'VENCIDA'
          : 'PENDIENTE',
  };
}

@Injectable()
export class InvitationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async create(access: AccessContext, input: unknown) {
    const body = bodyObject(input);
    const correo = email(body);
    const rol = role(body.rol);
    const token = newToken();
    const invitation = await this.prisma.$transaction(async (db) => {
      const existing = await db.usuarioEmpresa.findFirst({
        where: { empresaId: access.empresaId, usuario: { correo } },
      });
      if (existing)
        throw new ConflictException(
          'Esta persona ya está vinculada a la tienda',
        );
      await db.invitacionEmpresa.updateMany({
        where: {
          empresaId: access.empresaId,
          correo,
          aceptadaEn: null,
          revocadaEn: null,
        },
        data: { revocadaEn: new Date() },
      });
      return db.invitacionEmpresa.create({
        data: {
          empresaId: access.empresaId,
          creadoPorId: access.usuarioId,
          correo,
          rol,
          tokenHash: tokenHash(token),
          expiraEn: new Date(Date.now() + INVITATION_DURATION_MS),
        },
      });
    });
    // El secreto solo se devuelve al crear la invitación; no se almacena en claro.
    return { ...invitationView(invitation), token };
  }

  async list(access: AccessContext, after?: string) {
    const invitations = await this.prisma.invitacionEmpresa.findMany({
      where: {
        empresaId: access.empresaId,
        ...(after ? { idInvitacion: { lt: id(after, 'after') } } : {}),
      },
      orderBy: { idInvitacion: 'desc' },
      take: 100,
    });
    return invitations.map(invitationView);
  }

  async revoke(access: AccessContext, invitationId: string) {
    const result = await this.prisma.invitacionEmpresa.updateMany({
      where: {
        idInvitacion: id(invitationId),
        empresaId: access.empresaId,
        aceptadaEn: null,
        revocadaEn: null,
      },
      data: { revocadaEn: new Date() },
    });
    if (!result.count)
      throw new NotFoundException('Invitación pendiente no encontrada');
    return { message: 'Invitación revocada' };
  }

  async accept(input: unknown) {
    const body = bodyObject(input);
    const token = invitationToken(body);
    const clave = password(body);
    const invitation = await this.prisma.invitacionEmpresa.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { empresa: true },
    });
    if (
      !invitation ||
      invitation.aceptadaEn ||
      invitation.revocadaEn ||
      invitation.expiraEn <= new Date() ||
      invitation.empresa.estado !== 'ACTIVO'
    ) {
      throw new BadRequestException(
        'La invitación no es válida o ya no está disponible',
      );
    }
    // El correo y el rol provienen de la invitación, nunca del cuerpo del cliente.
    const existing = await this.prisma.usuario.findUnique({
      where: { correo: invitation.correo },
    });
    if (
      existing &&
      (existing.estado !== 'ACTIVO' ||
        !(await verifyPassword(clave, existing.passwordHash)))
    ) {
      throw new UnauthorizedException(
        'Introduce la contraseña de tu cuenta existente',
      );
    }
    const nombre = existing?.nombre ?? text(body, 'nombre', 150);
    const passwordHash = existing?.passwordHash ?? (await hashPassword(clave));
    try {
      return await this.prisma.$transaction(async (db) => {
        // Reclamo condicional: aceptación, revocación y vencimiento no permiten
        // reutilizar el mismo token, incluso con solicitudes simultáneas.
        const claimed = await db.invitacionEmpresa.updateMany({
          where: {
            idInvitacion: invitation.idInvitacion,
            aceptadaEn: null,
            revocadaEn: null,
            expiraEn: { gt: new Date() },
            empresa: { estado: 'ACTIVO' },
          },
          data: { aceptadaEn: new Date() },
        });
        if (!claimed.count)
          throw new BadRequestException(
            'La invitación no es válida o ya fue utilizada',
          );
        const usuario =
          existing ??
          (await db.usuario.create({
            data: { nombre, correo: invitation.correo, passwordHash },
          }));
        await db.usuarioEmpresa.create({
          data: {
            usuarioId: usuario.idUsuario,
            empresaId: invitation.empresaId,
            rol: invitation.rol,
          },
        });
        const session = await this.auth.createSession(
          db,
          usuario.idUsuario,
          invitation.empresaId,
        );
        return {
          ...session,
          usuario: {
            id: usuario.idUsuario.toString(),
            nombre: usuario.nombre,
            correo: usuario.correo,
          },
          rol: invitation.rol,
        };
      });
    } catch (error) {
      rethrowConflict(error);
    }
  }

  async preview(input: unknown) {
    const token = invitationToken(bodyObject(input));
    const invitation = await this.prisma.invitacionEmpresa.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { empresa: true },
    });
    if (!invitation || invitation.empresa.estado !== 'ACTIVO') {
      throw new BadRequestException(
        'La invitación no es válida o ya no está disponible',
      );
    }
    const user = await this.prisma.usuario.findUnique({
      where: { correo: invitation.correo },
      select: { idUsuario: true },
    });
    return {
      tienda: invitation.empresa.nombreLegal,
      correo: invitation.correo,
      rol: invitation.rol,
      estado: invitationView(invitation).estado,
      tieneCuenta: Boolean(user),
    };
  }

  async users(access: AccessContext, after?: string) {
    const users = await this.prisma.usuarioEmpresa.findMany({
      where: {
        empresaId: access.empresaId,
        ...(after ? { idUsuarioEmpresa: { gt: id(after, 'after') } } : {}),
      },
      include: {
        usuario: { select: { idUsuario: true, nombre: true, correo: true } },
      },
      orderBy: { idUsuarioEmpresa: 'asc' },
      take: 100,
    });
    return users.map((user) => ({
      id: user.idUsuarioEmpresa.toString(),
      usuarioId: user.usuario.idUsuario.toString(),
      nombre: user.usuario.nombre,
      correo: user.usuario.correo,
      rol: user.rol,
      estado: user.estado,
    }));
  }

  async setWorkerStatus(
    access: AccessContext,
    membershipId: string,
    input: unknown,
  ) {
    const body = bodyObject(input);
    if (body.estado !== 'ACTIVO' && body.estado !== 'INACTIVO')
      throw new BadRequestException('Estado no válido');
    const targetId = id(membershipId);
    const estado = body.estado;
    await this.prisma.$transaction(async (db) => {
      const result = await db.usuarioEmpresa.updateMany({
        where: {
          idUsuarioEmpresa: targetId,
          empresaId: access.empresaId,
          rol: 'TRABAJADOR',
        },
        data: { estado },
      });
      if (!result.count)
        throw new NotFoundException('Trabajador no encontrado en esta tienda');
      if (estado === 'INACTIVO') {
        const membership = await db.usuarioEmpresa.findUniqueOrThrow({
          where: { idUsuarioEmpresa: targetId },
        });
        await db.sesionAcceso.updateMany({
          where: {
            empresaId: access.empresaId,
            usuarioId: membership.usuarioId,
            revocadaEn: null,
          },
          data: { revocadaEn: new Date() },
        });
      }
    });
    return {
      message: 'Acceso del trabajador actualizado',
      estado: body.estado,
    };
  }
}
