# Conexión local a SQL Server

## Requisitos

- Node.js 24 o superior y pnpm 12.10.1 (declarados en `package.json`).
- SQL Server accesible por TCP en `localhost:1433`.
- Bases `Inventario2026` e `Inventario2026_shadow` creadas.
- Usuario `inventario_dev` con permisos para aplicar migraciones en ambas bases de desarrollo.

La base shadow es auxiliar para `migrate dev`. No debe contener datos de la aplicación.

## Variables locales

Crear `apps/api/.env` usando `apps/api/.env.example` como referencia. Reemplazar
`TU_PASSWORD` en ambas cadenas por la contraseña local del usuario SQL Server,
conservando las llaves de la cadena de conexión. No publicar este archivo: está
excluido de Git. Los valores del ejemplo son solo para desarrollo local.

## Preparar el proyecto

Desde la raíz del repositorio:

```powershell
pnpm install --frozen-lockfile
pnpm --filter api db:validate
pnpm --filter api db:generate
```

Si la terminal todavía usa Node.js 20 o no dispone de pnpm, se puede ejecutar
cada comando con versiones temporales, sin modificar la instalación global:

```powershell
npm exec --yes --package=node@24 -- npm exec --yes --package=pnpm@12.10.1 -- pnpm --filter api db:validate
```

El mismo prefijo sirve para los demás comandos de pnpm de esta guía.

## Aplicar las migraciones existentes

```powershell
pnpm --filter api db:status
pnpm --filter api db:deploy
pnpm --filter api db:status
```

En una base nueva, la primera consulta de estado puede terminar con código de
salida distinto de cero porque hay migraciones pendientes. `db:deploy` aplica
las migraciones existentes; no genera una nueva ni reinicia la base.

La migración inicial crea `EMPRESAS`, `PLANES_SAAS`, `LIMITES_PLAN`,
`SUSCRIPCIONES_EMPRESA` y `LIMITES_EMPRESA`. Prisma también administra su tabla
`_prisma_migrations` para registrar las migraciones aplicadas.

La migración `20261015000000_remove_saas_plans` retira las cuatro tablas de
planes, límites y suscripciones, conservando `EMPRESAS`. La primera versión
no incluye esas funciones. En una instalación nueva se aplican ambas
migraciones en orden y, en ese punto del historial, solo queda `EMPRESAS` como
tabla de negocio. La migración inicial se conserva como historial.

La migración `20261015165302_add_users_and_invitations` agrega `USUARIOS`,
`USUARIOS_EMPRESAS`, `INVITACIONES_EMPRESA` y `SESIONES_ACCESO`. Estas son las
tablas del primer módulo operativo de acceso por invitación.

La migración `20261015203950_add_catalog_and_suppliers` agrega `PRODUCTOS`,
`VARIANTES_PRODUCTO`, `CODIGOS_BARRAS`, `PROVEEDORES` y `PRODUCTOS_PROVEEDORES`.
Define el catálogo y los contactos; no crea stock ni movimientos de inventario.

Para cambios futuros del modelo, utilizar `db:migrate --name nombre_del_cambio`
en desarrollo y revisar el SQL generado. No se necesita este comando para aplicar
la migración inicial existente.

Todos los scripts `db:*` especifican `prisma7.config.ts`, el nombre de la
configuración de Prisma utilizada en este proyecto.

## Comprobar la API

Los comandos `build`, `start`, `start:dev` y `start:debug` de la API regeneran
automáticamente el cliente Prisma antes de compilar. Así se sincronizan los tipos
con `schema.prisma` después de recibir cambios del repositorio. Este paso no
aplica migraciones: la base se actualiza por separado con `db:deploy`.

Si aparecen errores de TypeScript indicando que un modelo no existe en
`PrismaService`, detener el modo watch y volver a ejecutar `start:dev`. También
se puede regenerar explícitamente con `pnpm --filter api db:generate`.

```powershell
pnpm --filter api build
pnpm --filter api start:dev
```

En otra terminal:

```powershell
Invoke-RestMethod -Uri http://localhost:3100/health/database
```

Con una base recién creada y sin empresas, la respuesta esperada es:

```json
{
  "status": "ok",
  "database": "connected",
  "empresas": 0
}
```

Este resultado confirma una consulta real a la tabla `EMPRESAS`; compilar o
generar el cliente Prisma por sí solos no comprueba la conexión a SQL Server.
