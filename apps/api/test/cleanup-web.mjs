import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/infrastructure/database/prisma.service.js';

const prefix = process.argv[2];
if (!/^web-[a-f0-9]{8}$/.test(prefix ?? ''))
  throw new Error('Prefijo de prueba web no válido');
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error'],
});
try {
  const db = app.get(PrismaService);
  const empresas = await db.empresa.findMany({
    where: { numeroDocumento: prefix },
    select: { idEmpresa: true },
  });
  const usuarios = await db.usuario.findMany({
    where: { correo: { startsWith: `${prefix}-` } },
    select: { idUsuario: true },
  });
  const empresaId = { in: empresas.map((empresa) => empresa.idEmpresa) };
  const usuarioId = { in: usuarios.map((usuario) => usuario.idUsuario) };
  await db.$transaction(async (tx) => {
    await tx.productoProveedor.deleteMany({ where: { empresaId } });
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
    await tx.empresa.deleteMany({ where: { idEmpresa: empresaId } });
    await tx.usuario.deleteMany({ where: { idUsuario: usuarioId } });
  });
  console.log('Registros temporales de la prueba web eliminados.');
} finally {
  await app.close();
}
