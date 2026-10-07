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