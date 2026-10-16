import { BadRequestException } from '@nestjs/common';

import { bodyObject, text } from '../access/access.input.js';

function optionalText(
  body: Record<string, unknown>,
  key: string,
  max: number,
): string | null {
  const value = body[key];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(
      `${key} debe ser texto`,
    );
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > max) {
    throw new BadRequestException(
      `${key} debe tener hasta ${max} caracteres`,
    );
  }

  return trimmed;
}

function branchStatus(value: unknown): 'ACTIVO' | 'INACTIVO' {
  if (value === undefined) {
    return 'ACTIVO';
  }

  if (value !== 'ACTIVO' && value !== 'INACTIVO') {
    throw new BadRequestException('Estado no válido');
  }

  return value;
}

export function branchInput(input: unknown) {
  const body = bodyObject(input);

  return {
    nombre: text(body, 'nombre', 150),
    direccion: optionalText(body, 'direccion', 300),
    telefono: optionalText(body, 'telefono', 30),
    estado: branchStatus(body.estado),
  };
}   