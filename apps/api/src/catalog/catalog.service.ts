import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import type { AccessContext } from '../access/access.types.js';
import { id } from '../access/access.input.js';
import { productInput, searchInput, supplierInput } from './catalog.input.js';

const productInclude = {
  variantes: { where: { nombre: 'DEFAULT' }, include: { codigos: true } },
  proveedores: { include: { proveedor: true } },
} satisfies Prisma.ProductoInclude;

type ProductRecord = Prisma.ProductoGetPayload<{
  include: typeof productInclude;
}>;

function productView(product: ProductRecord) {
  const variant = product.variantes[0];
  return {
    id: product.idProducto.toString(),
    nombre: product.nombre,
    presentacion: product.presentacion,
    estado: product.estado,
    varianteId: variant.idVariante.toString(),
    precioVenta: variant.precioVenta.toFixed(2),
    stockMinimo: variant.stockMinimo,
    codigoBarras: variant.codigos[0]?.codigo ?? '',
    actualizadoEn: product.actualizadoEn,
    proveedores: product.proveedores.map((link) => ({
      id: link.proveedorId.toString(),
      nombreContacto: link.proveedor.nombreContacto,
      distribuidora: link.proveedor.distribuidora,
      telefono: link.proveedor.telefono,
      estado: link.proveedor.estado,
    })),
  };
}

function supplierView(
  supplier: Prisma.ProveedorGetPayload<{
    include: { _count: { select: { productos: true } } };
  }>,
) {
  return {
    id: supplier.idProveedor.toString(),
    nombreContacto: supplier.nombreContacto,
    distribuidora: supplier.distribuidora,
    telefono: supplier.telefono,
    correo: supplier.correo,
    direccion: supplier.direccion,
    numeroDocumento: supplier.numeroDocumento,
    diasVisita: supplier.diasVisita,
    notas: supplier.notas,
    estado: supplier.estado,
    productosCount: supplier._count.productos,
  };
}

function productConflict(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  )
    throw new ConflictException(
      'El código de barras ya está registrado en esta tienda',
    );
  throw error;
}

