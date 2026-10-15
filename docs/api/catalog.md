# Catálogo y proveedores

## Alcance de esta etapa

Productos simples con una variante interna `DEFAULT`, un código de barras por
variante y varios proveedores por producto. El catálogo guarda nombre,
presentación, precio, mínimo y estado. No crea existencias ni movimientos.

Los contactos pueden ser distribuidores, vendedores de ruta o personas
independientes. Solo se requieren nombre y teléfono. Se conservan los productos
y contactos inactivos; no hay eliminación física en la API.

## Datos e integridad

- `PRODUCTOS`: identidad del producto y empresa propietaria.
- `VARIANTES_PRODUCTO`: variante interna, precio DECIMAL(12,2) y mínimo entero.
- `CODIGOS_BARRAS`: código conservado como texto, incluidos los ceros iniciales.
- `PROVEEDORES`: contacto, distribuidora, teléfono, correo, visitas y notas.
- `PRODUCTOS_PROVEEDORES`: relación de varios proveedores con varios productos.

Las claves foráneas compuestas incluyen `empresa_id`. SQL Server impide relaciones
entre productos, variantes, códigos y proveedores de empresas distintas. El código
es único por empresa, también si su producto está inactivo. Puede repetirse en otra
empresa. El precio y mínimo tienen restricciones SQL para impedir negativos.

Crear o editar un producto, su variante, código y asociaciones es una transacción.
Un código duplicado o un proveedor ajeno no deja cambios parciales.

## Acceso

Todas las rutas requieren `Authorization: Bearer <token>` y rol `ADMINISTRADOR`.
La empresa se obtiene de la sesión; un `empresaId` del cuerpo no altera el contexto.
Un usuario sin sesión recibe 401; un trabajador, 403; un identificador ajeno, 404.

## Endpoints

| Método | Ruta | Uso |
|---|---|---|
| GET | `/products` | Buscar y paginar catálogo |
| POST | `/products` | Crear producto simple |
| GET | `/products/:id` | Ficha con proveedores |
| PUT | `/products/:id` | Reemplazar los campos editables y proveedores asociados |
| GET | `/suppliers` | Buscar y paginar contactos |
| POST | `/suppliers` | Crear contacto |
| GET | `/suppliers/:id` | Ficha y productos suministrados |
| PUT | `/suppliers/:id` | Reemplazar los datos editables del contacto |

Los PUT reciben el formulario completo. Para mantener asociaciones en un producto,
reenviar sus `proveedorIds`; omitirlos o enviar `[]` retira sus asociaciones.

### Proveedor

```json
{
  "nombreContacto": "Elena Torres",
  "distribuidora": "Distribuidora Norte",
  "telefono": "+51 999 123 456",
  "correo": "elena@example.com",
  "diasVisita": "Lunes y jueves",
  "notas": "Coordinar antes de la visita.",
  "estado": "ACTIVO"
}
```

También admite `direccion` y `numeroDocumento`. Los opcionales vacíos se guardan
como null. El teléfono admite formato legible y debe tener entre 7 y 15 dígitos.
Para abrir WhatsApp desde la web, debe incluir `+` y código internacional.

### Producto

```json
{
  "nombre": "Café molido",
  "presentacion": "Bolsa de 250 g",
  "codigoBarras": "0001234567890",
  "precioVenta": "12.50",
  "stockMinimo": 10,
  "estado": "ACTIVO",
  "proveedorIds": ["1"]
}
```

`precioVenta` debe enviarse como texto decimal no negativo, con punto y hasta dos
decimales, máximo `9999999999.99`. La web acepta coma y la normaliza antes de enviar.
`stockMinimo` es un número entero no negativo, no una existencia disponible. Los
identificadores se envían como texto. La presentación y los proveedores son opcionales.

Cada producto tiene una variante interna para que el futuro inventario y las ventas
operen sobre `varianteId`. Esta versión no tiene editor de variantes visibles,
categorías, fotografías ni múltiples códigos por variante.

### Búsqueda y paginación

Ambos listados admiten `q`, `estado` (`ACTIVO` o `INACTIVO`) y `after`.
Productos admite además `proveedorId`. Se devuelven 50 registros como máximo:

```json
{ "items": [], "nextCursor": null }
```

Si hay `nextCursor`, reenviarlo como `after` con los mismos filtros. El orden es por
identificador descendente. El detalle de proveedor incluye `productos` con este mismo
formato y admite `after` para continuar sus productos. El número `productosCount`
incluye productos activos e inactivos asociados.

La búsqueda de proveedores admite nombre, distribuidora o nombre de un producto
suministrado. La de productos admite nombre, presentación y código de barras.

## Web

- `/productos`: tabla, búsqueda, estado y paginación.
- `/productos/nuevo`: alta y selección de proveedores con búsqueda y carga adicional.
- `/productos/:id`: ficha, precio, mínimo, código y proveedores.
- `/productos/:id/editar`: edición sin modificar existencias.
- `/proveedores`: agenda y búsqueda, incluido por producto suministrado.
- `/proveedores/nuevo`: registro de contacto.
- `/proveedores/:id`: ficha, WhatsApp y productos suministrados.
- `/proveedores/:id/editar`: actualización de contacto y estado.

Desde un proveedor se puede crear un producto con el contacto ya seleccionado.
Las fotos aún no se cargan: el catálogo utiliza un icono genérico de producto.

## Pruebas

`pnpm --filter api test:database` incluye pruebas reales de permisos, aislamiento,
precios, códigos únicos, rollback, relaciones multiempresa y paginación.
`pnpm --filter web test:e2e` incluye creación y edición de contactos y productos,
asociaciones, enlaces WhatsApp, estados, códigos duplicados y vista móvil.
Los registros temporales se eliminan por su prefijo aleatorio; no se reinicia la base.
