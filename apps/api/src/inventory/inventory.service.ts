import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service.js';
import type { AccessContext } from '../access/access.types.js';

export type TipoMovimientoInventario =
  | 'ENTRADA_INICIAL'
  | 'ENTRADA_MANUAL'
  | 'SALIDA_MANUAL'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO';

interface RegistrarMovimientoInput {
  sucursalId: bigint;
  varianteId: bigint;
  tipoMovimiento: TipoMovimientoInventario;
  cantidad: number;
  observacion?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async registrarMovimiento(
    access: AccessContext,
    input: RegistrarMovimientoInput,
  ) {
    if (!Number.isInteger(input.cantidad) || input.cantidad === 0) {
      throw new BadRequestException(
        'La cantidad debe ser un número entero distinto de cero',
      );
    }

    const tiposPositivos: TipoMovimientoInventario[] = [
      'ENTRADA_INICIAL',
      'ENTRADA_MANUAL',
      'AJUSTE_POSITIVO',
    ];

    const tiposNegativos: TipoMovimientoInventario[] = [
      'SALIDA_MANUAL',
      'AJUSTE_NEGATIVO',
    ];

    if (
      tiposPositivos.includes(input.tipoMovimiento) &&
      input.cantidad < 0
    ) {
      throw new BadRequestException(
        'Este tipo de movimiento requiere una cantidad positiva',
      );
    }

    if (
      tiposNegativos.includes(input.tipoMovimiento) &&
      input.cantidad > 0
    ) {
      throw new BadRequestException(
        'Este tipo de movimiento requiere una cantidad negativa',
      );
    }

    return this.prisma.$transaction(async (db) => {
      const existencia = await db.existencia.findFirst({
        where: {
          empresaId: access.empresaId,
          sucursalId: input.sucursalId,
          varianteId: input.varianteId,
        },
      });

      if (!existencia) {
        throw new NotFoundException(
          'No existe stock para esta variante en la sucursal indicada',
        );
      }

      const actualizado = await db.existencia.updateMany({
        where: {
          idExistencia: existencia.idExistencia,
          empresaId: access.empresaId,
          ...(input.cantidad < 0
            ? {
                stockActual: {
                  gte: Math.abs(input.cantidad),
                },
              }
            : {}),
        },
        data: {
          stockActual: {
            increment: input.cantidad,
          },
        },
      });

      if (actualizado.count !== 1) {
        throw new BadRequestException('Stock insuficiente');
      }

      const nuevaExistencia = await db.existencia.findUniqueOrThrow({
        where: {
          idExistencia: existencia.idExistencia,
        },
      });

      const stockPosterior = nuevaExistencia.stockActual;
      const stockAnterior = stockPosterior - input.cantidad;

      const movimiento = await db.movimientoInventario.create({
        data: {
          empresaId: access.empresaId,
          sucursalId: input.sucursalId,
          varianteId: input.varianteId,
          usuarioId: access.usuarioId,
          tipoMovimiento: input.tipoMovimiento,
          cantidad: input.cantidad,
          stockAnterior,
          stockPosterior,
          observacion: input.observacion,
        },
      });

      return {
        movimientoId: movimiento.idMovimiento.toString(),
        stockAnterior,
        cantidad: input.cantidad,
        stockPosterior,
      };
    });
  }
}