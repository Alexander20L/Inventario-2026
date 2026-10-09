# Núcleo SaaS y control de acceso

## Objetivo

Definir la estructura base multiempresa del Sistema Inventario 2026.

El sistema utilizará una única base de datos SQL Server para múltiples
empresas. Toda información comercial deberá estar asociada a una empresa
y mantenerse aislada de las demás.

---

## 1. EMPRESAS

Representa cada empresa cliente de la plataforma SaaS.

Campos principales:

- id_empresa
- nombre_legal
- nombre_comercial
- tipo_documento
- numero_documento
- correo
- telefono
- direccion
- zona_horaria
- moneda
- estado
- creado_en
- actualizado_en

Reglas:

- Cada empresa representa un tenant del sistema.
- numero_documento deberá ser único.
- Los datos pertenecientes a una empresa no podrán ser consultados por otra.
- Las fechas del sistema se almacenarán en UTC.
- zona_horaria indicará cómo mostrar las fechas al usuario.

---

## 2. PLANES_SAAS

Define los planes comerciales disponibles.

Campos:

- id_plan
- codigo
- nombre
- descripcion
- precio_mensual
- moneda
- estado
- creado_en
- actualizado_en

Ejemplos:

- BASIC
- PRO
- BUSINESS

Los límites no se almacenarán directamente como columnas fijas dentro
del plan para permitir agregar nuevos tipos de límites en el futuro.

---

## 3. LIMITES_PLAN

Define los límites incluidos dentro de cada plan.

Campos:

- id_limite_plan
- plan_id
- recurso
- valor_limite
- unidad
- estado
- creado_en

Ejemplos de recurso:

- USERS
- BRANCHES
- PRODUCTS
- DEVICES
- MONTHLY_SALES
- STORAGE_MB

Ejemplo:

Plan PRO

- USERS = 10
- BRANCHES = 3
- PRODUCTS = 10000
- STORAGE_MB = 5000

---

## 4. SUSCRIPCIONES_EMPRESA

Registra el plan contratado por una empresa.

Campos:

- id_suscripcion
- empresa_id
- plan_id
- fecha_inicio
- fecha_fin
- estado
- renovacion_automatica
- creado_en
- actualizado_en

Estados posibles:

- ACTIVA
- SUSPENDIDA
- VENCIDA
- CANCELADA

El historial de suscripciones deberá conservarse.

Una empresa deberá tener como máximo una suscripción ACTIVA al mismo tiempo.

---

## 5. LIMITES_EMPRESA

Permite sobrescribir límites específicos del plan para una empresa.

Campos:

- id_limite_empresa
- empresa_id
- recurso
- valor_limite
- fecha_inicio
- fecha_fin
- estado
- creado_en

Ejemplo:

Una empresa posee el plan PRO:

USERS = 10

pero compra una ampliación:

USERS = 15

El límite efectivo será 15 mientras el override esté activo.

Prioridad:

LIMITES_EMPRESA
        ↓
si no existe
        ↓
LIMITES_PLAN    

---

## 6. USUARIOS

Representa una cuenta global de acceso a la plataforma.

Campos:

- id_usuario
- correo
- contrasena_hash
- nombre_usuario
- estado
- ultimo_acceso_en
- creado_en
- actualizado_en

Reglas:

- El correo será único en toda la plataforma.
- Un usuario puede pertenecer a más de una empresa.
- La contraseña nunca se almacenará en texto plano.
- USUARIOS representa credenciales, no necesariamente un trabajador.

Ejemplo:

usuario@email.com

puede tener acceso a:

- Empresa A
- Empresa B
- Empresa C

utilizando las mismas credenciales.

---

## 7. ROLES

Representa los roles configurables dentro de una empresa.

Campos:

- id_rol
- empresa_id
- nombre
- descripcion
- estado
- creado_en
- actualizado_en

Ejemplos:

- ADMINISTRADOR
- VENDEDOR
- ALMACEN
- SUPERVISOR