@Injectable()
export class CatalogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async products(
    access: AccessContext,
    query: Parameters<typeof searchInput>[0],
  ) {
    const { q, estado, after, proveedorId } = searchInput(query);
    const rows = await this.prisma.producto.findMany({
      where: {
        empresaId: access.empresaId,
        ...(estado ? { estado } : {}),
        ...(after ? { idProducto: { lt: after } } : {}),
        ...(proveedorId ? { proveedores: { some: { proveedorId } } } : {}),
        ...(q
          ? {
              OR: [
                { nombre: { contains: q } },
                { presentacion: { contains: q } },
                {
                  variantes: {
                    some: { codigos: { some: { codigo: { contains: q } } } },
                  },
                },
              ],
            }
          : {}),
      },
      include: productInclude,
      orderBy: { idProducto: 'desc' },
      take: 51,
    });
    return {
      items: rows.slice(0, 50).map(productView),
      nextCursor: rows.length > 50 ? rows[49].idProducto.toString() : null,
    };
  }

  async product(access: AccessContext, productId: string) {
    const product = await this.prisma.producto.findFirst({
      where: { idProducto: id(productId), empresaId: access.empresaId },
      include: productInclude,
    });
    if (!product)
      throw new NotFoundException('Producto no encontrado en esta tienda');
    return productView(product);
  }

  async saveProduct(access: AccessContext, input: unknown, productId?: string) {
    const data = productInput(input);
    const target = productId === undefined ? undefined : id(productId);
    try {
      const resultId = await this.prisma.$transaction(async (db) => {
        if (
          target &&
          !(await db.producto.findFirst({
            where: { idProducto: target, empresaId: access.empresaId },
          }))
        )
          throw new NotFoundException('Producto no encontrado en esta tienda');
        const count = await db.proveedor.count({
          where: {
            empresaId: access.empresaId,
            idProveedor: { in: data.proveedorIds },
          },
        });
        if (count !== data.proveedorIds.length)
          throw new BadRequestException(
            'Todos los proveedores deben pertenecer a tu tienda',
          );
        const catalog = {
          nombre: data.nombre,
          presentacion: data.presentacion,
          estado: data.estado,
        };
        const product = target
          ? await db.producto.update({
              where: {
                idProducto_empresaId: {
                  idProducto: target,
                  empresaId: access.empresaId,
                },
              },
              data: catalog,
            })
          : await db.producto.create({
              data: { ...catalog, empresaId: access.empresaId },
            });
        const variantKey = {
          productoId: product.idProducto,
          empresaId: access.empresaId,
          nombre: 'DEFAULT',
        };
        const variant = await db.varianteProducto.upsert({
          where: { productoId_empresaId_nombre: variantKey },
          create: {
            ...variantKey,
            precioVenta: data.precioVenta,
            stockMinimo: data.stockMinimo,
          },
          update: {
            precioVenta: data.precioVenta,
            stockMinimo: data.stockMinimo,
          },
        });
        const codeKey = {
          varianteId: variant.idVariante,
          empresaId: access.empresaId,
        };
        const sucursales = await db.sucursal.findMany({
          where: {
            empresaId: access.empresaId,
          },
          select: {
            idSucursal: true,
          },
        });

        for (const sucursal of sucursales) {
          await db.existencia.upsert({
            where: {
              sucursalId_varianteId: {
                sucursalId: sucursal.idSucursal,
                varianteId: variant.idVariante,
              },
            },
            create: {
              empresaId: access.empresaId,
              sucursalId: sucursal.idSucursal,
              varianteId: variant.idVariante,
              stockActual: 0,
            },
            update: {},
          });
        }
        await db.codigoBarras.upsert({
          where: { varianteId_empresaId: codeKey },
          create: { ...codeKey, codigo: data.codigoBarras },
          update: { codigo: data.codigoBarras },
        });
        await db.productoProveedor.deleteMany({
          where: {
            productoId: product.idProducto,
            empresaId: access.empresaId,
          },
        });
        if (data.proveedorIds.length)
          await db.productoProveedor.createMany({
            data: data.proveedorIds.map((proveedorId) => ({
              productoId: product.idProducto,
              empresaId: access.empresaId,
              proveedorId,
            })),
          });
        return product.idProducto.toString();
      });
      return this.product(access, resultId);
    } catch (error) {
      productConflict(error);
    }
  }

  async suppliers(
    access: AccessContext,
    query: Parameters<typeof searchInput>[0],
  ) {
    const { q, estado, after } = searchInput(query);
    const rows = await this.prisma.proveedor.findMany({
      where: {
        empresaId: access.empresaId,
        ...(estado ? { estado } : {}),
        ...(after ? { idProveedor: { lt: after } } : {}),
        ...(q
          ? {
              OR: [
                { nombreContacto: { contains: q } },
                { distribuidora: { contains: q } },
                {
                  productos: {
                    some: { producto: { nombre: { contains: q } } },
                  },
                },
              ],
            }
          : {}),
      },
      include: { _count: { select: { productos: true } } },
      orderBy: { idProveedor: 'desc' },
      take: 51,
    });
    return {
      items: rows.slice(0, 50).map(supplierView),
      nextCursor: rows.length > 50 ? rows[49].idProveedor.toString() : null,
    };
  }

  async supplier(access: AccessContext, supplierId: string, after?: string) {
    const supplier = await this.prisma.proveedor.findFirst({
      where: { idProveedor: id(supplierId), empresaId: access.empresaId },
      include: { _count: { select: { productos: true } } },
    });
    if (!supplier)
      throw new NotFoundException('Proveedor no encontrado en esta tienda');
    return {
      ...supplierView(supplier),
      productos: await this.products(access, {
        proveedorId: supplierId,
        after,
      }),
    };
  }

  async saveSupplier(
    access: AccessContext,
    input: unknown,
    supplierId?: string,
  ) {
    const data = supplierInput(input);
    const target = supplierId === undefined ? undefined : id(supplierId);
    if (
      target &&
      !(await this.prisma.proveedor.findFirst({
        where: { idProveedor: target, empresaId: access.empresaId },
      }))
    )
      throw new NotFoundException('Proveedor no encontrado en esta tienda');
    const supplier = target
      ? await this.prisma.proveedor.update({
          where: {
            idProveedor_empresaId: {
              idProveedor: target,
              empresaId: access.empresaId,
            },
          },
          data,
          include: { _count: { select: { productos: true } } },
        })
      : await this.prisma.proveedor.create({
          data: { ...data, empresaId: access.empresaId },
          include: { _count: { select: { productos: true } } },
        });
    return supplierView(supplier);
  }
}
