# Productos, variantes, atributos y existencias

## Objetivo

Definir el modelo de productos del sistema de forma flexible y escalable,
permitiendo manejar productos simples y productos con variantes sin duplicar
la lógica de inventario, compras, ventas o códigos de barras.

---

## 1. CATEGORIAS

Representa las categorías definidas por cada empresa.

Campos:

- id_categoria
- empresa_id
- nombre
- descripcion
- estado
- creado_en
- actualizado_en

Reglas:

- Cada categoría pertenece a una empresa.
- Una empresa podrá crear sus propias categorías.
- El nombre deberá ser único dentro de la empresa cuando corresponda.
- No se eliminarán físicamente categorías que tengan productos asociados.

Ejemplos:

- Bebidas
- Calzado
- Accesorios
- Limpieza

---

## 2. MARCAS

Representa las marcas utilizadas por los productos de una empresa.

Campos:

- id_marca
- empresa_id
- nombre
- descripcion
- estado
- creado_en
- actualizado_en

Reglas:

- Cada marca pertenece a una empresa.
- Una empresa podrá registrar sus propias marcas.
- El nombre podrá repetirse entre empresas diferentes.

Ejemplos:

- Coca-Cola
- Valderazzi
- Brixa
- Nike

---

## 3. UNIDADES_MEDIDA

Define la unidad en la que se gestiona un producto.

Campos:

- id_unidad_medida
- empresa_id
- nombre
- abreviatura
- tipo
- estado
- creado_en
- actualizado_en

Ejemplos:

- Unidad / UND
- Par / PAR
- Kilogramo / KG
- Litro / L
- Metro / M

---

## 4. PRODUCTOS

Representa el concepto general de un producto.

Campos:

- id_producto
- empresa_id
- categoria_id
- marca_id
- unidad_medida_id
- nombre
- descripcion
- precio_base
- costo_base
- usa_variantes
- estado
- creado_en
- actualizado_en

Reglas:

- Todo producto pertenece a una empresa.
- categoria_id podrá ser opcional.
- marca_id podrá ser opcional.
- unidad_medida_id podrá ser opcional inicialmente.
- usa_variantes indicará si el usuario administra variantes visibles.
- El stock no se almacenará directamente en PRODUCTOS.
- Los códigos de barras no se almacenarán directamente en PRODUCTOS.
- Las operaciones comerciales utilizarán variantes.

Ejemplos:

Producto simple:

Coca Cola 1L

usa_variantes = false

Producto con variantes:

Zapatilla urbana

usa_variantes = true

---

## 5. VARIANTES_PRODUCTO

Representa la unidad comercial concreta que puede comprarse, venderse,
almacenarse y tener código de barras.

Campos:

- id_variante
- empresa_id
- producto_id
- sku
- nombre
- precio_venta
- costo
- peso
- es_predeterminada
- estado
- creado_en
- actualizado_en

Reglas:

- Toda variante pertenece a un producto.
- Toda variante pertenece a la misma empresa que su producto.
- sku deberá ser único dentro de una empresa cuando tenga valor.
- Un producto deberá tener como mínimo una variante activa.
- Un producto deberá tener exactamente una variante predeterminada.
- es_predeterminada identificará la variante interna utilizada por productos simples.

---

## Producto simple sin variantes visibles

Aunque el usuario vea un producto sin variantes, internamente existirá una
variante predeterminada.

Ejemplo:

PRODUCTO

Coca Cola 1L
usa_variantes = false

        ↓

VARIANTE

nombre = DEFAULT
es_predeterminada = true

El usuario no necesita ver la palabra DEFAULT.

Internamente:

PRODUCTO
   ↓
VARIANTE DEFAULT
   ↓
CODIGO DE BARRAS
   ↓
EXISTENCIAS
   ↓
COMPRAS
   ↓
VENTAS

Esto evita tener estructuras diferentes para productos simples y productos
con variantes.

---

## Producto con variantes visibles

Ejemplo:

Producto:
Zapatilla Valderazzi

usa_variantes = true

Variantes:

- Negro / 39
- Negro / 40
- Café / 39
- Café / 40

Cada variante podrá tener:

- SKU diferente;
- código de barras diferente;
- precio diferente;
- costo diferente;
- stock independiente.

---

## 6. ATRIBUTOS

Define características configurables de los productos.

Campos:

- id_atributo
- empresa_id
- nombre
- tipo_dato
- permite_variantes
- obligatorio
- estado
- creado_en
- actualizado_en

Ejemplos:

- Color
- Talla
- Material
- Capacidad
- Presentación

Ejemplo:

Atributo:
Color

permite_variantes = true

---

## 7. PRODUCTOS_ATRIBUTOS

Define qué atributos aplican a un producto.

Campos:

- id_producto_atributo
- empresa_id
- producto_id
- atributo_id
- orden

Reglas:

- Un mismo atributo no deberá asignarse dos veces al mismo producto.
- La empresa del producto deberá coincidir con la empresa del atributo.

Restricción lógica:

producto_id + atributo_id = UNIQUE

---

## 8. VALORES_ATRIBUTO

Contiene los valores posibles de un atributo.

Campos:

