# Clientes, ventas y pagos

## Objetivo

Definir el proceso completo de venta, desde la identificación opcional del
cliente hasta el registro de productos, medios de pago, actualización de
inventario y asociación con una sesión de caja.

---

## 1. CLIENTES

Representa los clientes registrados por una empresa.

Campos:

- id_cliente
- empresa_id
- tipo_cliente
- tipo_documento
- numero_documento
- nombres
- apellidos
- razon_social
- telefono
- correo
- direccion
- estado
- creado_en
- actualizado_en

Tipos de cliente sugeridos:

- PERSONA
- EMPRESA

Reglas:

- Todo cliente pertenece a una empresa.
- Un mismo documento podrá existir en empresas distintas.
- Dentro de una misma empresa, tipo_documento + numero_documento deberá ser
  único cuando el documento tenga valor.
- No todas las ventas requerirán un cliente registrado.
- cliente_id podrá ser NULL en una venta simple.
- Los clientes con historial de ventas no deberán eliminarse físicamente.

Ejemplo:

Venta rápida:

Cliente:
NULL

Venta identificada:

Cliente:
Juan Pérez

Venta empresarial:

Cliente:
Empresa ABC SAC

---

## 2. VENTAS

Representa la cabecera de una operación de venta.

Campos:

- id_venta
- empresa_id
- sucursal_id
- caja_id
- sesion_caja_id
- cliente_id
- trabajador_id
- fecha_hora
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

## Venta BORRADOR

Una venta podrá construirse inicialmente como BORRADOR.

Mientras esté en este estado:

- se podrán agregar productos;
- se podrán cambiar cantidades;
- se podrán eliminar líneas;
- no deberá descontar inventario;
- no deberá generar movimientos de inventario;
- no deberá generar pagos definitivos.

Ejemplo:

Venta #125

Estado:
BORRADOR

Productos:
3

Total:
S/ 85.00

Stock:
SIN CAMBIOS

---

## Venta CONFIRMADA

Al confirmar la venta:

1. se validará la sesión de caja;
2. se validarán los productos;
3. se validará el stock disponible;
4. se registrarán los pagos;
5. se generarán movimientos de inventario;
6. se descontará el stock;
7. se marcará la venta como CONFIRMADA.

Toda la operación deberá ejecutarse dentro de una transacción.

---

## Venta ANULADA

Una venta confirmada no deberá eliminarse físicamente.

Si posteriormente necesita anularse:

- se conservará la venta;
- se conservarán sus detalles;
- se conservarán sus pagos;
- se generarán movimientos inversos de inventario;
- se registrará la operación en auditoría.

---

## 3. DETALLE_VENTAS

Representa cada variante vendida.

Campos:

- id_detalle_venta
- empresa_id
- venta_id
- variante_id
- cantidad
- precio_unitario
- descuento
- impuesto
- subtotal
- total

Reglas:

- Cada detalle pertenece a una venta.
- Cada variante deberá pertenecer a la misma empresa de la venta.
- cantidad deberá ser mayor que cero.
- precio_unitario no podrá ser negativo.
- El precio guardado corresponde al precio utilizado en esa venta.
- Cambiar posteriormente el precio de una variante no deberá modificar
  ventas históricas.

Ejemplo:

Producto:
Zapatilla Negra / 40

Cantidad:
2

Precio unitario:
S/ 80.00

Subtotal:
S/ 160.00

---

## 4. Validación de stock

Antes de confirmar una venta deberá comprobarse:

EXISTENCIAS.stock_actual >= cantidad solicitada

Ejemplo:

Stock actual:
5

Cantidad vendida:
3

Venta permitida.

Nuevo stock:
2

Ejemplo inválido:

Stock actual:
2

Cantidad solicitada:
5

Resultado:

VENTA RECHAZADA

No se permitirá stock negativo salvo que posteriormente se habilite
explícitamente como una regla configurable.

---

## 5. Impacto sobre inventario

Una venta confirmada deberá generar:

DETALLE_VENTAS
       ↓
MOVIMIENTOS_INVENTARIO
       ↓
EXISTENCIAS

Ejemplo:

Stock anterior:
10

Venta:
2

Movimiento:

tipo_movimiento = VENTA
cantidad = -2
stock_anterior = 10
stock_posterior = 8

Nuevo stock:

8

---

## 6. METODOS_PAGO

Representa los métodos de pago disponibles para una empresa.

Campos:

