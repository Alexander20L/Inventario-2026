# Movimientos de caja

## Objetivo

Registrar entradas y salidas de dinero realizadas durante una sesión de caja
que no correspondan directamente a una venta.

Esto permitirá calcular correctamente el efectivo esperado al momento
del cierre de caja.

---

## 1. MOVIMIENTOS_CAJA

Representa ingresos o retiros manuales realizados durante una sesión de caja.

Campos:

- id_movimiento_caja
- empresa_id
- sesion_caja_id
- caja_id
- usuario_id
- tipo_movimiento
- monto
- motivo
- referencia
- fecha_hora
- creado_en

Tipos sugeridos:

- INGRESO
- RETIRO

Reglas:

- Todo movimiento pertenece a una empresa.
- Todo movimiento pertenece a una sesión de caja.
- La sesión deberá encontrarse ABIERTA.
- monto deberá ser mayor que cero.
- El movimiento deberá indicar su tipo.
- No deberá eliminarse físicamente después de registrado.
- Toda corrección deberá quedar registrada mediante otro movimiento o auditoría.

---

## 2. Ingreso de efectivo

Representa dinero agregado físicamente a la caja sin corresponder a una venta.

Ejemplo:

Monto apertura:

S/ 200.00

Ingreso adicional:

S/ 100.00

Nuevo efectivo esperado:

S/ 300.00

Movimiento:

tipo_movimiento = INGRESO
monto = 100.00
motivo = "Fondo adicional de caja"

---

## 3. Retiro de efectivo

Representa dinero retirado físicamente durante la sesión.

Ejemplo:

Monto esperado antes del retiro:

S/ 1,200.00

Retiro:

S/ 500.00

Nuevo efectivo esperado:

S/ 700.00

Movimiento:

tipo_movimiento = RETIRO
monto = 500.00
motivo = "Retiro preventivo de efectivo"

---

## 4. Cálculo del efectivo esperado

El efectivo esperado de una sesión deberá considerar:

monto_apertura
+ ventas pagadas en efectivo
+ ingresos de caja
- retiros de caja
- devoluciones en efectivo
= monto_esperado

Ejemplo:

Monto apertura:
S/ 200.00

Ventas en efectivo:
S/ 800.00

Ingresos:
S/ 100.00

Retiros:
S/ 300.00

Monto esperado:

S/ 800.00

---

## 5. Relación con pagos

PAGOS_VENTA permitirá determinar cuánto dinero ingresó mediante EFECTIVO.

Los pagos mediante:

- tarjeta;
- transferencia;
- Yape;
- Plin;
- billeteras digitales;

no deberán incrementar el efectivo físico esperado.

Ejemplo:

Venta total:

S/ 150.00

Pagos:

EFECTIVO = S/ 50.00
YAPE = S/ 100.00

Efectivo que incrementa caja:

S/ 50.00

---

## 6. Cierre de caja

Al cerrar una sesión:

1. se calcularán ventas en efectivo;
2. se calcularán movimientos de caja;
3. se calculará monto_esperado;
4. el trabajador registrará monto_cierre;
5. se calculará diferencia.

Fórmula:

diferencia = monto_cierre - monto_esperado

Ejemplo:

monto_esperado = 800
monto_cierre = 790

diferencia = -10

Resultado:

FALTANTE S/ 10.00

---

## 7. Auditoría

Los movimientos de caja son operaciones sensibles.

Cada movimiento deberá registrar:

- usuario;
- sesión;
- monto;
- tipo;
- motivo;
- fecha y hora.

Además podrán generar registros en AUDITORIA cuando corresponda.

---

## 8. Cancelaciones y correcciones

Un movimiento ya registrado no deberá editarse libremente.

Ejemplo:

Se registró por error:

RETIRO
S/ 100

pero debió ser:

S/ 80

No se modifica silenciosamente el movimiento original.

Se deberá realizar un ajuste controlado y mantener trazabilidad.

---

## 9. Aislamiento multiempresa

Un movimiento de caja de Empresa A nunca podrá utilizar:

- sesión de Empresa B;
- caja de Empresa B;
- usuario sin acceso a Empresa A.

empresa_id deberá utilizarse como contexto del tenant.

---

## Modelo general

EMPRESAS
   │
   └── SUCURSALES
          │
          └── CAJAS
                │
                └── SESIONES_CAJA
                       │
                       ├── VENTAS
                       │      │
                       │      └── PAGOS_VENTA
                       │
                       └── MOVIMIENTOS_CAJA