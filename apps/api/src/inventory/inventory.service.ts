import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../infrastructure/database/prisma.service.js';
import type { AccessContext } from '../access/access.types.js';
import { Prisma } from '../generated/prisma/client.js';

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

  async stockPorSucursal(access: AccessContext, sucursalId: bigint) {
    const sucursal = await this.prisma.sucursal.findFirst({
      where: {
        idSucursal: sucursalId,
        empresaId: access.empresaId,
      },
      select: {
        idSucursal: true,
        nombre: true,
        estado: true,
      },
    });

    if (!sucursal) {
      throw new NotFoundException('La sucursal no existe');
    }

    const existencias = await this.prisma.existencia.findMany({
      where: {
        empresaId: access.empresaId,
        sucursalId,
      },
      select: {
        varianteId: true,
        stockActual: true,
        actualizadoEn: true,
        variante: {
          select: {
            nombre: true,
            precioVenta: true,
            stockMinimo: true,
            producto: {
              select: {
                idProducto: true,
                nombre: true,
                presentacion: true,
                estado: true,
              },
            },
            codigos: {
              select: {
                codigo: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        idExistencia: 'asc',
      },
    });

    return {
      sucursal: {
        id: sucursal.idSucursal.toString(),
        nombre: sucursal.nombre,
        estado: sucursal.estado,
      },
      productos: existencias.map((existencia) => ({
        productoId: existencia.variante.producto.idProducto.toString(),
        varianteId: existencia.varianteId.toString(),
        nombre: existencia.variante.producto.nombre,
        presentacion: existencia.variante.producto.presentacion,
        variante: existencia.variante.nombre,
        codigoBarras: existencia.variante.codigos[0]?.codigo ?? null,
        precioVenta: existencia.variante.precioVenta.toString(),
        stockActual: existencia.stockActual,
        stockMinimo: existencia.variante.stockMinimo,
        estado: existencia.variante.producto.estado,
        actualizadoEn: existencia.actualizadoEn,
      })),
    };
  }
  async movimientos(
    access: AccessContext,
    filters: {
      sucursalId?: bigint;
      varianteId?: bigint;
      after?: bigint;
    },
  ) {
    const rows = await this.prisma.movimientoInventario.findMany({
      where: {
        empresaId: access.empresaId,
        ...(filters.sucursalId ? { sucursalId: filters.sucursalId } : {}),
        ...(filters.varianteId ? { varianteId: filters.varianteId } : {}),
        ...(filters.after ? { idMovimiento: { lt: filters.after } } : {}),
      },
      select: {
        idMovimiento: true,
        tipoMovimiento: true,
        cantidad: true,
        stockAnterior: true,
        stockPosterior: true,
        costoUnitario: true,
        observacion: true,
        fechaHora: true,

        sucursal: {
          select: {
            idSucursal: true,
            nombre: true,
          },
        },

        variante: {
          select: {
            idVariante: true,
            nombre: true,
            producto: {
              select: {
                idProducto: true,
                nombre: true,
              },
            },
          },
        },

        usuarioEmpresa: {
          select: {
            usuario: {
              select: {
                idUsuario: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        idMovimiento: 'desc',
      },
      take: 51,
    });

    const hasMore = rows.length > 50;
    const page = hasMore ? rows.slice(0, 50) : rows;

    return {
      items: page.map((movimiento) => ({
        id: movimiento.idMovimiento.toString(),
        tipoMovimiento: movimiento.tipoMovimiento,
        cantidad: movimiento.cantidad,
        stockAnterior: movimiento.stockAnterior,
        stockPosterior: movimiento.stockPosterior,
        costoUnitario: movimiento.costoUnitario?.toString() ?? null,
        observacion: movimiento.observacion,
        fechaHora: movimiento.fechaHora,

        sucursal: {
          id: movimiento.sucursal.idSucursal.toString(),
          nombre: movimiento.sucursal.nombre,
        },

        producto: {
          id: movimiento.variante.producto.idProducto.toString(),
          nombre: movimiento.variante.producto.nombre,
        },

        variante: {
          id: movimiento.variante.idVariante.toString(),
          nombre: movimiento.variante.nombre,
        },

        usuario: {
          id: movimiento.usuarioEmpresa.usuario.idUsuario.toString(),
          nombre: movimiento.usuarioEmpresa.usuario.nombre,
        },
      })),

      nextCursor: hasMore
        ? page[page.length - 1].idMovimiento.toString()
        : null,
    };
  }

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

    if (tiposPositivos.includes(input.tipoMovimiento) && input.cantidad < 0) {
      throw new BadRequestException(
        'Este tipo de movimiento requiere una cantidad positiva',
      );
    }

    if (tiposNegativos.includes(input.tipoMovimiento) && input.cantidad > 0) {
      throw new BadRequestException(
        'Este tipo de movimiento requiere una cantidad negativa',
      );
    }

    return this.prisma.$transaction(
      async (db) => {
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
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
