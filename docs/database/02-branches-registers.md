# Sucursales, cajas y sesiones de caja

## Objetivo

Definir la estructura operativa de cada empresa para administrar
sucursales, cajas físicas o virtuales y sesiones de apertura/cierre.

---

## 1. SUCURSALES

Representa cada local, tienda o punto operativo de una empresa.

Campos principales:

- id_sucursal
- empresa_id
- nombre
- codigo
- direccion
- telefono
- estado
- creado_en
- actualizado_en

Reglas:

- Toda sucursal pertenece a una empresa.
- codigo deberá ser único dentro de la empresa.
- Dos empresas distintas podrán utilizar el mismo código de sucursal.
- Una sucursal podrá tener una o varias cajas.
- Una sucursal inactiva no podrá recibir nuevas operaciones.
- No se eliminarán físicamente sucursales que tengan información histórica.

Restricción lógica:

empresa_id + codigo = UNIQUE

Ejemplo:

Empresa A

- SUC-001 → Tienda Centro
- SUC-002 → Tienda Norte

Empresa B

- SUC-001 → Local Principal

Esto es válido porque la unicidad se aplica dentro de cada empresa.

---

## 2. CAJAS

Representa una caja o punto de cobro asociado a una sucursal.

Campos principales:

- id_caja
- empresa_id
- sucursal_id
- nombre
- codigo
- estado
- creado_en
- actualizado_en

Ejemplos:

Sucursal Centro

- CAJA-01
- CAJA-02
- CAJA-MOVIL

Reglas:

- Toda caja pertenece a una empresa.
- Toda caja pertenece a una sucursal.
- La sucursal debe pertenecer a la misma empresa de la caja.
- codigo deberá ser único dentro de la sucursal.
- Una caja inactiva no podrá iniciar nuevas sesiones.
- No se eliminarán cajas con operaciones históricas.

Restricción lógica:

sucursal_id + codigo = UNIQUE

---

## 3. SESIONES_CAJA

Representa una apertura y cierre de caja realizada por un trabajador.

Campos principales:

- id_sesion_caja
- empresa_id
- caja_id
- trabajador_id
- fecha_apertura
- monto_apertura
- fecha_cierre
- monto_cierre
- monto_esperado
- diferencia
- estado
- observacion_apertura
- observacion_cierre
- creado_en
- actualizado_en

Estados:

- ABIERTA
- CERRADA
- CANCELADA

---

## Apertura de caja

Ejemplo:

Trabajador:
Juan Pérez

Caja:
CAJA-01

Monto inicial:
S/ 200.00

Estado:
ABIERTA

Al abrir una sesión:

- fecha_apertura se registra automáticamente;
- monto_apertura contiene el efectivo inicial;
- fecha_cierre será NULL;
- monto_cierre será NULL;
- diferencia será NULL;
- estado será ABIERTA.

---

## Cierre de caja

Al cerrar:

Monto apertura:
S/ 200.00

Movimientos esperados:
S/ 850.00

Monto esperado:
S/ 1,050.00

Monto contado físicamente:
S/ 1,040.00

Diferencia:
S/ -10.00

La diferencia se calculará como:

diferencia = monto_cierre - monto_esperado

Si el resultado es:

0
→ caja cuadrada

positivo
→ sobrante

negativo
→ faltante

---

## Regla de sesión activa

Una misma caja no deberá tener más de una sesión ABIERTA al mismo tiempo.

Ejemplo inválido:

CAJA-01

Sesión #10 → ABIERTA
Sesión #11 → ABIERTA

Esto no debe permitirse.

---

## Relación con trabajador

Cada sesión deberá registrar qué trabajador abrió la caja.

SESIONES_CAJA
      ↓
TRABAJADORES

Esto permitirá conocer:

- quién abrió la caja;
- quién operó durante la sesión;
- cuándo se abrió;
- cuándo se cerró;
- cuánto dinero se esperaba;
- cuánto dinero se contó;
- cuál fue la diferencia.

---

## Relación futura con ventas

Cada venta realizada desde una caja deberá poder asociarse a:

- empresa;
- sucursal;
- caja;
- sesión de caja;
- trabajador.

Flujo:

EMPRESA
   ↓
SUCURSAL
   ↓
CAJA
   ↓
SESION_CAJA
   ↓
VENTA

Esto permitirá obtener reportes por:

- empresa;
- sucursal;
- caja;
- trabajador;
- sesión;
- fecha.

---

## Aislamiento multiempresa

Todas las consultas deberán validar empresa_id.

Una caja de Empresa A nunca podrá asociarse a una sucursal de Empresa B.

Una sesión de Empresa A nunca podrá utilizar una caja o trabajador
perteneciente a Empresa B.

Estas validaciones deberán existir tanto en backend como mediante
restricciones de integridad cuando sea posible.

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
                       └── TRABAJADORES