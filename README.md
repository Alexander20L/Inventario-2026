# Inventario 2026

Sistema SaaS de inventario y punto de venta diseñado para administrar empresas, sucursales, productos, inventario, compras, ventas, cajas, usuarios y otras operaciones comerciales.

## Arquitectura

El proyecto utiliza una arquitectura modular basada en un monorepo.

```text
Inventario-2026/
├── apps/
│   ├── api/       # Backend NestJS
│   ├── web/       # Aplicación web Next.js
│   └── mobile/    # Aplicación móvil React Native + Expo
├── packages/
│   ├── contracts/ # Contratos y tipos compartidos
│   ├── config/    # Configuración compartida
│   └── utils/     # Utilidades reutilizables
├── docs/          # Documentación técnica y funcional
├── infra/         # Infraestructura y despliegue
├── scripts/       # Scripts generales del proyecto
└── .github/       # Automatizaciones de GitHub
```

## Base de datos local

La primera versión no incluye planes, suscripciones ni límites de uso.
El esquema actual incluye empresas, usuarios, accesos por tienda, sesiones e
invitaciones, productos y proveedores. Consulta el [flujo de acceso](docs/api/access.md)
y el [catálogo y contactos](docs/api/catalog.md) para utilizar la API.
Los documentos de diseño en `docs/database/01-core-saas.md` y
`docs/database/11-data-model-v2.md` incluyen propuestas de alcance futuro.

Consulta la [guía de conexión a SQL Server](docs/database/12-local-setup.md)
para configurar el entorno, aplicar las migraciones y comprobar la API.

## Aplicación web

El frontend de EN STOCK está en `apps/web/`. Consulta su
[guía de ejecución y pantallas](apps/web/README.md).

En dos terminales, ejecutar `pnpm dev:api` y `pnpm dev:web` desde la raíz.
La web local abre en `http://localhost:3001`; su conexión a la API se configura
en `apps/web/.env.local` (API local en el puerto 3100).
