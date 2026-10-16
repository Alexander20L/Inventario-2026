# Administración de plataforma

## Objetivo

El sistema distingue entre la administración interna de una empresa y la
administración general de la plataforma SaaS.

Los administradores de plataforma no pertenecen a una empresa concreta y no
utilizan las mismas sesiones, usuarios ni permisos que los usuarios del POS.

La estructura general es:

```text
PLATAFORMA
└── Administrador de Plataforma
    └── Gestión global del SaaS

EMPRESA
├── ADMINISTRADOR
│   ├── Gestión de usuarios
│   ├── Gestión de sucursales
│   ├── Gestión de catálogo
│   └── Gestión de inventario
│
└── TRABAJADOR
    └── Acceso limitado según permisos del backend