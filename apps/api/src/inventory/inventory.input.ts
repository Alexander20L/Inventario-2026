import { BadRequestException } from '@nestjs/common';

import { bodyObject, id } from '../access/access.input.js';
import type { TipoMovimientoInventario } from './inventory.service.js';

const TIPOS_MOVIMIENTO: TipoMovimientoInventario[] = [
  'ENTRADA_INICIAL',
  'ENTRADA_MANUAL',
  'SALIDA_MANUAL',
  'AJUSTE_POSITIVO',
  'AJUSTE_NEGATIVO',
];

export function movementInput(input: unknown) {
  const body = bodyObject(input);

  if (
    typeof body.tipoMovimiento !== 'string' ||
    !TIPOS_MOVIMIENTO.includes(
      body.tipoMovimiento as TipoMovimientoInventario,
    )
  ) {
    throw new BadRequestException('Tipo de movimiento no válido');
  }

  if (
    typeof body.cantidad !== 'number' ||
    !Number.isInteger(body.cantidad) ||
    body.cantidad <= 0 ||
    body.cantidad > 2147483647
  ) {
    throw new BadRequestException(
      'La cantidad debe ser un entero positivo',
    );
  }

  let observacion: string | undefined;

  if (body.observacion !== undefined && body.observacion !== null) {
    if (
      typeof body.observacion !== 'string' ||
      body.observacion.trim().length > 500
    ) {
      throw new BadRequestException(
        'La observación debe tener hasta 500 caracteres',
      );
    }

    observacion = body.observacion.trim() || undefined;
  }

  return {
    sucursalId: id(body.sucursalId, 'sucursalId'),
    varianteId: id(body.varianteId, 'varianteId'),
    tipoMovimiento:
      body.tipoMovimiento as TipoMovimientoInventario,
    cantidad: body.cantidad,
    observacion,
  };
}

export function movementSearchInput(query: {
  sucursalId?: unknown;
  varianteId?: unknown;
  after?: unknown;
}) {
  return {
    sucursalId:
      query.sucursalId === undefined || query.sucursalId === ''
        ? undefined
        : id(query.sucursalId, 'sucursalId'),

    varianteId:
      query.varianteId === undefined || query.varianteId === ''
        ? undefined
        : id(query.varianteId, 'varianteId'),

    after:
      query.after === undefined || query.after === ''
        ? undefined
        : id(query.after, 'after'),
  };
}