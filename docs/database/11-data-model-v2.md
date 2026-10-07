# Modelo de Datos V2 - Inventario 2026

## Objetivo

Consolidar las entidades definitivas de la primera versión de la base de
datos multiempresa del sistema SaaS Inventario 2026.

La base de datos será Microsoft SQL Server y utilizará un modelo multi-tenant
compartido.

Todas las entidades comerciales deberán respetar el contexto de empresa.

---

# 1. Núcleo SaaS

## EMPRESAS
Tenant principal del sistema.

## PLANES_SAAS
Planes comerciales disponibles.

## LIMITES_PLAN
Cuotas y límites definidos para cada plan.

## SUSCRIPCIONES_EMPRESA
Historial de planes contratados por cada empresa.

## LIMITES_EMPRESA
Overrides o ampliaciones particulares de límites.

---

# 2. Usuarios y autorización

## USUARIOS
Cuenta global de acceso al sistema.

## ROLES
Roles definidos dentro de cada empresa.

## PERMISOS
Catálogo global de permisos.

## ROLES_PERMISOS
Relación entre roles y permisos.

## USUARIOS_EMPRESAS
Permite que un usuario tenga acceso a una o varias empresas.

## TRABAJADORES
Personas que trabajan dentro de una empresa.

## ROLES_PLATAFORMA
Roles internos administrativos del SaaS.

## USUARIOS_ROLES_PLATAFORMA
Asignación de roles administrativos de plataforma.

---

# 3. Organización y caja

## SUCURSALES
Locales o puntos operativos de cada empresa.

## CAJAS
Puntos de cobro de una sucursal.

## SESIONES_CAJA
Aperturas y cierres de caja.

## MOVIMIENTOS_CAJA
Ingresos y retiros manuales de efectivo.

---

# 4. Catálogo de productos

## CATEGORIAS
Categorías propias de cada empresa.

## MARCAS
Marcas utilizadas por los productos.

## UNIDADES_MEDIDA
Unidades utilizadas para comercializar productos.

## PRODUCTOS
Producto conceptual.

## VARIANTES_PRODUCTO
Unidad comercial concreta utilizada en inventario, compras y ventas.

## ATRIBUTOS
Características configurables.

## PRODUCTOS_ATRIBUTOS
Atributos habilitados para un producto.

## VALORES_ATRIBUTO
Valores posibles de un atributo.

## VARIANTES_VALORES
Valores que describen una variante.

## CODIGOS_BARRAS
Códigos de identificación de variantes.

---

# 5. Inventario

## EXISTENCIAS
Stock actual de una variante por sucursal.

## MOVIMIENTOS_INVENTARIO
Historial de entradas, salidas y ajustes.

## SESIONES_INVENTARIO
Procesos de conteo físico.

## CONTEOS_INVENTARIO
Resultados del conteo por variante.

## TRANSFERENCIAS_STOCK
Traslado entre sucursales.

## DETALLE_TRANSFERENCIAS_STOCK
Variantes incluidas en una transferencia.

---

# 6. Proveedores y compras

## PROVEEDORES
Proveedores propios de cada empresa.

## COMPRAS
Cabecera de una operación de compra.

## DETALLE_COMPRAS
Productos y cantidades incluidos en una compra.

---

# 7. Clientes y ventas

## CLIENTES
Clientes registrados por la empresa.

## VENTAS
Cabecera de una operación de venta.

## DETALLE_VENTAS
Productos incluidos en la venta.

## METODOS_PAGO
Métodos de pago configurados por empresa.

## PAGOS_VENTA
Uno o varios pagos asociados a una venta.

---

# 8. Aplicación móvil y web

## DISPOSITIVOS_APP
Dispositivos autorizados.

## SESIONES_APP_WEB
Sesiones de vinculación entre móvil y web.

## EVENTOS_APP_WEB
Eventos generados por las sesiones vinculadas.

---

# 9. Fiscal

## CONFIGURACION_FISCAL_EMPRESA
Información fiscal de una empresa.

## TIPOS_COMPROBANTE
Catálogo de comprobantes.

## SERIES_COMPROBANTE
Series y correlativos configurados por empresa.

## COMPROBANTES
Documentos fiscales generados por operaciones comerciales.

---

# 10. Auditoría

## AUDITORIA
Registro transversal de operaciones sensibles del sistema.

---

# Total inicial

El modelo V2 contiene 49 tablas.

---

# Reglas arquitectónicas principales

