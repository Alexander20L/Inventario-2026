import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { AccessContext } from './access.types.js';
import {
  hashPassword,
  newToken,
  tokenHash,
  verifyPassword,
} from './access.crypto.js';
import { bodyObject, email, id, password, text } from './access.input.js';

export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export function rethrowConflict(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'El usuario, documento o acceso ya está registrado',
    );
  }
  throw error;
}

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createSession(
    db: Prisma.TransactionClient,
    usuarioId: bigint,
    empresaId: bigint,
  ) {
    const token = newToken();
    const expiraEn = new Date(Date.now() + SESSION_DURATION_MS);
    await db.sesionAcceso.create({
      data: { usuarioId, empresaId, tokenHash: tokenHash(token), expiraEn },
    });
    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiraEn: expiraEn.toISOString(),
      empresaId: empresaId.toString(),
    };
  }

  async registerCompany(input: unknown) {
    const body = bodyObject(input);
    const nombre = text(body, 'nombre', 150);
    const correo = email(body);
    const clave = password(body);
    const nombreLegal = text(body, 'nombreEmpresa', 200);
    const numeroDocumento = text(body, 'numeroDocumento', 20);
    const passwordHash = await hashPassword(clave);
    try {
      return await this.prisma.$transaction(async (db) => {
        const usuario = await db.usuario.create({
          data: { nombre, correo, passwordHash },
        });
        const empresa = await db.empresa.create({
          data: { nombreLegal, numeroDocumento, correo },
        });

        await db.sucursal.create({
          data: {
            empresaId: empresa.idEmpresa,
            nombre: 'Sucursal Principal',
          },
        });
        await db.usuarioEmpresa.create({
          data: {
            usuarioId: usuario.idUsuario,
            empresaId: empresa.idEmpresa,
            rol: 'ADMINISTRADOR',
          },
        });
        const session = await this.createSession(
          db,
          usuario.idUsuario,
          empresa.idEmpresa,
        );
        return {
          ...session,
          usuario: { id: usuario.idUsuario.toString(), nombre, correo },
          rol: 'ADMINISTRADOR',
        };
      });
    } catch (error) {
      rethrowConflict(error);
    }
  }

  async login(input: unknown) {
    const body = bodyObject(input);
    const correo = email(body);
    const clave = password(body);
    const empresaId =
      body.empresaId === undefined
        ? undefined
        : id(body.empresaId, 'empresaId');
    const usuario = await this.prisma.usuario.findUnique({ where: { correo } });
    if (
      !usuario ||
      usuario.estado !== 'ACTIVO' ||
      !(await verifyPassword(clave, usuario.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    const accesos = await this.prisma.usuarioEmpresa.findMany({
      where: {
        usuarioId: usuario.idUsuario,
        estado: 'ACTIVO',
        empresa: { estado: 'ACTIVO' },
        ...(empresaId ? { empresaId } : {}),
      },
      include: { empresa: true },
    });
    if (accesos.length === 0)
      throw new UnauthorizedException('No tienes acceso a esta tienda');
    if (accesos.length > 1) {
      throw new BadRequestException({
        message: 'Selecciona una tienda enviando empresaId',
        empresas: accesos.map((acceso) => ({
          id: acceso.empresaId.toString(),
          nombre: acceso.empresa.nombreLegal,
        })),
      });
    }
    const acceso = accesos[0];
    const session = await this.createSession(
      this.prisma,
      usuario.idUsuario,
      acceso.empresaId,
    );
    return {
      ...session,
      usuario: {
        id: usuario.idUsuario.toString(),
        nombre: usuario.nombre,
        correo,
      },
      rol: acceso.rol,
    };
  }

  async authenticate(token: string): Promise<AccessContext> {
    const sesion = await this.prisma.sesionAcceso.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { usuario: true, empresa: true },
    });
    if (
      !sesion ||
      sesion.revocadaEn ||
      sesion.expiraEn <= new Date() ||
      sesion.usuario.estado !== 'ACTIVO' ||
      sesion.empresa.estado !== 'ACTIVO'
    ) {
      throw new UnauthorizedException('Sesión no válida o vencida');
    }
    const acceso = await this.prisma.usuarioEmpresa.findUnique({
      where: {
        usuarioId_empresaId: {
          usuarioId: sesion.usuarioId,
          empresaId: sesion.empresaId,
        },
      },
    });
    if (!acceso || acceso.estado !== 'ACTIVO')
      throw new UnauthorizedException('Acceso a la tienda deshabilitado');
    return {
      sesionId: sesion.idSesion,
      usuarioId: sesion.usuarioId,
      empresaId: sesion.empresaId,
      rol: acceso.rol,
      nombre: sesion.usuario.nombre,
      correo: sesion.usuario.correo,
      nombreEmpresa: sesion.empresa.nombreLegal,
    };
  }

  async logout(access: AccessContext) {
    await this.prisma.sesionAcceso.update({
      where: { idSesion: access.sesionId },
      data: { revocadaEn: new Date() },
    });
    return { message: 'Sesión cerrada' };
  }
}
