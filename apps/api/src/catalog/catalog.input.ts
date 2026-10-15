import { BadRequestException } from '@nestjs/common';
import { bodyObject, id, text } from '../access/access.input.js';

export function optionalText(
  body: Record<string, unknown>,
  key: string,
  max: number,
): string | null {
  if (typeof body[key] === 'string' && body[key].trim() === '') return null;
  if (body[key] === undefined || body[key] === null || body[key] === '')
    return null;
  return text(body, key, max);
}

export function status(value: unknown): 'ACTIVO' | 'INACTIVO' {
  if (value === undefined) return 'ACTIVO';
  if (value !== 'ACTIVO' && value !== 'INACTIVO')
    throw new BadRequestException('Estado no válido');
  return value;
}

export function productInput(input: unknown) {
  const body = bodyObject(input);
  const precioVenta = body.precioVenta;
  if (
    typeof precioVenta !== 'string' ||
    !/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(precioVenta)
  ) {
    throw new BadRequestException(
      'El precio debe enviarse como texto, sin negativos y con hasta dos decimales',
    );
  }
  if (
    typeof body.stockMinimo !== 'number' ||
    !Number.isInteger(body.stockMinimo) ||
    body.stockMinimo < 0 ||
    body.stockMinimo > 2147483647
  ) {
    throw new BadRequestException(
      'El stock mínimo debe ser un entero entre 0 y 2147483647',
    );
  }
  const codigoBarras = text(body, 'codigoBarras', 64);
  if (!/^[A-Za-z0-9._-]+$/.test(codigoBarras))
    throw new BadRequestException(
      'El código debe contener letras, números, puntos, guiones o guiones bajos, sin espacios',
    );
  const rawIds = body.proveedorIds ?? [];
  if (!Array.isArray(rawIds) || rawIds.length > 100)
    throw new BadRequestException(
      'Envía hasta 100 proveedores en proveedorIds',
    );
  const proveedorIds = [
    ...new Set(rawIds.map((value) => id(value, 'proveedorId'))),
  ];
  return {
    nombre: text(body, 'nombre', 200),
    presentacion: optionalText(body, 'presentacion', 150),
    estado: status(body.estado),
    precioVenta,
    stockMinimo: body.stockMinimo,
    codigoBarras,
    proveedorIds,
  };
}

export function supplierInput(input: unknown) {
  const body = bodyObject(input);
  const telefono = text(body, 'telefono', 30);
  const digits = telefono.replace(/\D/g, '');
  if (
    !/^\+?[\d ()-]+$/.test(telefono) ||
    digits.length < 7 ||
    digits.length > 15
  )
    throw new BadRequestException(
      'El teléfono debe contener entre 7 y 15 dígitos; puede incluir +, espacios, paréntesis y guiones',
    );
  const correo = optionalText(body, 'correo', 150)?.toLowerCase() ?? null;
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
    throw new BadRequestException('El correo no es válido');
  return {
    nombreContacto: text(body, 'nombreContacto', 150),
    distribuidora: optionalText(body, 'distribuidora', 200),
    telefono,
    correo,
    direccion: optionalText(body, 'direccion', 300),
    numeroDocumento: optionalText(body, 'numeroDocumento', 20),
    diasVisita: optionalText(body, 'diasVisita', 150),
    notas: optionalText(body, 'notas', 1000),
    estado: status(body.estado),
  };
}

export function searchInput(query: {
  q?: unknown;
  estado?: unknown;
  after?: unknown;
  proveedorId?: unknown;
}) {
  const q =
    query.q === undefined || query.q === ''
      ? undefined
      : text({ q: query.q }, 'q', 120);
  const estado =
    query.estado === undefined || query.estado === ''
      ? undefined
      : status(query.estado);
  const after =
    query.after === undefined || query.after === ''
      ? undefined
      : id(query.after, 'after');
  const proveedorId =
    query.proveedorId === undefined || query.proveedorId === ''
      ? undefined
      : id(query.proveedorId, 'proveedorId');
  return { q, estado, after, proveedorId };
}
