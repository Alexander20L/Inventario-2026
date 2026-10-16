# Usuarios, empresas e invitaciones

## Alcance implementado

API de autenticación y acceso para usuarios pertenecientes a empresas. Permite
iniciar y cerrar sesión, aceptar invitaciones, invitar usuarios y administrar
el acceso de trabajadores.

Actualmente todavía existe el endpoint público `POST /auth/register-company`,
que permite crear una empresa con su primer administrador. Este flujo se mantiene
temporalmente mientras se implementa el alta de empresas desde el módulo de
administración de plataforma.

El flujo objetivo será que un administrador de plataforma cree la empresa cliente
y genere el acceso para su primer `ADMINISTRADOR`. Cuando ese flujo esté completo
y probado, el registro público de empresas será retirado.

Los administradores de plataforma utilizan autenticación y sesiones independientes.
Consulta `docs/api/platform.md` para esa parte de la arquitectura.

No incluye planes, suscripciones ni límites comerciales. Las pantallas móviles y
el envío de correo no están implementados todavía. La web en `apps/web/` permite
compartir manualmente un enlace de invitación y aceptarlo.

## Tablas

- `EMPRESAS`: cada negocio.
- `USUARIOS`: identidad global y contraseña derivada con scrypt y sal aleatoria.
- `USUARIOS_EMPRESAS`: acceso y rol por tienda; un usuario puede pertenecer a varias.
- `INVITACIONES_EMPRESA`: correo destinatario, rol, autor, vencimiento, aceptación y revocación.
- `SESIONES_ACCESO`: sesiones revocables, vinculadas a una tienda.

Una invitación dura 48 horas y una sesión 24 horas. Los tokens aleatorios de 256 bits
solo se guardan como SHA-256. La contraseña y los hashes nunca se devuelven en la API.
Los identificadores BIGINT se reciben y devuelven como cadenas JSON.

## Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/register-company` | Público: alta de una nueva tienda con su administrador |
| POST | `/auth/login` | Público: credenciales |
| POST | `/auth/accept-invitation` | Público: token de invitación y contraseña |
| POST | `/auth/invitation-preview` | Público: token válido; consulta tienda, correo, rol y estado sin consumirlo |
| GET | `/auth/me` | Sesión válida |
| POST | `/auth/logout` | Sesión válida |
| POST | `/invitations` | Administrador |
| GET | `/invitations` | Administrador, solo su tienda |
| POST | `/invitations/:id/revoke` | Administrador, solo su tienda |
| GET | `/users` | Administrador, solo su tienda |
| PATCH | `/users/:id/status` | Administrador, trabajadores de su tienda |

Las rutas privadas reciben `Authorization: Bearer <accessToken>`. La tienda activa
proviene de la sesión. Enviar otro `empresaId` al crear una invitación no cambia
su destino. Las cuentas, tiendas o membresías inactivas no pueden usar sesiones.
Un trabajador no puede listar usuarios ni crear, consultar o revocar invitaciones.
Los futuros endpoints de reportes deberán usar también `AuthGuard` y `AdminGuard`.

Las rutas públicas de autenticación admiten hasta 30 solicitudes por minuto e IP
por proceso. En despliegues de varias instancias se necesita un contador compartido
o una limitación en el proxy; no se confía automáticamente en `X-Forwarded-For`.

### 1. Registro público temporal de empresa
> Este endpoint pertenece al flujo anterior de alta pública y será retirado
> cuando el módulo de plataforma pueda crear empresas clientes y generar el
> acceso de su primer administrador.

`POST /auth/register-company`:

```json
{
  "nombre": "Ana Pérez",
  "correo": "ana@example.com",
  "password": "una-contraseña-personal",
  "nombreEmpresa": "Bodega Ana",
  "numeroDocumento": "20123456789"
}
```

Crea el usuario, la tienda, el acceso de administrador y una sesión en una transacción.
No es una vía para incorporarse a una tienda existente. Documento o correo duplicados:
HTTP 409, sin registros parciales. La contraseña debe tener entre 10 y 128 caracteres.

