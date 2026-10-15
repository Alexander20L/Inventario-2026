import { BadRequestException } from '@nestjs/common';

export function bodyObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('El cuerpo debe ser un objeto JSON');
  }
  return value as Record<string, unknown>;
}

export function text(
  body: Record<string, unknown>,
  key: string,
  max: number,
): string {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new BadRequestException(
      `${key} es obligatorio y debe tener hasta ${max} caracteres`,
    );
  }
  return value.trim();
}

export function email(body: Record<string, unknown>): string {
  const value = text(body, 'correo', 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new BadRequestException('El correo no es válido');
  }
  return value;
}

export function password(body: Record<string, unknown>): string {
  const value = body.password;
  if (typeof value !== 'string' || value.length < 10 || value.length > 128) {
    throw new BadRequestException(
      'La contraseña debe tener entre 10 y 128 caracteres',
    );
  }
  return value;
}

export function id(value: unknown, field = 'id'): bigint {
  if (
    typeof value !== 'string' ||
    !/^[1-9]\d{0,18}$/.test(value) ||
    BigInt(value) > 9223372036854775807n
  ) {
    throw new BadRequestException(
      `${field} debe ser un identificador positivo enviado como texto`,
    );
  }
  return BigInt(value);
}

export function role(value: unknown): 'ADMINISTRADOR' | 'TRABAJADOR' {
  if (value === undefined) return 'TRABAJADOR';
  if (value !== 'ADMINISTRADOR' && value !== 'TRABAJADOR') {
    throw new BadRequestException('Rol no válido');
  }
  return value;
}

export function invitationToken(body: Record<string, unknown>): string {
  const value = text(body, 'token', 64);
  if (!/^[a-f0-9]{64}$/.test(value))
    throw new BadRequestException('Token de invitación no válido');
  return value;
}
