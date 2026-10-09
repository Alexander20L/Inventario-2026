# Comprobantes y preparación fiscal

## Objetivo

Preparar la base de datos para la generación y gestión futura de comprobantes
electrónicos sin implementar todavía la integración con SUNAT.

El módulo deberá conservar información fiscal histórica y mantener separado
el proceso comercial de venta del proceso de emisión del comprobante.

---

## 1. CONFIGURACION_FISCAL_EMPRESA

Representa la configuración tributaria de cada empresa.

Campos:

- id_configuracion_fiscal
- empresa_id
- tipo_documento
- numero_documento
- razon_social
- nombre_comercial
- direccion_fiscal
- ubigeo
- estado
- creado_en
- actualizado_en

Reglas:

- Cada configuración pertenece a una empresa.
- Una empresa tendrá como máximo una configuración fiscal activa.
- La configuración fiscal podrá modificarse, pero los comprobantes históricos
  deberán conservar los datos utilizados cuando fueron emitidos.
- Las credenciales, certificados o secretos necesarios para integraciones
  externas no deberán almacenarse en texto plano.

Ejemplo:

Empresa:
Calzados ABC

Tipo documento:
RUC

Número:
20123456789

Razón social:
CALZADOS ABC S.A.C.

---

## 2. TIPOS_COMPROBANTE

Catálogo global de tipos de comprobante soportados por la plataforma.

Campos:

- id_tipo_comprobante
- codigo
- nombre
- estado
- creado_en
- actualizado_en

Ejemplos:

- BOLETA
- FACTURA
- NOTA_CREDITO
- NOTA_DEBITO

Reglas:

- codigo deberá ser único.
- Esta tabla será global y no pertenecerá a una empresa específica.
- Un tipo inactivo no podrá utilizarse para nuevos comprobantes.

---

## 3. SERIES_COMPROBANTE

Define las series habilitadas para cada empresa.

Campos:

- id_serie_comprobante
- empresa_id
- sucursal_id
- tipo_comprobante_id
- serie
- ultimo_numero
- estado
- creado_en
- actualizado_en

Ejemplos:

Factura:

F001

Boleta:

B001

Reglas:

- Toda serie pertenece a una empresa.
- Podrá asociarse opcionalmente a una sucursal.
- La combinación empresa + tipo de comprobante + serie deberá ser única.
- ultimo_numero permitirá controlar la numeración correlativa.
- La asignación del siguiente número deberá realizarse de forma transaccional
  para evitar números duplicados cuando existan ventas concurrentes.

Ejemplo:

Serie:
F001

ultimo_numero:
152

Siguiente comprobante:

F001-00000153

---

## 4. COMPROBANTES

Representa un comprobante generado a partir de una operación comercial.

Campos:

- id_comprobante
- empresa_id
- venta_id
- tipo_comprobante_id
- serie_comprobante_id
- serie
- numero
- fecha_emision
- estado
- subtotal
- impuesto
- total
- receptor_tipo_documento
- receptor_numero_documento
- receptor_nombre
- codigo_hash
- documento_xml
- documento_cdr
- enviado_en
- respondido_en
- creado_en
- actualizado_en

Reglas:

- Todo comprobante pertenece a una empresa.
- venta_id permitirá relacionar el comprobante con la venta que lo originó.
- serie y numero deberán conservarse aunque posteriormente cambie la
  configuración de SERIES_COMPROBANTE.
- La combinación empresa + serie + numero deberá ser única.
- Los datos del receptor deberán conservarse como snapshot histórico.
- Los importes utilizados al emitir el comprobante deberán conservarse.
- Un comprobante emitido no deberá eliminarse físicamente.

---

## 5. Estados de comprobante

Estados internos sugeridos:

- PENDIENTE
- GENERADO
- ENVIADO
- ACEPTADO
- RECHAZADO
- ANULADO
- ERROR

El estado permitirá controlar el ciclo de procesamiento sin depender
directamente de la venta.

Ejemplo:

Venta:
CONFIRMADA

Comprobante:
PENDIENTE

Esto significa que la venta existe correctamente aunque todavía no se haya
completado el proceso externo de emisión.

---

## 6. Separación entre venta y comprobante

VENTAS representa la operación comercial.

COMPROBANTES representa el documento fiscal asociado.

Flujo:

VENTA CONFIRMADA
       ↓
Solicitud de comprobante
       ↓
COMPROBANTE
       ↓
Generación XML
       ↓
Envío externo
       ↓
Respuesta
       ↓
Actualización de estado

Esto permitirá que una falla en el servicio externo no destruya ni revierta
automáticamente una venta ya registrada correctamente.

---

## 7. Snapshot fiscal

Los comprobantes deberán conservar la información fiscal utilizada en el
momento de emisión.

Ejemplo:

Cliente cambia posteriormente su razón social.

El comprobante anterior deberá continuar mostrando la razón social utilizada
cuando fue emitido.

Por ello COMPROBANTES almacenará:

- receptor_tipo_documento;
- receptor_numero_documento;
- receptor_nombre;
- subtotal;
- impuesto;
- total.

No deberá depender únicamente de CLIENTES para reconstruir un comprobante
histórico.

---

## 8. XML y CDR

El modelo conservará campos para:

- documento_xml;
- documento_cdr;
- codigo_hash.

Estos campos ya forman parte del diseño previsto para integración fiscal.

En una etapa posterior podrá evaluarse si los documentos completos permanecen
en SQL Server o se almacenan externamente manteniendo en la base de datos
solamente su ubicación y metadatos.

---

## 9. Numeración concurrente

La generación de números deberá ser segura ante múltiples usuarios.

Ejemplo:

Caja 1 solicita siguiente número.
Caja 2 solicita siguiente número al mismo tiempo.

No debe ocurrir:

F001-153
F001-153

La actualización de ultimo_numero y la creación del comprobante deberán
realizarse mediante una operación transaccional.

---

## 10. Aislamiento multiempresa

Una empresa nunca podrá utilizar:

- configuración fiscal de otra empresa;
- serie de otra empresa;
- venta de otra empresa;
- comprobante de otra empresa.

empresa_id deberá formar parte del contexto de todas las operaciones fiscales.

---

## 11. Auditoría

Las acciones fiscales relevantes deberán poder auditarse.

Ejemplos:

- comprobante generado;
- comprobante enviado;
- comprobante rechazado;
- comprobante anulado;
- reintento de envío;
- modificación de configuración fiscal.

No deberán almacenarse secretos ni credenciales dentro de los datos de
auditoría.

---

## Modelo general

EMPRESAS
   │
   ├── CONFIGURACION_FISCAL_EMPRESA
   │
   ├── SERIES_COMPROBANTE
   │        │
   │        └── TIPOS_COMPROBANTE
   │
   └── VENTAS
          │
          └── COMPROBANTES
                 │
                 ├── TIPOS_COMPROBANTE
                 └── SERIES_COMPROBANTE