- id_metodo_pago
- empresa_id
- nombre
- tipo
- requiere_referencia
- estado
- creado_en
- actualizado_en

Ejemplos:

- EFECTIVO
- TARJETA
- YAPE
- PLIN
- TRANSFERENCIA

El campo tipo permitirá clasificar métodos aunque una empresa cambie el
nombre visible.

Ejemplo:

nombre = Yape BCP
tipo = BILLETERA_DIGITAL

---

## 7. PAGOS_VENTA

Representa cada pago asociado a una venta.

Campos:

- id_pago
- empresa_id
- venta_id
- metodo_pago_id
- monto
- numero_operacion
- fecha_hora
- creado_en

Reglas:

- Una venta podrá tener uno o varios pagos.
- monto deberá ser mayor que cero.
- metodo_pago_id deberá pertenecer a la misma empresa.
- numero_operacion podrá ser obligatorio dependiendo del método de pago.
- La suma de pagos deberá cubrir el total de la venta antes de confirmarla,
  salvo que en el futuro se implemente crédito.

---

## Pago único

Venta:

S/ 100.00

Pago:

EFECTIVO = S/ 100.00

---

## Pago mixto

Venta:

S/ 150.00

Pagos:

EFECTIVO = S/ 50.00
YAPE = S/ 50.00
TARJETA = S/ 50.00

Total pagos:

S/ 150.00

Esto permitirá manejar pagos combinados sin modificar la estructura de VENTAS.

---

## 8. Relación con caja

Toda venta presencial deberá asociarse a:

EMPRESA
   ↓
SUCURSAL
   ↓
CAJA
   ↓
SESION_CAJA
   ↓
VENTA

La sesión deberá encontrarse ABIERTA al momento de confirmar la venta.

Esto permitirá calcular posteriormente:

- ventas por caja;
- ventas por sesión;
- ventas por trabajador;
- ventas por sucursal;
- efectivo esperado;
- pagos electrónicos;
- diferencias de cierre.

---

## 9. Efectivo y cierre de caja

Los pagos de tipo EFECTIVO afectarán el monto esperado de caja.

Ejemplo:

Monto apertura:
S/ 200.00

Ventas en efectivo:
S/ 500.00

Monto esperado:

S/ 700.00

Los pagos realizados mediante tarjeta, transferencia o billeteras digitales
formarán parte de las ventas, pero no deberán incrementar el efectivo físico
esperado en caja.

---

## 10. Transacción de venta

La confirmación deberá realizarse de forma atómica.

Flujo:

BEGIN TRANSACTION

1. Validar sesión de caja.
2. Validar venta.
3. Validar detalles.
4. Validar stock.
5. Validar pagos.
6. Crear pagos.
7. Crear movimientos de inventario.
8. Actualizar EXISTENCIAS.
9. Cambiar VENTAS.estado a CONFIRMADA.

COMMIT

Si cualquier operación falla:

ROLLBACK

Ejemplo:

Venta creada
Pago creado
Actualización de stock falló

Resultado:

ROLLBACK

La venta no deberá quedar confirmada parcialmente.

---

## 11. Anulación de venta

Si una venta CONFIRMADA se anula:

1. cambiar VENTAS.estado a ANULADA;
2. generar movimientos inversos;
3. devolver las cantidades al inventario;
4. conservar los pagos originales;
5. registrar la operación en auditoría.

Ejemplo:

Venta original:

-2 unidades

Anulación:

+2 unidades

Movimiento:

tipo_movimiento = DEVOLUCION_VENTA

---

## 12. Aislamiento multiempresa

Una venta de Empresa A nunca podrá utilizar:

- cliente de Empresa B;
- sucursal de Empresa B;
- caja de Empresa B;
- sesión de Empresa B;
- trabajador de Empresa B;
- variante de Empresa B;
- método de pago de Empresa B.

Todas estas relaciones deberán validarse utilizando empresa_id.

---

## Modelo general

EMPRESAS
   │
   ├── CLIENTES
   │
   ├── METODOS_PAGO
   │
   └── SUCURSALES
          │
          └── CAJAS
                │
                └── SESIONES_CAJA
                       │
                       └── VENTAS
                              │
                              ├── DETALLE_VENTAS
                              │       │
                              │       └── VARIANTES_PRODUCTO
                              │                 │
                              │                 ├── EXISTENCIAS
                              │                 └── MOVIMIENTOS_INVENTARIO
                              │
                              └── PAGOS_VENTA
                                      │
                                      └── METODOS_PAGO