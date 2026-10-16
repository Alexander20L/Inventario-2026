import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/infrastructure/database/prisma.service.js';
import { InventoryService } from '../dist/inventory/inventory.service.js';

await test('Catálogo, proveedores e integridad multiempresa en SQL Server', async (t) => {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  const db = app.get(PrismaService);
  const inventory = app.get(InventoryService);
  const prefix = `cat-${randomUUID().slice(0, 8)}`;
  const password = `Test-${randomUUID()}`;
  let owner, other, worker, supplier, otherSupplier, product;
  const body = {
    nombre: 'Café de prueba',
    presentacion: '250 g',
    codigoBarras: `000-${prefix}`,
    precioVenta: '12.50',
    stockMinimo: 10,
    estado: 'ACTIVO',
    proveedorIds: [],
  };
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    async function request(
      path,
      method = 'GET',
      data,
      token = owner?.accessToken,
    ) {
      const response = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
      return { status: response.status, body: await response.json() };
    }
    async function register(suffix) {
      const response = await request(
        '/auth/register-company',
        'POST',
        {
          nombre: `Admin ${suffix}`,
          correo: `${prefix}-${suffix}@example.test`,
          password,
          nombreEmpresa: `${prefix} ${suffix}`,
          numeroDocumento: `${prefix}-${suffix}`,
        },
        '',
      );
      assert.equal(response.status, 201);
      return response.body;
    }
    owner = await register('a');
    other = await register('b');
    const invitation = (
      await request('/invitations', 'POST', {
        correo: `${prefix}-worker@example.test`,
      })
    ).body;
    worker = (
      await request(
        '/auth/accept-invitation',
        'POST',
        { token: invitation.token, nombre: 'Trabajador prueba', password },
        '',
      )
    ).body;

    await t.test(
      'solo administradores pueden leer y modificar el catálogo',
      async () => {
        for (const path of ['/products', '/suppliers']) {
          assert.equal((await request(path, 'GET', undefined, '')).status, 401);
          assert.equal(
            (await request(path, 'GET', undefined, worker.accessToken)).status,
            403,
          );
          assert.equal(
            (await request(path, 'POST', {}, worker.accessToken)).status,
            403,
          );
        }
      },
    );

    await t.test(
      'contactos propios, campos opcionales y validación del teléfono',
      async () => {
        assert.equal(
          (
            await request('/suppliers', 'POST', {
              nombreContacto: 'Inválido',
              telefono: 'abc',
            })
          ).status,
          400,
        );
        const created = await request('/suppliers', 'POST', {
          nombreContacto: 'Elena Torres',
          telefono: '+51 999 123 456',
          distribuidora: 'Distribuidora Norte',
          correo: '   ',
          diasVisita: 'Lunes y jueves',
          empresaId: other.empresaId,
        });
        assert.equal(created.status, 201);
        supplier = created.body;
        assert.equal(supplier.correo, null);
        assert.equal(supplier.productosCount, 0);
        otherSupplier = (
          await request(
            '/suppliers',
            'POST',
            { nombreContacto: 'Contacto otra tienda', telefono: '999123456' },
            other.accessToken,
          )
        ).body;
        assert.equal(
          (
            await request(
              `/suppliers/${supplier.id}`,
              'GET',
              undefined,
              other.accessToken,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/suppliers/${supplier.id}`,
              'PUT',
              { nombreContacto: 'Ataque', telefono: '999123456' },
              other.accessToken,
            )
          ).status,
          404,
        );
      },
    );

    await t.test(
      'producto simple con variante interna, decimal exacto y ceros en el código',
      async () => {
        const created = await request('/products', 'POST', {
          ...body,
          proveedorIds: [supplier.id],
          empresaId: other.empresaId,
        });
        assert.equal(created.status, 201);
        product = created.body;

        const sucursales = await db.sucursal.findMany({
          where: { empresaId: BigInt(owner.empresaId) },
        });

        const existencias = await db.existencia.findMany({
          where: {
            empresaId: BigInt(owner.empresaId),
            varianteId: BigInt(product.varianteId),
          },
        });

        assert.equal(existencias.length, sucursales.length);
        assert.ok(
          existencias.every((existencia) => existencia.stockActual === 0),
        );

        assert.equal(product.precioVenta, '12.50');
        assert.equal(product.codigoBarras, body.codigoBarras);
        assert.equal(product.proveedores[0].id, supplier.id);
        const variant = await db.varianteProducto.findUniqueOrThrow({
          where: { idVariante: BigInt(product.varianteId) },
        });
        assert.equal(variant.empresaId.toString(), owner.empresaId);
        assert.equal(variant.nombre, 'DEFAULT');
        assert.equal(
          (
            await request(
              `/products/${product.id}`,
              'GET',
              undefined,
              other.accessToken,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/products/${product.id}`,
              'PUT',
              body,
              other.accessToken,
            )
          ).status,
          404,
        );
        assert.equal(
          (await request(`/suppliers/${supplier.id}`)).body.productos.items[0]
            .id,
          product.id,
        );
        assert.equal(
          (await request('/products?q=000-' + prefix)).body.items.length,
          1,
        );
        assert.equal(
          (await request('/suppliers?q=Caf%C3%A9')).body.items[0].id,
          supplier.id,
        );
        assert.equal(
          (await request('/products', 'GET', undefined, other.accessToken)).body
            .items.length,
          0,
        );
      },
    );
    await t.test(
      'entrada y salida de stock generan movimientos consistentes',
      async () => {
        const sucursal = await db.sucursal.findFirstOrThrow({
          where: {
            empresaId: BigInt(owner.empresaId),
          },
        });

        const access = {
          empresaId: BigInt(owner.empresaId),
          usuarioId: BigInt(owner.usuario.id),
        };

        const entrada = await inventory.registrarMovimiento(access, {
          sucursalId: sucursal.idSucursal,
          varianteId: BigInt(product.varianteId),
          tipoMovimiento: 'ENTRADA_INICIAL',
          cantidad: 25,
          observacion: 'Stock inicial de prueba',
        });

        assert.equal(entrada.stockAnterior, 0);
        assert.equal(entrada.cantidad, 25);
        assert.equal(entrada.stockPosterior, 25);

        const salida = await inventory.registrarMovimiento(access, {
          sucursalId: sucursal.idSucursal,
          varianteId: BigInt(product.varianteId),
          tipoMovimiento: 'SALIDA_MANUAL',
          cantidad: -3,
          observacion: 'Salida de prueba',
        });

        assert.equal(salida.stockAnterior, 25);
        assert.equal(salida.cantidad, -3);
        assert.equal(salida.stockPosterior, 22);

        const existencia = await db.existencia.findFirstOrThrow({
          where: {
            empresaId: BigInt(owner.empresaId),
            sucursalId: sucursal.idSucursal,
            varianteId: BigInt(product.varianteId),
          },
        });

        assert.equal(existencia.stockActual, 22);

        const movimientos = await db.movimientoInventario.findMany({
          where: {
            empresaId: BigInt(owner.empresaId),
            sucursalId: sucursal.idSucursal,
            varianteId: BigInt(product.varianteId),
          },
          orderBy: {
            idMovimiento: 'asc',
          },
        });

        assert.equal(movimientos.length, 2);
        assert.equal(movimientos[0].stockAnterior, 0);
        assert.equal(movimientos[0].stockPosterior, 25);
        assert.equal(movimientos[1].stockAnterior, 25);
        assert.equal(movimientos[1].stockPosterior, 22);
      },
    );
    await t.test(
      'consulta de stock por sucursal respeta autenticación y empresa',
      async () => {
        const sucursal = await db.sucursal.findFirstOrThrow({
          where: {
            empresaId: BigInt(owner.empresaId),
          },
        });

        const path = `/inventory/stock/${sucursal.idSucursal.toString()}`;

        const sinSesion = await request(path, 'GET', undefined, '');
        assert.equal(sinSesion.status, 401);

        const respuesta = await request(path);
        assert.equal(respuesta.status, 200);

        assert.equal(
          respuesta.body.sucursal.id,
          sucursal.idSucursal.toString(),
        );
        assert.equal(respuesta.body.sucursal.nombre, sucursal.nombre);

        const productoStock = respuesta.body.productos.find(
          (item) => item.varianteId === product.varianteId,
        );

        assert.ok(productoStock);
        assert.equal(productoStock.stockActual, 22);
        assert.equal(productoStock.nombre, body.nombre);
        assert.equal(productoStock.codigoBarras, body.codigoBarras);

        const trabajador = await request(
          path,
          'GET',
          undefined,
          worker.accessToken,
        );

        assert.equal(trabajador.status, 200);

        const sucursalOtraEmpresa = await db.sucursal.findFirstOrThrow({
          where: {
            empresaId: BigInt(other.empresaId),
          },
        });

        const intentoCruzado = await request(
          `/inventory/stock/${sucursalOtraEmpresa.idSucursal.toString()}`,
        );

        assert.equal(intentoCruzado.status, 404);
      },
    );
    await t.test(
      'endpoint de movimientos permite ajustes al administrador y protege el stock',
      async () => {
        const sucursal = await db.sucursal.findFirstOrThrow({
          where: {
            empresaId: BigInt(owner.empresaId),
          },
        });

        const payload = {
          sucursalId: sucursal.idSucursal.toString(),
          varianteId: product.varianteId,
          tipoMovimiento: 'ENTRADA_MANUAL',
          cantidad: 5,
          observacion: 'Entrada desde API',
        };

        const trabajador = await request(
          '/inventory/movements',
          'POST',
          payload,
          worker.accessToken,
        );

        assert.equal(trabajador.status, 403);

        const entrada = await request('/inventory/movements', 'POST', payload);

        assert.equal(entrada.status, 201);
        assert.equal(entrada.body.stockAnterior, 22);
        assert.equal(entrada.body.cantidad, 5);
        assert.equal(entrada.body.stockPosterior, 27);

        const salida = await request('/inventory/movements', 'POST', {
          sucursalId: sucursal.idSucursal.toString(),
          varianteId: product.varianteId,
          tipoMovimiento: 'SALIDA_MANUAL',
          cantidad: 2,
          observacion: 'Salida desde API',
        });

        assert.equal(salida.status, 201);
        assert.equal(salida.body.stockAnterior, 27);
        assert.equal(salida.body.cantidad, -2);
        assert.equal(salida.body.stockPosterior, 25);

        const insuficiente = await request('/inventory/movements', 'POST', {
          sucursalId: sucursal.idSucursal.toString(),
          varianteId: product.varianteId,
          tipoMovimiento: 'SALIDA_MANUAL',
          cantidad: 1000,
        });

        assert.equal(insuficiente.status, 400);

        const existencia = await db.existencia.findFirstOrThrow({
          where: {
            empresaId: BigInt(owner.empresaId),
            sucursalId: sucursal.idSucursal,
            varianteId: BigInt(product.varianteId),
          },
        });

        assert.equal(existencia.stockActual, 25);
      },
    );
    await t.test(
      'historial de movimientos respeta empresa y filtros',
      async () => {
        const sucursal = await db.sucursal.findFirstOrThrow({
          where: {
            empresaId: BigInt(owner.empresaId),
          },
        });

        const historial = await request('/inventory/movements');

        assert.equal(historial.status, 200);
        assert.ok(historial.body.items.length >= 4);

        const filtrado = await request(
          `/inventory/movements?sucursalId=${sucursal.idSucursal.toString()}&varianteId=${product.varianteId}`,
        );

        assert.equal(filtrado.status, 200);
        assert.ok(filtrado.body.items.length >= 4);

        assert.ok(
          filtrado.body.items.every(
            (item) =>
              item.sucursal.id === sucursal.idSucursal.toString() &&
              item.variante.id === product.varianteId,
          ),
        );

        const historialOtraEmpresa = await request(
          '/inventory/movements',
          'GET',
          undefined,
          other.accessToken,
        );

        assert.equal(historialOtraEmpresa.status, 200);

        assert.equal(
          historialOtraEmpresa.body.items.some(
            (item) => item.variante.id === product.varianteId,
          ),
          false,
        );
      },
    );

    await t.test(
      'unicidad por tienda, conflictos atómicos y actualización sin duplicar variante',
      async () => {
        assert.equal((await request('/products', 'POST', body)).status, 409);
        assert.equal(
          await db.producto.count({
            where: { empresaId: BigInt(owner.empresaId) },
          }),
          1,
        );
        const inOtherStore = await request(
          '/products',
          'POST',
          body,
          other.accessToken,
        );
        assert.equal(inOtherStore.status, 201);
        const second = (
          await request('/products', 'POST', {
            ...body,
            codigoBarras: `${prefix}-second`,
          })
        ).body;
        const failedEdit = await request(`/products/${product.id}`, 'PUT', {
          ...body,
          codigoBarras: second.codigoBarras,
          nombre: 'Nombre que no debe guardarse',
        });
        assert.equal(failedEdit.status, 409);
        assert.equal(
          (await request(`/products/${product.id}`)).body.nombre,
          body.nombre,
        );
        assert.equal(
          (await request(`/products/${product.id}`)).body.proveedores.length,
          1,
        );
        const updated = await request(`/products/${product.id}`, 'PUT', {
          ...body,
          precioVenta: '0.10',
          estado: 'INACTIVO',
          proveedorIds: [supplier.id],
        });
        assert.equal(updated.status, 200);
        assert.equal(updated.body.precioVenta, '0.10');
        assert.equal(updated.body.varianteId, product.varianteId);
        assert.equal(
          await db.varianteProducto.count({
            where: { productoId: BigInt(product.id) },
          }),
          1,
        );
        assert.equal(
          (await request('/products?estado=INACTIVO')).body.items.length,
          1,
        );
        assert.equal(
          (
            await request(
              '/products?estado=INACTIVO&proveedorId=' + supplier.id,
            )
          ).body.items[0].id,
          product.id,
        );
      },
    );

    await t.test(
      'proveedores de otra tienda rechazados en API y también por SQL Server',
      async () => {
        assert.equal(
          (
            await request('/products', 'POST', {
              ...body,
              codigoBarras: `${prefix}-bad-link`,
              proveedorIds: [otherSupplier.id],
            })
          ).status,
          400,
        );
        assert.equal(
          await db.producto.count({
            where: { empresaId: BigInt(owner.empresaId) },
          }),
          2,
        );
        await assert.rejects(
          db.productoProveedor.create({
            data: {
              empresaId: BigInt(owner.empresaId),
              productoId: BigInt(product.id),
              proveedorId: BigInt(otherSupplier.id),
            },
          }),
          (error) => error.code === 'P2003',
        );
      },
    );

    await t.test(
      'precio y mínimo inválidos rechazados; restricciones SQL sin negativos',
      async () => {
        for (const invalid of [
          { precioVenta: 12.5 },
          { precioVenta: '-1' },
          { precioVenta: '1.001' },
          { precioVenta: '10000000000' },
          { stockMinimo: -1 },
          { stockMinimo: 1.5 },
          { stockMinimo: '1' },
        ]) {
          assert.equal(
            (await request('/products', 'POST', { ...body, ...invalid }))
              .status,
            400,
          );
        }
        await assert.rejects(
          db.varianteProducto.update({
            where: { idVariante: BigInt(product.varianteId) },
            data: { precioVenta: '-1.00' },
          }),
        );
        assert.equal((await request('/products?estado=OTRO')).status, 400);
        assert.equal((await request('/products?after=0')).status, 400);
      },
    );

    await t.test(
      'desactivar el contacto conserva las asociaciones',
      async () => {
        const updated = await request(`/suppliers/${supplier.id}`, 'PUT', {
          nombreContacto: 'Elena Torres',
          telefono: '+51 999 123 456',
          estado: 'INACTIVO',
          notas: 'Solo bajo pedido',
        });
        assert.equal(updated.status, 200);
        assert.equal(updated.body.productosCount, 1);
        assert.equal(
          (await request(`/products/${product.id}`)).body.proveedores[0].estado,
          'INACTIVO',
        );
        assert.equal(
          (await request('/suppliers?estado=INACTIVO')).body.items.length,
          1,
        );
      },
    );

    await t.test(
      'paginación por cursor sin duplicados y separación de búsquedas',
      async () => {
        await db.proveedor.createMany({
          data: Array.from({ length: 51 }, (_, index) => ({
            empresaId: BigInt(owner.empresaId),
            nombreContacto: `${prefix}-page-${index}`,
            telefono: '999123456',
          })),
        });
        const first = (await request('/suppliers?q=' + prefix + '-page')).body;
        assert.equal(first.items.length, 50);
        assert.ok(first.nextCursor);
        const next = (
          await request(
            '/suppliers?q=' + prefix + '-page&after=' + first.nextCursor,
          )
        ).body;
        assert.equal(next.items.length, 1);
        assert.equal(next.nextCursor, null);
        assert.equal(
          first.items.some((item) => item.id === next.items[0].id),
          false,
        );
        assert.equal(
          (
            await request(
              '/suppliers?q=' + prefix + '-page',
              'GET',
              undefined,
              other.accessToken,
            )
          ).body.items.length,
          0,
        );
      },
    );
  } finally {
    try {
      const empresas = await db.empresa.findMany({
        where: { numeroDocumento: { startsWith: prefix } },
        select: { idEmpresa: true },
      });
      const usuarios = await db.usuario.findMany({
        where: { correo: { startsWith: prefix } },
        select: { idUsuario: true },
      });
      const empresaId = { in: empresas.map((empresa) => empresa.idEmpresa) };
      const usuarioId = { in: usuarios.map((usuario) => usuario.idUsuario) };
      await db.$transaction(async (tx) => {
        await tx.productoProveedor.deleteMany({ where: { empresaId } });
        await tx.movimientoInventario.deleteMany({ where: { empresaId } });
        await tx.existencia.deleteMany({ where: { empresaId } });
        await tx.codigoBarras.deleteMany({ where: { empresaId } });
        await tx.varianteProducto.deleteMany({ where: { empresaId } });
        await tx.producto.deleteMany({ where: { empresaId } });
        await tx.proveedor.deleteMany({ where: { empresaId } });
        await tx.sesionAcceso.deleteMany({
          where: { OR: [{ empresaId }, { usuarioId }] },
        });
        await tx.invitacionEmpresa.deleteMany({
          where: { OR: [{ empresaId }, { creadoPorId: usuarioId }] },
        });
        await tx.usuarioEmpresa.deleteMany({
          where: { OR: [{ empresaId }, { usuarioId }] },
        });

        await tx.sucursal.deleteMany({
          where: { empresaId },
        });

        await tx.empresa.deleteMany({ where: { idEmpresa: empresaId } });
        await tx.usuario.deleteMany({ where: { idUsuario: usuarioId } });
      });
    } finally {
      await app.close();
    }
  }
});
