# Inventario 2026

Sistema SaaS de inventario y punto de venta diseñado para administrar empresas,
sucursales, productos, inventario, usuarios y, progresivamente, compras, ventas,
cajas, transferencias y reportes.

El proyecto está construido como un monorepo y utiliza una arquitectura modular
con aislamiento multiempresa.

## Arquitectura

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