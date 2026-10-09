# Transferencias de stock entre sucursales

## Objetivo

Permitir el traslado controlado de mercadería entre sucursales de una misma
empresa, manteniendo trazabilidad del stock enviado, recibido y de cualquier
diferencia detectada durante el proceso.

---

## 1. TRANSFERENCIAS_STOCK

Representa una operación de traslado de productos entre dos sucursales.

Campos:

- id_transferencia
- empresa_id
- sucursal_origen_id
- sucursal_destino_id
- usuario_creador_id
- usuario_envio_id
- usuario_recepcion_id
- codigo
- estado
- fecha_creacion
- fecha_envio
- fecha_recepcion
- observacion
- creado_en
- actualizado_en

Estados:

- BORRADOR
- EN_TRANSITO
- RECIBIDA
- CANCELADA

Reglas:

- Toda transferencia pertenece a una empresa.
- La sucursal origen y destino deberán pertenecer a la misma empresa.
- La sucursal origen y destino deberán ser diferentes.
- Una transferencia BORRADOR no afectará el inventario.
- Una transferencia EN_TRANSITO ya habrá descontado stock de la sucursal origen.
- Una transferencia RECIBIDA habrá incrementado stock en la sucursal destino.
- Una transferencia CANCELADA conservará su historial.
- Una transferencia ya RECIBIDA no podrá modificarse libremente.

---

## 2. DETALLE_TRANSFERENCIAS_STOCK

Representa cada variante incluida en una transferencia.

Campos:

- id_detalle_transferencia
- empresa_id
- transferencia_id
- variante_id
- cantidad_solicitada
- cantidad_enviada
- cantidad_recibida
- observacion

Reglas:

- Cada detalle pertenece a una transferencia.
- Cada variante deberá pertenecer a la misma empresa.
- cantidad_solicitada deberá ser mayor que cero.
- cantidad_enviada no podrá ser negativa.
- cantidad_recibida no podrá ser negativa.
- Una variante deberá aparecer una sola vez dentro de la misma transferencia.

Restricción:

transferencia_id + variante_id = UNIQUE

---

## 3. Creación de transferencia

Ejemplo:

Sucursal origen:
Tienda Centro

Sucursal destino:
Tienda Norte

Producto:
Zapatilla Negra / 40

Cantidad solicitada:
10

Estado inicial:
BORRADOR

Mientras esté en BORRADOR:

- no se modifica EXISTENCIAS;
- no se generan MOVIMIENTOS_INVENTARIO;
- se pueden modificar cantidades;
- se pueden agregar o eliminar productos.

---

## 4. Envío de transferencia

Cuando se confirma el envío:

1. se valida el stock de la sucursal origen;
2. se registra cantidad_enviada;
3. se genera un movimiento de salida;
4. se descuenta stock de la sucursal origen;
5. la transferencia pasa a EN_TRANSITO.

Ejemplo:

Sucursal Centro

Stock anterior:
25

Cantidad enviada:
10

Movimiento:

tipo_movimiento = TRANSFERENCIA_SALIDA
cantidad = -10
stock_anterior = 25
stock_posterior = 15

Nuevo stock origen:

15


---

## 5. Recepción de transferencia

Cuando la sucursal destino recibe la mercadería:

1. se registra cantidad_recibida;
2. se genera un movimiento de entrada;
3. se incrementa EXISTENCIAS en la sucursal destino;
4. la transferencia pasa a RECIBIDA.

Ejemplo:

Sucursal Norte

Stock anterior:
5

Cantidad recibida:
10

Movimiento:

tipo_movimiento = TRANSFERENCIA_ENTRADA
cantidad = +10
stock_anterior = 5
stock_posterior = 15

Nuevo stock destino:

15

---

## 6. Diferencias entre envío y recepción

El sistema deberá conservar por separado:

- cantidad_solicitada;
- cantidad_enviada;
- cantidad_recibida.

Ejemplo:

Solicitado:
10

Enviado:
10

Recibido:
9

Esto permitirá detectar una diferencia de:

-1 unidad

La diferencia deberá quedar disponible para revisión y auditoría.

No se deberá alterar silenciosamente la cantidad enviada.

---

## 7. Stock en tránsito

Cuando una transferencia esté EN_TRANSITO:

- el stock ya no estará disponible en la sucursal origen;
- todavía no estará disponible en la sucursal destino.

Ejemplo:

Origen antes:
20

Enviado:
5

Origen después:
15

Destino antes:
10

Mientras está EN_TRANSITO:

Destino:
10

Al recibir:

Destino:
15

Esto evita que el mismo stock aparezca disponible simultáneamente en ambas
sucursales.

---

## 8. Existencia inexistente en destino

Si la variante todavía no posee un registro en EXISTENCIAS para la sucursal
destino, el sistema deberá crearlo al recibir la transferencia.

Ejemplo:

Sucursal Norte

Variante:
Producto X

No existe EXISTENCIAS.

Cantidad recibida:
5

Resultado:

Se crea:

stock_actual = 5

---

## 9. Transacción de envío

El envío deberá ejecutarse de forma atómica.

BEGIN TRANSACTION

1. Validar transferencia.
2. Validar stock del origen.
3. Registrar cantidades enviadas.
4. Generar TRANSFERENCIA_SALIDA.
5. Actualizar EXISTENCIAS del origen.
6. Cambiar estado a EN_TRANSITO.

COMMIT

Ante cualquier error:

ROLLBACK

---

## 10. Transacción de recepción

La recepción también deberá ser atómica.

BEGIN TRANSACTION

1. Validar transferencia EN_TRANSITO.
2. Registrar cantidades recibidas.
3. Crear existencia destino si no existe.
4. Generar TRANSFERENCIA_ENTRADA.
5. Actualizar EXISTENCIAS destino.
6. Cambiar estado a RECIBIDA.

COMMIT

Ante cualquier error:

ROLLBACK

---

## 11. Cancelación

Una transferencia BORRADOR podrá cancelarse sin afectar stock.

Una transferencia EN_TRANSITO no deberá cancelarse simplemente eliminando
datos, porque el stock ya salió de la sucursal origen.

Será necesario ejecutar un proceso controlado de reversión o devolución.

Toda cancelación deberá quedar registrada en auditoría.

---

## 12. Aislamiento multiempresa

Una transferencia de Empresa A nunca podrá utilizar:

- sucursal origen de Empresa B;
- sucursal destino de Empresa B;
- variante de Empresa B;
- usuario sin acceso a Empresa A.

Toda la operación deberá utilizar empresa_id como contexto del tenant.

---

## Modelo general

EMPRESAS
   │
   └── TRANSFERENCIAS_STOCK
             │
             ├── SUCURSAL ORIGEN
             ├── SUCURSAL DESTINO
             │
             └── DETALLE_TRANSFERENCIAS_STOCK
                         │
                         └── VARIANTES_PRODUCTO
                                  │
                                  ├── EXISTENCIAS ORIGEN
                                  ├── EXISTENCIAS DESTINO
                                  └── MOVIMIENTOS_INVENTARIO