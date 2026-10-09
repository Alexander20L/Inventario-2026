# Sesiones de inventario y conteo físico

## Objetivo

Definir el proceso de conteo físico del inventario manteniendo historial
de cada sesión y permitiendo ajustar las existencias reales de una sucursal.

---

## 1. SESIONES_INVENTARIO

Representa un proceso de conteo físico realizado en una sucursal.

Campos:

- id_sesion_inventario
- empresa_id
- sucursal_id
- usuario_id
- codigo
- fecha_inicio
- fecha_fin
- estado
- observacion
- creado_en
- actualizado_en

Estados:

- EN_PROGRESO
- FINALIZADA
- CANCELADA

Reglas:

- Toda sesión pertenece a una empresa.
- Toda sesión pertenece a una sucursal.
- El usuario responsable deberá tener acceso a la empresa.
- Una sesión EN_PROGRESO podrá recibir nuevos conteos.
- Una sesión FINALIZADA no podrá modificarse libremente.
- Las sesiones deberán conservarse como historial.

Ejemplo:

Inventario:
INV-00015

Sucursal:
Tienda Centro

Responsable:
Juan Pérez

Estado:
EN_PROGRESO

---

## 2. CONTEOS_INVENTARIO

Representa la cantidad física encontrada de una variante durante una sesión.

Campos:

- id_conteo_inventario
- empresa_id
- sesion_inventario_id
- variante_id
- cantidad_sistema
- cantidad_contada
- diferencia
- usuario_id
- fecha_hora
- observacion

Reglas:

- Todo conteo pertenece a una sesión de inventario.
- Toda variante deberá pertenecer a la misma empresa.
- Una variante deberá aparecer como máximo una vez dentro de una sesión.
- cantidad_contada no podrá ser negativa.
- cantidad_sistema conservará el stock que existía al momento del conteo.
- diferencia será:

cantidad_contada - cantidad_sistema

Restricción:

sesion_inventario_id + variante_id = UNIQUE

---

## 3. Comportamiento del conteo

El conteo representa la cantidad física realmente encontrada.

Ejemplo:

Stock registrado:

20

Cantidad física encontrada:

17

El resultado correcto será:

Nuevo stock = 17

No:

20 + 17

porque el conteo representa una verificación física del inventario existente.

---

## 4. Producto repetido

Si una variante ya fue contada dentro de la misma sesión, no deberá crearse
un segundo registro.

El sistema deberá permitir:

- modificar la cantidad anterior;
- mantener la cantidad anterior;
- cancelar la operación.

Esto evita duplicaciones provocadas por escanear dos veces el mismo producto.

---

## 5. Diferencia de inventario

Ejemplo:

cantidad_sistema = 20
cantidad_contada = 17

diferencia = -3

Otro ejemplo:

cantidad_sistema = 10
cantidad_contada = 12

diferencia = +2

Esto permitirá identificar:

- faltantes;
- sobrantes;
- diferencias de inventario.

---

## 6. Finalización de sesión

Al finalizar la sesión:

1. se validarán todos los conteos;
2. se calcularán las diferencias;
3. se generarán MOVIMIENTOS_INVENTARIO cuando exista diferencia;
4. se actualizará EXISTENCIAS.stock_actual;
5. la sesión pasará a FINALIZADA.

Todo deberá ejecutarse dentro de una transacción.

---

## 7. Movimientos generados

Ejemplo:

Stock sistema:
20

Conteo físico:
17

Se genera:

tipo_movimiento = INVENTARIO
cantidad = -3
stock_anterior = 20
stock_posterior = 17

Otro ejemplo:

Stock sistema:
10

Conteo físico:
12

Se genera:

tipo_movimiento = INVENTARIO
cantidad = +2
stock_anterior = 10
stock_posterior = 12

---

## 8. Operación atómica

La finalización deberá ser transaccional.

BEGIN TRANSACTION

1. Validar sesión.
2. Validar conteos.
3. Bloquear registros necesarios de existencias.
4. Generar movimientos.
5. Actualizar existencias.
6. Marcar sesión como FINALIZADA.

COMMIT

Ante cualquier error:

ROLLBACK

Una sesión no deberá quedar FINALIZADA con existencias actualizadas solo
parcialmente.

---

## 9. Historial

Las sesiones finalizadas deberán conservar información suficiente para
consultar posteriormente:

- fecha;
- sucursal;
- usuario responsable;
- productos contados;
- stock anterior;
- cantidad física;
- diferencia.

Ejemplo:

Inventario INV-00015

Producto A:
Sistema 20
Conteo 17
Diferencia -3

Producto B:
Sistema 5
Conteo 5
Diferencia 0

Producto C:
Sistema 8
Conteo 10
Diferencia +2

---

## 10. Relación con códigos de barras

La aplicación móvil podrá localizar una variante mediante:

CODIGOS_BARRAS
       ↓
VARIANTES_PRODUCTO

Después registrará la variante dentro de:

CONTEOS_INVENTARIO

Por tanto, el código de barras sirve para encontrar el producto, pero el
conteo se relacionará internamente mediante variante_id.

---

## 11. Aislamiento multiempresa

Una sesión de Empresa A nunca podrá:

- utilizar una sucursal de Empresa B;
- contar variantes de Empresa B;
- utilizar usuarios sin acceso a Empresa A.

Todas las operaciones deberán utilizar empresa_id como contexto del tenant.

---

## Modelo general

EMPRESAS
   │
   └── SUCURSALES
          │
          └── SESIONES_INVENTARIO
                    │
                    └── CONTEOS_INVENTARIO
                              │
                              └── VARIANTES_PRODUCTO
                                       │
                                       ├── EXISTENCIAS
                                       └── MOVIMIENTOS_INVENTARIO

                                       