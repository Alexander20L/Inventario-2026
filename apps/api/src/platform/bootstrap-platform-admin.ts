import 'dotenv/config';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module.js';
import { hashPassword } from '../access/access.crypto.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';

const nombre = process.env.PLATFORM_ADMIN_NAME?.trim();
const correo = process.env.PLATFORM_ADMIN_EMAIL
  ?.trim()
  .toLowerCase();
const password = process.env.PLATFORM_ADMIN_PASSWORD;

if (!nombre || nombre.length > 150) {
  throw new Error(
    'PLATFORM_ADMIN_NAME es obligatorio y debe tener hasta 150 caracteres',
  );
}

if (
  !correo ||
  correo.length > 150 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
) {
  throw new Error(
    'PLATFORM_ADMIN_EMAIL no contiene un correo válido',
  );
}

if (
  !password ||
  password.length < 10 ||
  password.length > 128
) {
  throw new Error(
    'PLATFORM_ADMIN_PASSWORD debe tener entre 10 y 128 caracteres',
  );
}

const app = await NestFactory.createApplicationContext(
  AppModule,
  {
    logger: false,
  },
);

try {
  const prisma = app.get(PrismaService);

  const existentes =
    await prisma.administradorPlataforma.count();

  if (existentes > 0) {
    throw new Error(
      'Ya existe un administrador de plataforma. El bootstrap inicial está bloqueado.',
    );
  }

  const passwordHash = await hashPassword(password);

  const administrador =
    await prisma.administradorPlataforma.create({
      data: {
        nombre,
        correo,
        passwordHash,
      },
    });

  console.log(
    `SUPERADMIN creado correctamente: ${administrador.correo}`,
  );
} finally {
  await app.close();
}