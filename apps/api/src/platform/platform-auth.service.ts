import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  newToken,
  tokenHash,
  verifyPassword,
} from '../access/access.crypto.js';
import {
  bodyObject,
  email,
  password,
} from '../access/access.input.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import type { PlatformAccessContext } from './platform.types.js';

const PLATFORM_SESSION_DURATION_MS =
  24 * 60 * 60 * 1000;

@Injectable()
export class PlatformAuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async login(input: unknown) {
    const body = bodyObject(input);
    const correo = email(body);
    const clave = password(body);

    const administrador =
      await this.prisma.administradorPlataforma.findUnique({
        where: { correo },
      });

    if (
      !administrador ||
      administrador.estado !== 'ACTIVO' ||
      !(await verifyPassword(
        clave,
        administrador.passwordHash,
      ))
    ) {
      throw new UnauthorizedException(
        'Credenciales de plataforma incorrectas',
      );
    }

    const token = newToken();

    const expiraEn = new Date(
      Date.now() + PLATFORM_SESSION_DURATION_MS,
    );

    await this.prisma.sesionPlataforma.create({
      data: {
        administradorId:
          administrador.idAdministrador,
        tokenHash: tokenHash(token),
        expiraEn,
      },
    });

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiraEn: expiraEn.toISOString(),

      administrador: {
        id: administrador.idAdministrador.toString(),
        nombre: administrador.nombre,
        correo: administrador.correo,
      },
    };
  }

  async authenticate(
    token: string,
  ): Promise<PlatformAccessContext> {
    const sesion =
      await this.prisma.sesionPlataforma.findUnique({
        where: {
          tokenHash: tokenHash(token),
        },
        include: {
          administrador: true,
        },
      });

    if (
      !sesion ||
      sesion.revocadaEn ||
      sesion.expiraEn <= new Date() ||
      sesion.administrador.estado !== 'ACTIVO'
    ) {
      throw new UnauthorizedException(
        'Sesión de plataforma no válida o vencida',
      );
    }

    return {
      sesionId: sesion.idSesion,
      administradorId:
        sesion.administradorId,
      nombre: sesion.administrador.nombre,
      correo: sesion.administrador.correo,
    };
  }

  async logout(access: PlatformAccessContext) {
    await this.prisma.sesionPlataforma.update({
      where: {
        idSesion: access.sesionId,
      },
      data: {
        revocadaEn: new Date(),
      },
    });

    return {
      message: 'Sesión de plataforma cerrada',
    };
  }
}