## Multiempresa

La base de datos será compartida por múltiples empresas.

Las entidades comerciales utilizarán:

empresa_id

para identificar al tenant propietario del registro.

El backend nunca deberá confiar en un empresa_id proporcionado libremente
por el frontend.

La empresa activa deberá obtenerse desde el contexto autenticado.

---

## Integridad multiempresa

Siempre que sea técnicamente razonable, SQL Server deberá impedir relaciones
entre registros de empresas diferentes.

Ejemplo inválido:

VENTA empresa 1
        ↓
CLIENTE empresa 2

Este tipo de relación deberá bloquearse.

La aplicación también deberá realizar estas validaciones.

---

## Eliminación lógica

La mayoría de entidades maestras no se eliminarán físicamente cuando posean
historial.

Se utilizarán estados como:

ACTIVO
INACTIVO

o estados propios de cada proceso.

Ejemplos:

COMPRA:
BORRADOR
CONFIRMADA
ANULADA

VENTA:
BORRADOR
CONFIRMADA
ANULADA

---

## Fechas

Las fechas técnicas deberán almacenarse de forma consistente.

El backend manejará las conversiones de zona horaria utilizando la zona
configurada por la empresa.

---

## Dinero

Los importes monetarios deberán almacenarse utilizando tipos DECIMAL.

Nunca FLOAT o REAL.

---

## Inventario

EXISTENCIAS representa el estado actual.

MOVIMIENTOS_INVENTARIO representa el historial.

Toda modificación de stock deberá generar trazabilidad.

---

## Producto simple

Todo producto tendrá internamente al menos una VARIANTE_PRODUCTO.

Cuando:

usa_variantes = false

se utilizará una variante predeterminada no visible para el usuario.

Esto permite que:

CODIGOS_BARRAS
EXISTENCIAS
COMPRAS
VENTAS
TRANSFERENCIAS
CONTEOS

siempre trabajen con variante_id.

---

## Operaciones transaccionales

Los procesos críticos deberán utilizar transacciones.

Entre ellos:

- confirmación de compra;
- confirmación de venta;
- anulación de venta;
- cierre de caja;
- finalización de inventario;
- envío de transferencia;
- recepción de transferencia;
- generación de correlativos fiscales.

Si falla una parte:

ROLLBACK

---

## Auditoría

Las operaciones sensibles deberán poder reconstruirse.

Especialmente:

- accesos administrativos;
- modificaciones de precios;
- movimientos de inventario;
- ventas;
- compras;
- anulaciones;
- movimientos de caja;
- cambios fiscales;
- accesos de soporte.

Nunca deberán almacenarse contraseñas, secretos o tokens completos en
AUDITORIA.

---

# Dependencias generales

EMPRESAS
│
├── SUSCRIPCIONES_EMPRESA
│    └── PLANES_SAAS
│         └── LIMITES_PLAN
│
├── LIMITES_EMPRESA
│
├── USUARIOS_EMPRESAS
│    ├── USUARIOS
│    └── ROLES
│         └── ROLES_PERMISOS
│              └── PERMISOS
│
├── TRABAJADORES
│
├── SUCURSALES
│    ├── CAJAS
│    │    └── SESIONES_CAJA
│    │         ├── MOVIMIENTOS_CAJA
│    │         └── VENTAS
│    │
│    ├── EXISTENCIAS
│    ├── SESIONES_INVENTARIO
│    └── TRANSFERENCIAS_STOCK
│
├── PRODUCTOS
│    └── VARIANTES_PRODUCTO
│         ├── CODIGOS_BARRAS
│         ├── EXISTENCIAS
│         ├── MOVIMIENTOS_INVENTARIO
│         ├── DETALLE_COMPRAS
│         ├── DETALLE_VENTAS
│         ├── CONTEOS_INVENTARIO
│         └── DETALLE_TRANSFERENCIAS_STOCK
│
├── PROVEEDORES
│    └── COMPRAS
│         └── DETALLE_COMPRAS
│
├── CLIENTES
│    └── VENTAS
│         ├── DETALLE_VENTAS
│         ├── PAGOS_VENTA
│         └── COMPROBANTES
│
├── METODOS_PAGO
│    └── PAGOS_VENTA
│
├── CONFIGURACION_FISCAL_EMPRESA
├── SERIES_COMPROBANTE
├── DISPOSITIVOS_APP
├── SESIONES_APP_WEB
├── EVENTOS_APP_WEB
└── AUDITORIA