La respuesta incluye `accessToken`, `tokenType`, `expiraEn`, `empresaId`, `usuario` y `rol`.
Guardar el token en el almacenamiento seguro de la app cuando esta se implemente.

### 2. Crear y compartir una invitación

`POST /invitations`, con el token del administrador:

```json
{
  "correo": "trabajador@example.com",
  "rol": "TRABAJADOR"
}
```

La respuesta devuelve el `id`, los datos de la invitación y un `token` que se muestra
solo esta vez. No se envía correo automáticamente. El administrador entrega este
token a su destinatario. El listado nunca muestra los tokens ni sus hashes.

Si se crea otra invitación para ese correo y tienda, se revocan las pendientes
anteriores. Si ya tiene membresía, se devuelve 409; un trabajador inactivo debe
reactivarse, no invitarse de nuevo.

### 3. Aceptar la invitación

La web genera un enlace `/aceptar-invitacion#token=...`. Antes de aceptar,
`POST /auth/invitation-preview` recibe `{ "token": "..." }` y devuelve tienda,
correo, rol, estado y si el destinatario ya tiene cuenta. No consume el token
ni abre una sesión. Un token desconocido o una tienda inactiva produce HTTP 400.

`POST /auth/accept-invitation`:

```json
{
  "token": "TOKEN_RECIBIDO_DEL_ADMINISTRADOR",
  "nombre": "Luis García",
  "password": "una-contraseña-personal"
}
```

Si el correo invitado no tiene cuenta, se crea. Si ya tiene cuenta, debe introducir
su contraseña actual y puede omitir `nombre`. No se reemplaza la contraseña ni el
nombre de una cuenta existente. Correo, rol y empresa se toman exclusivamente de la
invitación, no del cliente. El token sirve una sola vez. Crear la membresía, marcar
la invitación aceptada y abrir la sesión forman una transacción.

La respuesta devuelve una sesión para esa tienda. Token usado, vencido o revocado:
HTTP 400. Contraseña incorrecta de cuenta existente: HTTP 401.

### 4. Iniciar y cerrar sesión

`POST /auth/login`:

```json
{
  "correo": "trabajador@example.com",
  "password": "una-contraseña-personal"
}
```

Si tiene varias tiendas activas, devuelve HTTP 400 con `empresas`. Repetir enviando
además `empresaId` como texto para elegir una. Credenciales inválidas o falta de
acceso a la tienda elegida: HTTP 401. Cada sesión queda vinculada a una sola tienda.

`POST /auth/logout` revoca la sesión actual; debe volver a iniciar sesión para usar
las rutas privadas. No cierra las otras sesiones del usuario.

### 5. Listar y deshabilitar trabajadores

`GET /users` devuelve membresías de la tienda activa, con nombre, correo, rol y estado.
El `id` de cada fila es el identificador de membresía, diferente de `usuarioId`.

`PATCH /users/:id/status`, usando ese identificador:

```json
{ "estado": "INACTIVO" }
```

El cambio revoca sus sesiones de esa tienda y no afecta a las demás tiendas. Para
reactivar, enviar `ACTIVO`; debe iniciar sesión otra vez. Esta ruta solo modifica
trabajadores: no permite desactivar administradores ni cambiar roles.

`GET /users` y `GET /invitations` devuelven como máximo 100 filas. Para continuar,
usar `?after=<id de la última fila>`. Usuarios se ordenan ascendentemente por membresía;
invitaciones, descendentemente por identificador.

## Comprobaciones automatizadas

Desde la raíz, con Node.js 24 y pnpm:

```powershell
pnpm --filter api test
pnpm --filter api test:database
```

La segunda prueba compila y usa la conexión de `apps/api/.env` contra SQL Server.
Crea dos tiendas y usuarios temporales con un prefijo aleatorio y los elimina al
terminar, incluso si una aserción falla. No reinicia la base ni borra otros datos.
Comprueba autenticación, aislamiento, permisos, aceptación única, vencimientos,
revocación, cuentas existentes y cierre de sesión.