Cada empresa podrá definir sus propios roles.

La combinación:

empresa_id + nombre

deberá ser única.

---

## 8. PERMISOS

Catálogo global de permisos del sistema.

Campos:

- id_permiso
- modulo
- nombre
- descripcion
- estado

Ejemplos:

Modulo: PRODUCTS
Permiso: PRODUCT_CREATE

Modulo: SALES
Permiso: SALE_CREATE

Modulo: USERS
Permiso: USER_MANAGE

---

## 9. ROLES_PERMISOS

Relaciona los roles de una empresa con los permisos disponibles.

Campos:

- id_rol_permiso
- rol_id
- permiso_id

La combinación:

rol_id + permiso_id

deberá ser única.

---

## 10. USUARIOS_EMPRESAS

Relaciona una cuenta global con las empresas a las que puede acceder.

Campos:

- id_usuario_empresa
- usuario_id
- empresa_id
- rol_id
- estado
- creado_en
- actualizado_en

Reglas:

- Un usuario puede pertenecer a varias empresas.
- Dentro de cada empresa podrá tener un rol diferente.
- La combinación usuario_id + empresa_id será única.

Ejemplo:

Usuario Gabriel

Empresa A → ADMINISTRADOR
Empresa B → SUPERVISOR
Empresa C → CONSULTA

Al iniciar sesión, el usuario seleccionará la empresa activa.

Todas las operaciones posteriores utilizarán empresa_id como contexto
del tenant.

---

## 11. TRABAJADORES

Representa las personas que trabajan para una empresa.

Campos:

- id_trabajador
- empresa_id
- usuario_id
- nombres
- apellidos
- tipo_documento
- numero_documento
- telefono
- correo
- cargo
- estado
- creado_en
- actualizado_en

usuario_id será opcional.

Esto permite tener:

Trabajador sin acceso al sistema

o:

Trabajador
    ↓
Cuenta USUARIOS

Un trabajador pertenece a una sola empresa.

---

## 12. ROLES_PLATAFORMA

Define roles administrativos internos del SaaS.

No pertenecen a ninguna empresa cliente.

Campos:

- id_rol_plataforma
- nombre
- descripcion
- estado
- creado_en

Ejemplos:

- SUPER_ADMIN
- SUPPORT
- OPERATIONS

---

## 13. USUARIOS_ROLES_PLATAFORMA

Relaciona usuarios internos con roles administrativos del SaaS.

Campos:

- id_usuario_rol_plataforma
- usuario_id
- rol_plataforma_id
- creado_en

Permite que determinados usuarios puedan administrar o brindar soporte
a empresas sin formar parte de ellas como trabajadores.

Todo acceso administrativo a una empresa deberá registrarse mediante
auditoría.

---

# Contexto multiempresa

El contexto de una petición será:

Usuario autenticado
        ↓
Empresa seleccionada
        ↓
Rol dentro de esa empresa
        ↓
Permisos
        ↓
Operación

Toda consulta empresarial deberá incluir empresa_id.

Ejemplo conceptual:

WHERE empresa_id = empresaActual

Nunca deberá confiarse en un empresa_id enviado libremente por el frontend.

El backend deberá obtener la empresa activa desde el contexto autenticado
del usuario.

---

# Modelo general

USUARIOS
   │
   ├──────── USUARIOS_EMPRESAS ─────── EMPRESAS
   │                    │
   │                    └──────── ROLES
   │                                  │
   │                           ROLES_PERMISOS
   │                                  │
   │                              PERMISOS
   │
   └──────── USUARIOS_ROLES_PLATAFORMA
                       │
              ROLES_PLATAFORMA


EMPRESAS
   │
   ├──────── SUSCRIPCIONES_EMPRESA
   │                   │
   │              PLANES_SAAS
   │                   │
   │              LIMITES_PLAN
   │
   ├──────── LIMITES_EMPRESA
   │
   └──────── TRABAJADORES