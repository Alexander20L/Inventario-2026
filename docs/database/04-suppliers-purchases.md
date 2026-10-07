# Proveedores y compras

## Objetivo

Definir el proceso de abastecimiento de productos mediante proveedores,
compras y detalle de compras, asegurando que toda compra confirmada actualice
correctamente el inventario.

---

## 1. PROVEEDORES

Representa los proveedores registrados por cada empresa.

Campos:

- id_proveedor
- empresa_id
- tipo_documento
- numero_documento
- razon_social
- nombre_comercial
- telefono
- correo
- direccion
- estado
- creado_en
- actualizado_en

Reglas:

- Todo proveedor pertenece a una empresa.
- numero_documento podrá repetirse entre empresas diferentes.
- Dentro de una misma empresa, la combinación tipo_documento +
  numero_documento deberá ser única cuando ambos tengan valor.
- Un proveedor podrá estar activo o inactivo.
- Un proveedor con compras registradas no deberá eliminarse físicamente.

Ejemplos de tipo_documento:

- RUC
- DNI
- CE
- OTRO

---

## 2. COMPRAS

Representa la cabecera de una operación de compra.

Campos:

- id_compra
- empresa_id
- sucursal_id
- proveedor_id
- usuario_id
- numero_referencia
- fecha_compra
- subtotal
- descuento
- impuesto
- total
- estado
- observacion
- creado_en
- actualizado_en

Estados:

- BORRADOR
- CONFIRMADA
- ANULADA

---

## Compra en estado BORRADOR

Una compra podrá crearse inicialmente como BORRADOR.

Mientras esté en este estado:

- podrá modificarse;
- podrán agregarse o eliminarse productos;
- no deberá afectar EXISTENCIAS;
- no deberá generar MOVIMIENTOS_INVENTARIO.

Ejemplo:

Compra #25

Estado:
BORRADOR

Proveedor:
Distribuidora ABC

Total:
S/ 1,250.00

Stock:
SIN CAMBIOS

---

## Compra CONFIRMADA

Cuando una compra pase a CONFIRMADA:

1. se validará la compra;
2. se validarán sus detalles;
3. se registrarán los movimientos de inventario;
4. se incrementará el stock de cada variante;
5. se confirmará toda la operación mediante una transacción.

Una compra CONFIRMADA no deberá modificarse libremente.

Las correcciones posteriores deberán realizarse mediante un proceso
controlado de anulación o ajuste.

---

## Compra ANULADA

Una compra confirmada que necesite anularse no deberá eliminarse.

Se deberá conservar por motivos de:

- historial;
- auditoría;
- trazabilidad;
- reportes.

Si la compra ya había afectado el inventario, su anulación deberá generar
los movimientos inversos correspondientes.

---

## 3. DETALLE_COMPRAS

Representa cada producto o variante incluida en una compra.

Campos:

- id_detalle_compra
- empresa_id
- compra_id
- variante_id
- cantidad
- costo_unitario
- descuento
- impuesto
- subtotal
- total

Reglas:

- Todo detalle pertenece a una compra.
- Toda variante deberá pertenecer a la misma empresa de la compra.
- cantidad deberá ser mayor que cero.
- costo_unitario no podrá ser negativo.
- subtotal y total deberán calcularse según las reglas comerciales definidas.

Ejemplo:

Compra #25

Producto:
Zapatilla Negra / 40

Cantidad:
24

Costo unitario:
S/ 35.00

Subtotal:
S/ 840.00

---

## 4. Impacto sobre inventario

Cuando una compra sea CONFIRMADA:

DETALLE_COMPRAS
        ↓
MOVIMIENTOS_INVENTARIO
        ↓
EXISTENCIAS

Ejemplo:

Stock actual:
10

Compra confirmada:
+24

Nuevo stock:
34

Se registrará:

tipo_movimiento = COMPRA
cantidad = +24
stock_anterior = 10
stock_posterior = 34

---

## 5. Transacción de compra

La confirmación deberá ejecutarse de forma atómica.

Flujo:

BEGIN TRANSACTION

1. Validar compra.
2. Validar detalle.
3. Obtener existencia actual.
4. Crear MOVIMIENTOS_INVENTARIO.
5. Actualizar EXISTENCIAS.
6. Cambiar COMPRAS.estado a CONFIRMADA.

COMMIT

Si ocurre cualquier error:

ROLLBACK

Ejemplo de error:

Compra creada
Detalle creado
Movimiento falló

Resultado:

ROLLBACK

La compra no deberá quedar parcialmente confirmada.

---

## 6. Existencia inexistente

Si se confirma una compra de una variante que todavía no tiene un registro
en EXISTENCIAS para esa sucursal, el sistema deberá crear la existencia.

Ejemplo:

Sucursal:
Centro

Variante:
Producto A

No existe registro previo en EXISTENCIAS.

Compra:
10 unidades

Resultado:

Se crea:

stock_actual = 10

---

## 7. Costos

DETALLE_COMPRAS.costo_unitario deberá guardar el costo pagado en esa compra.

VARIANTES_PRODUCTO.costo podrá utilizarse como costo de referencia actual.

El costo histórico de una compra nunca deberá depender del costo actual
de la variante.

Ejemplo:

Compra enero:

costo_unitario = S/ 20.00

Compra marzo:

costo_unitario = S/ 23.00

Ambos valores deberán conservarse.

---

## 8. Relación con proveedores

Flujo:

EMPRESA
   ↓
PROVEEDORES
   ↓
COMPRAS
   ↓
DETALLE_COMPRAS
   ↓
VARIANTES_PRODUCTO
   ↓
EXISTENCIAS

Esto permitirá consultar:

- compras por proveedor;
- compras por fecha;
- compras por sucursal;
- productos comprados;
- cantidades adquiridas;
- costos históricos;
- monto total comprado.

---

## 9. Aislamiento multiempresa

Una compra deberá pertenecer a una sola empresa.

No podrá utilizar:

- proveedor de otra empresa;
- sucursal de otra empresa;
- variante de otra empresa;
- usuario sin acceso a esa empresa.

Todas estas relaciones deberán validarse antes de confirmar la compra.

---

## Modelo general

EMPRESAS
   │
   ├── PROVEEDORES
   │       │
   │       └── COMPRAS
   │              │
   │              └── DETALLE_COMPRAS
   │                        │
   │                        └── VARIANTES_PRODUCTO
   │                                  │
   │                                  ├── EXISTENCIAS
   │                                  └── MOVIMIENTOS_INVENTARIO
   │
   └── SUCURSALES