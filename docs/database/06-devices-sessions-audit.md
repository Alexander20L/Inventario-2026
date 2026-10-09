# Dispositivos, sesiones App/Web y auditoría

## Objetivo

Definir el control de dispositivos, vinculación entre aplicación móvil y web,
eventos de comunicación y registro de auditoría del sistema SaaS.

---

## 1. DISPOSITIVOS_APP

Representa los dispositivos móviles utilizados para acceder al sistema.

Campos:

- id_dispositivo
- empresa_id
- usuario_id
- nombre_dispositivo
- identificador_dispositivo
- plataforma
- version_app
- ultimo_acceso_en
- estado
- creado_en
- actualizado_en

Ejemplos de plataforma:

- ANDROID
- IOS

Reglas:

- Todo dispositivo deberá estar asociado a una empresa.
- Todo dispositivo deberá estar asociado a un usuario autorizado.
- identificador_dispositivo deberá ser único cuando sea posible.
- Un dispositivo podrá desactivarse sin eliminar su historial.
- ultimo_acceso_en deberá actualizarse cuando el dispositivo utilice la aplicación.

---

## 2. SESIONES_APP_WEB

Representa una sesión de vinculación o comunicación entre la aplicación móvil
y una sesión web.

Campos:

- id_sesion_app_web
- empresa_id
- usuario_id
- dispositivo_app_id
- codigo_vinculacion_hash
- web_session_id
- token_app_hash
- estado
- expira_en
- vinculado_en
- ultimo_uso_en
- cerrado_en
- creado_en
- actualizado_en

Estados sugeridos:

- PENDIENTE
- VINCULADA
- EXPIRADA
- CERRADA
- REVOCADA

Reglas:

- El código de vinculación nunca deberá almacenarse en texto plano.
- Los tokens deberán almacenarse mediante hash cuando corresponda.
- Una sesión deberá expirar automáticamente.
- Una sesión revocada no podrá volver a utilizarse.
- Toda sesión deberá pertenecer a una única empresa.

---

## 3. EVENTOS_APP_WEB

Representa eventos generados durante la interacción entre aplicación móvil
y plataforma web.

Campos:

- id_evento
- empresa_id
- sesion_app_web_id
- tipo_evento
- datos
- procesado
- creado_en
- procesado_en

Ejemplos de tipo_evento:

- PRODUCT_SCANNED
- INVENTORY_UPDATED
- SALE_CREATED
- SESSION_LINKED
- SESSION_CLOSED

El campo datos podrá almacenar información estructurada serializada.

Reglas:

- Todo evento pertenece a una sesión válida.
- Los eventos podrán procesarse de forma síncrona o asíncrona.
- procesado permitirá saber si el evento ya fue consumido.
- Los eventos no deberán eliminarse inmediatamente si son necesarios para
  trazabilidad o diagnóstico.

---

## 4. AUDITORIA

Representa el historial de acciones importantes realizadas en el sistema.

Campos:

- id_auditoria
- empresa_id
- usuario_id
- modulo
- accion
- tabla_afectada
- registro_id
- datos_anteriores
- datos_nuevos
- ip
- user_agent
- origen
- fecha_hora

Ejemplos de modulo:

- AUTH
- USERS
- PRODUCTS
- INVENTORY
- PURCHASES
- SALES
- BILLING
- SUPPORT

Ejemplos de accion:

- CREATE
- UPDATE
- DELETE_LOGICAL
- LOGIN
- LOGOUT
- CONFIRM
- CANCEL
- ACCESS_SUPPORT

---

## 5. Auditoría de soporte SaaS

Los usuarios con roles internos de plataforma podrán acceder a empresas para
soporte o diagnóstico.

Toda acción de soporte deberá registrar:

- usuario interno;
- empresa objetivo;
- fecha y hora;
- IP;
- módulo;
- acción realizada;
- registro afectado cuando corresponda.

Ejemplo:

Usuario plataforma:
Gabriel

Rol:
SUPER_ADMIN

Empresa:
Empresa ABC

Acción:
ACCESS_SUPPORT

Resultado:
Registrado en AUDITORIA

---

## 6. Origen de las operaciones

El campo origen permitirá identificar desde dónde se realizó una acción.

Valores sugeridos:

- WEB
- MOBILE
- API
- SUPPORT
- SYSTEM

Esto permitirá diferenciar:

Venta creada desde aplicación móvil

de:

Venta anulada desde plataforma web

o:

Proceso automático ejecutado por el sistema.

---

## 7. Datos anteriores y nuevos

Cuando una operación modifique información sensible, AUDITORIA podrá registrar
el estado anterior y el nuevo.

Ejemplo:

Producto:

precio anterior:
S/ 50.00

precio nuevo:
S/ 55.00

AUDITORIA:

datos_anteriores:
{"precio":50.00}

datos_nuevos:
{"precio":55.00}

Esto facilitará investigaciones de errores y control administrativo.

---

## 8. Seguridad

No deberán almacenarse en auditoría:

- contraseñas;
- tokens completos;
- secretos;
- credenciales;
- información sensible innecesaria.

Los datos deberán filtrarse antes de registrarse.

---

## 9. Aislamiento multiempresa

Los dispositivos, sesiones, eventos y auditorías deberán respetar empresa_id.

Un dispositivo de Empresa A no podrá utilizar una sesión de Empresa B.

Un evento de Empresa A no podrá relacionarse con una sesión de Empresa B.

---

## Modelo general

USUARIOS
   │
   ├── DISPOSITIVOS_APP
   │        │
   │        └── SESIONES_APP_WEB
   │                  │
   │                  └── EVENTOS_APP_WEB
   │
   └── AUDITORIA

EMPRESAS
   │
   ├── DISPOSITIVOS_APP
   ├── SESIONES_APP_WEB
   ├── EVENTOS_APP_WEB
   └── AUDITORIA