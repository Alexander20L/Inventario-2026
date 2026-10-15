# EN STOCK · Web

Frontend Next.js, React y Tailwind CSS del panel administrativo. Sigue la
identidad visual del diseño compartido: verdes, fondos claros, tarjetas y
tablas. No requiere descargar fuentes externas para compilar.

## Requisitos y conexión

- Node.js 24 o superior y pnpm 12.10.1.
- Dependencias instaladas desde la raíz con `pnpm install --frozen-lockfile`.
- API NestJS conectada a SQL Server y migraciones aplicadas.
- Copiar `.env.example` a `.env.local` y configurar `API_URL`.

La configuración local de esta entrega utiliza:

```text
Web: http://localhost:3001
API: http://127.0.0.1:3100
```

El puerto 3000 estaba ocupado por otro servicio. Se configuró `PORT=3100` en
`apps/api/.env`. Si cambias el puerto de la API, actualiza también `API_URL` en
`apps/web/.env.local`. Esta URL se usa solo desde el servidor de Next.js.

## Ejecutar

Desde la raíz del repositorio, en dos terminales:

```powershell
# Terminal 1
pnpm dev:api
```

```powershell
# Terminal 2
pnpm dev:web
```

Abrir `http://localhost:3001`. Si aún no hay cuentas, seleccionar
**Registrar una tienda** para crear el negocio y su administrador.

Si la terminal todavía usa Node.js 20 o no tiene pnpm disponible, anteponer a
cada comando de pnpm:

```powershell
npm exec --yes --package=node@24 -- npm exec --yes --package=pnpm@12.10.1 -- pnpm dev:web
```

Para producción local: compilar primero API y web y después ejecutar
`pnpm --filter api start:prod` y `pnpm --filter web start`.

## Pantallas conectadas

- `/iniciar-sesion`: autenticación y selección de tienda si la cuenta tiene varias.
- `/registrar-tienda`: alta atómica del negocio y administrador.
- `/aceptar-invitacion`: validación y aceptación de una invitación.
- `/inicio`: bienvenida con los datos reales de la tienda y próximos pasos.
- `/usuarios`: listado, filtros sobre registros cargados, paginación y cambio de estado de trabajadores.
- `/usuarios/invitaciones`: crear, copiar enlace, listar y revocar invitaciones.
- `/configuracion`: consulta de los datos de sesión; edición pendiente.
- `/acceso-limitado`: página para trabajadores sin acceso administrativo.

Productos y proveedores ya tienen listado, búsqueda, formularios y fichas
conectadas a la API. Los productos pueden asociarse a varios proveedores; desde
la ficha del contacto se consulta lo que suministra y se abre WhatsApp si tiene
un teléfono internacional. Consulta [el módulo de catálogo](../../docs/api/catalog.md).

Inventario y ventas tienen páginas de preparación. El stock mínimo de un producto
no representa cantidades disponibles. El inicio muestra sus indicadores pendientes,
no ceros que pudieran confundirse con resultados reales.

## Sesión e invitaciones

El navegador recibe una cookie `HttpOnly`, `SameSite=Lax`, con vencimiento y
`Secure` en producción. No se utiliza localStorage para tokens. Los componentes
de servidor y las Server Actions llaman a la API. No hace falta habilitar CORS
para esta comunicación. Los permisos también se verifican en NestJS.

La invitación se comparte con `/aceptar-invitacion#token=...`. El fragmento no
se envía al servidor al cargar la página. La pantalla lo retira de la barra de
direcciones y lo valida mediante una Server Action. Si recargas después de
retirarlo, vuelve a abrir el enlace o pégalo en el formulario. El correo y rol
son informativos: la aceptación real siempre utiliza los datos del backend.

El enlace se muestra solo al crear la invitación y debe copiarse antes de
salir de la página. Para obtener otro se crea una nueva invitación, revocando
la anterior. No se envían correos automáticamente. Un enlace `localhost` sirve
en esta computadora; para compartirlo con otros equipos se necesita una URL
accesible para ellos y la configuración de despliegue correspondiente.

La limitación básica de autenticación del backend es por IP y proceso. Como
las solicitudes de esta web pasan por Next.js, comparten su IP ante NestJS;
para producción se debe definir la atribución de clientes con un proxy confiable
y la estrategia de limitación compartida.

## Verificación

```powershell
pnpm --filter web build
pnpm --filter web typecheck
pnpm --filter api build
pnpm --filter web exec playwright install chromium
pnpm --filter web test:e2e
```

Para usar Microsoft Edge ya instalado en Windows:

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
pnpm --filter web test:e2e
```

La prueba abre servidores temporales en 3100 (API) y 3101 (web). Detener los
servidores propios de esos puertos antes de ejecutarla. Usa la base configurada
en `apps/api/.env`, crea una tienda y usuarios con prefijo aleatorio y elimina
solo esos registros al finalizar. No reinicia la base. Los artefactos de prueba
están excluidos de Git; pueden incluir enlaces de invitación temporales.

Verifica registro, cookie protegida, invitación, aceptación, restricción de
rol, deshabilitación y reactivación, revocación, cierre de sesión y navegación móvil.
