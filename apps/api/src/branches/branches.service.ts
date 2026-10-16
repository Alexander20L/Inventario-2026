import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AccessContext } from '../access/access.types.js';
import { id } from '../access/access.input.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import { branchInput } from './branches.input.js';

function branchView(branch: {
  idSucursal: bigint;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  estado: string;
  creadoEn: Date;
  actualizadoEn: Date;
}) {
  return {
    id: branch.idSucursal.toString(),
    nombre: branch.nombre,
    direccion: branch.direccion,
    telefono: branch.telefono,
    estado: branch.estado,
    creadoEn: branch.creadoEn,
    actualizadoEn: branch.actualizadoEn,
  };
}

function branchConflict(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'Ya existe una sucursal con ese nombre',
    );
  }

  throw error;
}

@Injectable()
export class BranchesService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async branches(access: AccessContext) {
    const rows = await this.prisma.sucursal.findMany({
      where: {
        empresaId: access.empresaId,
      },
      orderBy: [
        { estado: 'asc' },
        { nombre: 'asc' },
      ],
    });

    return {
      items: rows.map(branchView),
    };
  }

  async saveBranch(
    access: AccessContext,
    input: unknown,
    branchId?: string,
  ) {
    const data = branchInput(input);
    const target =
      branchId === undefined
        ? undefined
        : id(branchId, 'sucursalId');

    try {
      if (target) {
        const existing = await this.prisma.sucursal.findFirst({
          where: {
            idSucursal: target,
            empresaId: access.empresaId,
          },
        });

        if (!existing) {
          throw new NotFoundException(
            'Sucursal no encontrada en esta tienda',
          );
        }

        const branch = await this.prisma.sucursal.update({
          where: {
            idSucursal_empresaId: {
              idSucursal: target,
              empresaId: access.empresaId,
            },
          },
          data,
        });

        return branchView(branch);
      }

      const branch = await this.prisma.$transaction(
        async (db) => {
          const created = await db.sucursal.create({
            data: {
              ...data,
              empresaId: access.empresaId,
            },
          });

          const variantes = await db.varianteProducto.findMany({
            where: {
              empresaId: access.empresaId,
            },
            select: {
              idVariante: true,
            },
          });

          if (variantes.length > 0) {
            await db.existencia.createMany({
              data: variantes.map((variante) => ({
                empresaId: access.empresaId,
                sucursalId: created.idSucursal,
                varianteId: variante.idVariante,
                stockActual: 0,
              })),
            });
          }

          return created;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return branchView(branch);
    } catch (error) {
      branchConflict(error);
    }
  }
}