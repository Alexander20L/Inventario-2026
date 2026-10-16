import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/infrastructure/database/prisma.service.js';

// Prueba de integración explícita: usa SQL Server y elimina solo sus registros
// identificados por un prefijo aleatorio. No reinicia ni vacía la base.
await test('Acceso por invitación y aislamiento entre tiendas en SQL Server', async (t) => {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  const prefix = `it-${randomUUID().slice(0, 8)}`;
  const clave = `Test-${randomUUID()}`;
  const db = app.get(PrismaService);
  let owner;
  let other;
  let worker;
  let invitation;
  let workerMembership;
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    async function request(path, method = 'GET', body, token) {
      const response = await fetch(base + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, body: await response.json() };
    }
    const ownerBody = {
      nombre: 'Administrador prueba',
      correo: `${prefix}-owner@example.test`,
      password: clave,
      nombreEmpresa: `${prefix} tienda`,
      numeroDocumento: `${prefix}-1`,
    };

    await t.test(
      'crear tienda y administrador de forma atómica; rechazar duplicados',
      async () => {
        const created = await request(
          '/auth/register-company',
          'POST',
          ownerBody,
        );
        assert.equal(created.status, 201);
        owner = created.body;
        assert.equal(owner.rol, 'ADMINISTRADOR');

        const sucursales = await db.sucursal.findMany({
          where: { empresaId: BigInt(owner.empresaId) },
        });
        assert.equal(sucursales.length, 1);
        assert.equal(sucursales[0].nombre, 'Sucursal Principal');
        assert.equal(sucursales[0].estado, 'ACTIVO');

        const duplicate = await request('/auth/register-company', 'POST', {
          ...ownerBody,
          correo: `${prefix}-duplicate@example.test`,
        });
        assert.equal(duplicate.status, 409);
        assert.equal(
          await db.usuario.count({
            where: { correo: `${prefix}-duplicate@example.test` },
          }),
          0,
        );
        other = (
          await request('/auth/register-company', 'POST', {
            ...ownerBody,
            correo: `${prefix}-other@example.test`,
            numeroDocumento: `${prefix}-2`,
          })
        ).body;
        const me = await request(
          '/auth/me',
          'GET',
          undefined,
          owner.accessToken,
        );
        assert.equal(me.body.empresa.id, owner.empresaId);
        assert.equal((await request('/auth/me')).status, 401);
      },
    );

    await t.test(
      'login válido y rechazo de contraseña o tienda incorrectas',
      async () => {
        assert.equal(
          (
            await request('/auth/login', 'POST', {
              correo: ownerBody.correo,
              password: `${clave}-wrong`,
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request('/auth/login', 'POST', {
              correo: ownerBody.correo,
              password: clave,
              empresaId: other.empresaId,
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request('/auth/login', 'POST', {
              correo: ownerBody.correo.toUpperCase(),
              password: clave,
            })
          ).status,
          200,
        );
      },
    );

    await t.test(
      'el contexto autenticado determina la tienda; el token no se guarda en claro',
      async () => {
        const created = await request(
          '/invitations',
          'POST',
          {
            correo: `${prefix}-worker@example.test`,
            empresaId: other.empresaId,
          },
          owner.accessToken,
        );
        assert.equal(created.status, 201);
        invitation = created.body;
        const stored = await db.invitacionEmpresa.findUniqueOrThrow({
          where: { idInvitacion: BigInt(invitation.id) },
        });
        assert.equal(stored.empresaId.toString(), owner.empresaId);
        assert.notEqual(stored.tokenHash, invitation.token);
        const preview = await request('/auth/invitation-preview', 'POST', {
          token: invitation.token,
        });
        assert.equal(preview.status, 200);
        assert.equal(preview.body.estado, 'PENDIENTE');
        assert.equal(preview.body.correo, `${prefix}-worker@example.test`);
        assert.equal(preview.body.tieneCuenta, false);
        assert.equal(preview.body.tokenHash, undefined);
        assert.equal(
          (
            await request('/auth/invitation-preview', 'POST', {
              token: '0'.repeat(64),
            })
          ).status,
          400,
        );
        const listed = await request(
          '/invitations',
          'GET',
          undefined,
          owner.accessToken,
        );
        assert.equal(listed.body[0].estado, 'PENDIENTE');
        assert.equal(listed.body[0].token, undefined);
        assert.equal(listed.body[0].tokenHash, undefined);
        assert.equal(
          (
            await request(
              `/invitations/${invitation.id}/revoke`,
              'POST',
              {},
              other.accessToken,
            )
          ).status,
          404,
        );
        assert.equal(
          (await request('/invitations', 'GET', undefined, other.accessToken))
            .body.length,
          0,
        );
      },
    );

    await t.test(
      'aceptación única sin posibilidad de cambiar correo, rol o tienda',
      async () => {
        const accepted = await request('/auth/accept-invitation', 'POST', {
          token: invitation.token,
          nombre: 'Trabajador prueba',
          password: clave,
          rol: 'ADMINISTRADOR',
          correo: ownerBody.correo,
          empresaId: other.empresaId,
        });
        assert.equal(accepted.status, 201);
        worker = accepted.body;
        assert.equal(worker.rol, 'TRABAJADOR');
        assert.equal(worker.usuario.correo, `${prefix}-worker@example.test`);
        assert.equal(worker.empresaId, owner.empresaId);
        const preview = await request('/auth/invitation-preview', 'POST', {
          token: invitation.token,
        });
        assert.equal(preview.body.estado, 'ACEPTADA');
        assert.equal(preview.body.tieneCuenta, true);
        assert.equal(
          (
            await request('/auth/accept-invitation', 'POST', {
              token: invitation.token,
              nombre: 'Otro',
              password: clave,
            })
          ).status,
          400,
        );
        const stored = await db.usuario.findUniqueOrThrow({
          where: { correo: worker.usuario.correo },
        });
        assert.notEqual(stored.passwordHash, clave);
        const session = await db.sesionAcceso.findFirstOrThrow({
          where: { usuarioId: stored.idUsuario },
        });
        assert.notEqual(session.tokenHash, worker.accessToken);
      },
    );

    await t.test(
      'trabajador sin acceso a administración; trabajador deshabilitado pierde sesión',
      async () => {
        for (const path of ['/invitations', '/users']) {
          assert.equal(
            (await request(path, 'GET', undefined, worker.accessToken)).status,
            403,
          );
        }
        assert.equal(
          (
            await request(
              '/invitations',
              'POST',
              { correo: `${prefix}-unauthorized@example.test` },
              worker.accessToken,
            )
          ).status,
          403,
        );
        const users = await request(
          '/users',
          'GET',
          undefined,
          owner.accessToken,
        );
        workerMembership = users.body.find(
          (user) => user.usuarioId === worker.usuario.id,
        );
        assert.ok(workerMembership);
        assert.equal(
          (
            await request(
              `/users/${workerMembership.id}/status`,
              'PATCH',
              { estado: 'INACTIVO' },
              other.accessToken,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/users/${workerMembership.id}/status`,
              'PATCH',
              { estado: 'INACTIVO' },
              owner.accessToken,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request('/auth/me', 'GET', undefined, worker.accessToken))
            .status,
          401,
        );
        assert.equal(
          (
            await request('/auth/login', 'POST', {
              correo: worker.usuario.correo,
              password: clave,
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request(
              `/users/${workerMembership.id}/status`,
              'PATCH',
              { estado: 'ACTIVO' },
              owner.accessToken,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request('/auth/me', 'GET', undefined, worker.accessToken))
            .status,
          401,
        );
      },
    );

    await t.test(
      'invitaciones revocadas o vencidas no crean usuarios',
      async () => {
        const revoked = (
          await request(
            '/invitations',
            'POST',
            { correo: `${prefix}-revoked@example.test` },
            owner.accessToken,
          )
        ).body;
        await request(
          `/invitations/${revoked.id}/revoke`,
          'POST',
          {},
          owner.accessToken,
        );
        assert.equal(
          (
            await request('/auth/accept-invitation', 'POST', {
              token: revoked.token,
              nombre: 'Revocado',
              password: clave,
            })
          ).status,
          400,
        );
        const expired = (
          await request(
            '/invitations',
            'POST',
            { correo: `${prefix}-expired@example.test` },
            owner.accessToken,
          )
        ).body;
        await db.invitacionEmpresa.update({
          where: { idInvitacion: BigInt(expired.id) },
          data: { expiraEn: new Date(Date.now() - 1000) },
        });
        assert.equal(
          (
            await request('/auth/accept-invitation', 'POST', {
              token: expired.token,
              nombre: 'Vencido',
              password: clave,
            })
          ).status,
          400,
        );
        assert.equal(
          await db.usuario.count({
            where: {
              correo: {
                in: [
                  `${prefix}-revoked@example.test`,
                  `${prefix}-expired@example.test`,
                ],
              },
            },
          }),
          0,
        );
      },
    );

    await t.test(
      'reenviar revoca el token anterior y la aceptación simultánea solo crea un acceso',
      async () => {
        const correo = `${prefix}-concurrent@example.test`;
        const first = (
          await request('/invitations', 'POST', { correo }, owner.accessToken)
        ).body;
        const second = (
          await request('/invitations', 'POST', { correo }, owner.accessToken)
        ).body;
        assert.equal(
          (
            await request('/auth/accept-invitation', 'POST', {
              token: first.token,
              nombre: 'Anterior',
              password: clave,
            })
          ).status,
          400,
        );
        const attempts = await Promise.all([
          request('/auth/accept-invitation', 'POST', {
            token: second.token,
            nombre: 'Concurrente',
            password: clave,
          }),
          request('/auth/accept-invitation', 'POST', {
            token: second.token,
            nombre: 'Concurrente',
            password: clave,
          }),
        ]);
        assert.deepEqual(
          attempts.map((attempt) => attempt.status).sort((a, b) => a - b),
          [201, 400],
        );
        assert.equal(
          await db.usuarioEmpresa.count({
            where: { empresaId: BigInt(owner.empresaId), usuario: { correo } },
          }),
          1,
        );
      },
    );

    await t.test(
      'usuario existente necesita su contraseña al aceptar acceso a otra tienda',
      async () => {
        const invite = (
          await request(
            '/invitations',
            'POST',
            { correo: worker.usuario.correo },
            other.accessToken,
          )
        ).body;
        assert.equal(
          (
            await request('/auth/accept-invitation', 'POST', {
              token: invite.token,
              password: `${clave}-wrong`,
            })
          ).status,
          401,
        );
        const accepted = await request('/auth/accept-invitation', 'POST', {
          token: invite.token,
          password: clave,
        });
        assert.equal(accepted.status, 201);
        assert.equal(accepted.body.usuario.id, worker.usuario.id);
        assert.equal(accepted.body.empresaId, other.empresaId);
        const choose = await request('/auth/login', 'POST', {
          correo: worker.usuario.correo,
          password: clave,
        });
        assert.equal(choose.status, 400);
        assert.equal(choose.body.empresas.length, 2);
        const login = await request('/auth/login', 'POST', {
          correo: worker.usuario.correo,
          password: clave,
          empresaId: owner.empresaId,
        });
        assert.equal(login.status, 200);
      },
    );

    await t.test('sesión vencida y logout invalidan el token', async () => {
      const login = (
        await request('/auth/login', 'POST', {
          correo: ownerBody.correo,
          password: clave,
        })
      ).body;
      assert.equal(
        (await request('/auth/logout', 'POST', {}, login.accessToken)).status,
        200,
      );
      assert.equal(
        (await request('/auth/me', 'GET', undefined, login.accessToken)).status,
        401,
      );
      const another = (
        await request('/auth/login', 'POST', {
          correo: ownerBody.correo,
          password: clave,
        })
      ).body;
      const { createHash } = await import('node:crypto');
      await db.sesionAcceso.update({
        where: {
          tokenHash: createHash('sha256')
            .update(another.accessToken)
            .digest('hex'),
        },
        data: { expiraEn: new Date(Date.now() - 1000) },
      });
      assert.equal(
        (await request('/auth/me', 'GET', undefined, another.accessToken))
          .status,
        401,
      );
    });

    await t.test(
      'identificadores y contraseñas inválidos producen 400',
      async () => {
        assert.equal(
          (
            await request(
              '/invitations/not-an-id/revoke',
              'POST',
              {},
              owner.accessToken,
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await request(
              '/invitations?after=0',
              'GET',
              undefined,
              owner.accessToken,
            )
          ).status,
          400,
        );
        assert.equal(
          (
            await request('/auth/register-company', 'POST', {
              ...ownerBody,
              password: 'short',
            })
          ).status,
          400,
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