- id_valor_atributo
- empresa_id
- atributo_id
- valor
- orden
- estado
- creado_en
- actualizado_en

Ejemplo:

Atributo:

Color

Valores:

- Negro
- Café
- Azul
- Blanco

Atributo:

Talla

Valores:

- 38
- 39
- 40
- 41
- 42

---

## 9. VARIANTES_VALORES

Relaciona una variante con los valores que la describen.

Campos:

- id_variante_valor
- empresa_id
- variante_id
- atributo_id
- valor_atributo_id
- valor_personalizado

Ejemplo:

Variante:

Negro / 40

Relaciones:

Color → Negro
Talla → 40

Reglas:

- Una variante no deberá tener dos valores para el mismo atributo.
- atributo_id deberá corresponder al producto asociado con la variante.
- valor_atributo_id deberá pertenecer al atributo indicado.

Restricción lógica:

variante_id + atributo_id = UNIQUE

---

## 10. CODIGOS_BARRAS

Permite que una variante posea uno o varios códigos de barras.

Campos:

- id_codigo_barras
- empresa_id
- variante_id
- codigo
- tipo
- principal
- estado
- creado_en
- actualizado_en

Ejemplos de tipo:

- EAN13
- UPC
- CODE128
- INTERNAL

Reglas:

- El código deberá ser único dentro de una empresa.
- Una variante podrá tener varios códigos de barras.
- Una variante podrá tener como máximo un código principal activo.
- Un código de barras no deberá identificar dos variantes distintas dentro
  de la misma empresa.

Restricción lógica:

empresa_id + codigo = UNIQUE

---

## 11. EXISTENCIAS

Representa el stock actual de una variante en una sucursal.

Campos:

- id_existencia
- empresa_id
- sucursal_id
- variante_id
- stock_actual
- stock_minimo
- stock_maximo
- actualizado_en

Reglas:

- Una variante tendrá una existencia independiente por sucursal.
- stock_actual representa el valor actual disponible.
- stock_actual no se almacenará en PRODUCTOS.
- stock_actual no se almacenará en VARIANTES_PRODUCTO.
- La combinación sucursal + variante deberá ser única.
- No deberá existir stock negativo salvo que posteriormente se defina
  explícitamente como regla de negocio.

Restricción lógica:

sucursal_id + variante_id = UNIQUE

Ejemplo:

Variante:
Zapatilla Negra / 40

Sucursal Centro:
12 pares

Sucursal Norte:
5 pares

Sucursal Mall:
8 pares

---

## 12. MOVIMIENTOS_INVENTARIO

Representa el historial de cambios realizados sobre las existencias.

Campos:

- id_movimiento
- empresa_id
- sucursal_id
- variante_id
- usuario_id
- tipo_movimiento
- cantidad
- stock_anterior
- stock_posterior
- costo_unitario
- referencia_tipo
- referencia_id
- observacion
- fecha_hora

Ejemplos de tipo_movimiento:

- COMPRA
- VENTA
- ENTRADA_MANUAL
- SALIDA_MANUAL
- AJUSTE_POSITIVO
- AJUSTE_NEGATIVO
- INVENTARIO
- DEVOLUCION_VENTA
- DEVOLUCION_COMPRA
- TRANSFERENCIA_ENTRADA
- TRANSFERENCIA_SALIDA

---

## Fuente de verdad del inventario

El sistema utilizará dos conceptos:

EXISTENCIAS.stock_actual

para obtener rápidamente el stock actual.

MOVIMIENTOS_INVENTARIO

para conocer cómo se llegó a ese stock.

Ejemplo:

Stock inicial:
20

Venta:
-2

Compra:
+10

Ajuste:
-1

Stock actual:
27

EXISTENCIAS:

stock_actual = 27

MOVIMIENTOS_INVENTARIO:

20 inicial
-2 venta
+10 compra
-1 ajuste

---

## Operaciones atómicas

Toda operación que modifique inventario deberá ejecutarse dentro de una
transacción.

Ejemplo de venta:

1. Crear venta.
2. Crear detalle de venta.
3. Registrar movimiento de inventario.
4. Actualizar EXISTENCIAS.stock_actual.
5. Confirmar transacción.

Si algún paso falla:

ROLLBACK

No deberá existir una venta confirmada cuyo stock no haya sido descontado.

---

## Aislamiento multiempresa

Todos los registros deberán respetar empresa_id.

Una variante de Empresa A no podrá relacionarse con:

- producto de Empresa B;
- sucursal de Empresa B;
- categoría de Empresa B;
- marca de Empresa B;
- atributo de Empresa B.

El backend deberá validar siempre la empresa activa.

---

## Modelo general

EMPRESA
   │
   ├── CATEGORIAS
   ├── MARCAS
   ├── UNIDADES_MEDIDA
   │
   └── PRODUCTOS
          │
          ├── PRODUCTOS_ATRIBUTOS
          │        │
          │        └── ATRIBUTOS
          │                 │
          │          VALORES_ATRIBUTO
          │
          └── VARIANTES_PRODUCTO
                   │
                   ├── VARIANTES_VALORES
                   │
                   ├── CODIGOS_BARRAS
                   │
                   ├── EXISTENCIAS
                   │
                   └── MOVIMIENTOS_INVENTARIO