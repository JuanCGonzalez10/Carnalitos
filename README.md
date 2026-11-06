# Carnalitos

Tienda en línea de snacks y comida saludable para mascotas. Incluye catálogo público, carrito, checkout, consulta de pedidos y un panel administrativo protegido para gestionar productos, precios, stock, pedidos, mensajes y estadísticas.

> **Contenido provisional:** los textos, precios, ilustraciones y datos de contacto iniciales son de demostración y deben editarse desde el panel antes de publicar.

---

## Contenido

- [Qué incluye](#qué-incluye)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos y scripts](#base-de-datos-y-scripts)
- [Tienda y pedidos](#tienda-y-pedidos)
- [Panel administrativo](#panel-administrativo)
- [Imágenes y almacenamiento](#imágenes-y-almacenamiento)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Despliegue](#despliegue)
- [Seguridad antes de publicar](#seguridad-antes-de-publicar)
- [Solución de problemas](#solución-de-problemas)

---

## Qué incluye

### Sitio público

| Ruta | Descripción |
|---|---|
| `/` | Inicio con propuesta de valor, categorías, productos destacados y cómo comprar |
| `/tienda` | Catálogo con búsqueda, filtros por categoría/tipo de mascota y orden |
| `/producto/[slug]` | Detalle del producto: precio, stock, ingredientes, beneficios y relacionados |
| `/carrito` | Carrito persistente en el navegador, cantidades y totales |
| `/checkout` | Datos del cliente, entrega y método de pago; crea el pedido |
| `/pedido` | Consulta de pedidos por código y correo |
| `/pedido/[code]` | Detalle público del pedido |
| `/nosotros` | Historia y filosofía de la marca |
| `/contacto` | Canales de contacto, mapa y formulario |

La tienda incluye navegación responsive, botón flotante de WhatsApp, SEO básico (`sitemap.ts`, `robots.ts`, Open Graph) y animaciones sutiles con Framer Motion.

### Carrito y checkout

- Carrito en `localStorage` (`carnalitos_cart_v1`) con contexto React.
- Validación de stock al agregar y al confirmar el pedido.
- Cálculo de subtotal, envío y envío gratis según el umbral configurado.
- Entrega a domicilio o recogida en tienda.
- Métodos de pago: efectivo contraentrega, Nequi, Bancolombia y transferencia.
- El pedido se crea como **pendiente** y descuenta stock en una transacción.
- Código único de pedido (`CAR-XXXXXXXX`).
- Consulta pública del pedido por código + correo.

No hay pasarela de pagos conectada: el administrador confirma el pago manualmente.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, React Compiler) |
| UI | React 19, TypeScript, Tailwind CSS, Framer Motion |
| Base de datos | MySQL / MariaDB (`mysql2`) |
| Autenticación | Sesiones propias con scrypt + cookie HTTP-only |
| Validación | Zod |

---

## Requisitos

- **Node.js 20+** (probado con Node 22).
- **MySQL 8+** o **MariaDB 10.6+** (Hostinger usa MariaDB). También sirve el contenedor `mysql:8.4` incluido en `docker-compose.yml`.
- npm.
- Opcional: Docker Desktop para levantar MySQL local sin instalarlo.

---

## Puesta en marcha

1. **Instala dependencias**

   ```bash
   npm install
   ```

2. **Crea el archivo de entorno**

   ```bash
   cp .env.example .env.local
   ```

   En Windows (PowerShell):

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. **Levanta MySQL** (opcional con Docker) y configura `.env.local`:

   ```bash
   npm run db:up
   ```

   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=carnalitos
   DB_PASSWORD=carnalitos
   DB_NAME=carnalitos
   ```

   Si ya tienes MySQL/MariaDB instalado, crea la base y el usuario y usa esas credenciales. El script crea la base si el usuario tiene permisos; en Hostinger se crea desde hPanel.

4. **Aplica el esquema y carga los datos iniciales**

   ```bash
   npm run db:setup
   ```

5. **Inicia el sitio**

   ```bash
   npm run dev
   ```

   - Tienda: <http://localhost:3000>
   - Panel: <http://localhost:3000/admin/login>

6. **Ingresa al panel** con el correo y la contraseña definidos en `.env.local` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Los valores por defecto son:

   ```text
   Correo: admin@carnalitos.co
   Contraseña: Carnalitos2026!
   ```

   Cámbialos antes de publicar (ver [Seguridad](#seguridad-antes-de-publicar)).

---

## Variables de entorno

Todas viven en `.env.local`. El archivo `.env.example` sirve como plantilla.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DB_HOST` | Sí | Host de MySQL. En Hostinger debe ser `127.0.0.1` |
| `DB_PORT` | No | Puerto de MySQL (por defecto `3306`) |
| `DB_USER` | Sí | Usuario completo de la base (incluye prefijo en Hostinger) |
| `DB_PASSWORD` | Sí | Contraseña de la base |
| `DB_NAME` | Sí | Nombre completo de la base (incluye prefijo en Hostinger) |
| `DATABASE_URL` | No | Alternativa: `mysql://usuario:clave@127.0.0.1:3306/base` |
| `DB_CONNECTION_LIMIT` | No | Conexiones del pool (por defecto `5`) |
| `DB_SSL` | No | `true` si el proveedor externo exige SSL |
| `ADMIN_NAME` | No | Nombre del administrador inicial |
| `ADMIN_EMAIL` | Sí | Correo del administrador inicial |
| `ADMIN_PASSWORD` | Sí | Contraseña del administrador inicial |
| `NEXT_PUBLIC_APP_URL` | No | URL pública del sitio (metadatos y enlaces) |
| `NEXT_PUBLIC_WHATSAPP` | No | Número de WhatsApp de respaldo |
| `UPLOAD_DIR` | No | Carpeta de imágenes subidas (por defecto `storage/uploads`). En Hostinger usa una ruta **absoluta persistente** |

---

## Base de datos y scripts

| Comando | Qué hace |
|---|---|
| `npm run db:up` | Levanta MySQL 8.4 local con Docker (opcional) |
| `npm run db:down` | Detiene el contenedor de MySQL local |
| `npm run db:setup` | Crea la base si falta, aplica `database/schema.sql` y ejecuta el seed |
| `npm run db:seed` | Vuelve a cargar datos iniciales sin borrar la base |
| `npm run db:reset` | **Elimina todas las tablas** y reconstruye desde cero |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos |

El esquema es idempotente (`create table if not exists`). El seed crea/actualiza el administrador, inserta las categorías con `on duplicate key update` y **no sobrescribe** productos existentes, para respetar los cambios de precio o stock hechos desde el panel.

Para producción en Hostinger hay un archivo adicional `database/seed-production.sql` con el administrador, la configuración, las categorías y los productos (sin pedidos ni mensajes de demostración). Se importa desde phpMyAdmin después de `database/schema.sql`.

### Tablas principales

- `admin_users`, `admin_sessions`: autenticación del panel.
- `settings`: configuración editable (`business`, `store`).
- `categories`, `products`: catálogo.
- `orders`, `order_items`: pedidos y líneas.
- `contact_messages`: bandeja de contacto.

---

## Tienda y pedidos

### Flujo de compra

1. El cliente agrega productos al carrito.
2. En el checkout ingresa sus datos, elige entrega y método de pago.
3. Al confirmar, `POST /api/orders` valida stock y crea el pedido en una transacción.
4. El stock se descuenta automáticamente.
5. El pedido queda **pendiente / sin pago** y se muestra el código.
6. El administrador lo gestiona desde `/admin/pedidos`.

### Estados

| Pedido | Pago |
|---|---|
| Pendiente | Sin pago |
| Confirmado | Pagado |
| En preparación | Reembolsado |
| Enviado | |
| Entregado | |
| Cancelado | |

Al cancelar un pedido se devuelve el stock de sus productos.

### Envíos

- Costo de envío y umbral de envío gratis configurables.
- Recogida en tienda sin costo.
- Las notas de entrega y condiciones de compra se editan desde Configuración.

---

## Panel administrativo

Ruta: `/admin` (protegida por sesión y middleware).

| Sección | Qué permite |
|---|---|
| **Panel** | Ingresos cobrados, saldo por cobrar, pedidos del mes, ticket promedio, ventas por mes, bajo stock, últimos pedidos y más vendidos |
| **Pedidos** | Listado con filtros, búsqueda, cambios rápidos de estado/pago y detalle completo |
| **Mensajes** | Bandeja de contacto, respuesta por correo/WhatsApp y archivado |
| **Productos** | Crear/editar productos, cambiar precio y stock en línea, publicar, destacar y eliminar |
| **Categorías** | CRUD de categorías con orden, icono e imagen |
| **Reportes** | Métricas por rango de fechas, top productos, ventas por categoría, CSV e impresión |
| **Configuración** | Datos del negocio, envíos, condiciones, cuenta y cambio de contraseña |

### Autenticación

- Contraseñas con `scrypt` y salt aleatorio.
- Sesión en cookie HTTP-only `carnalitos_admin_session`.
- Límite de intentos de inicio de sesión.
- El middleware protege `/admin` y `/api/admin`.
- Al cambiar la contraseña se invalidan las demás sesiones.

---

## Imágenes y almacenamiento

- Formatos aceptados: **JPG, PNG, WebP, GIF, AVIF y SVG** para las ilustraciones locales.
- Tamaño máximo: **20 MB** por archivo.
- El servidor detecta el tipo real por firma binaria.
- Las imágenes subidas se guardan en `UPLOAD_DIR` (por defecto `storage/uploads`) y se sirven desde `/api/media/[filename]`.
- Las ilustraciones de los productos de ejemplo viven en `public/images/productos/`.

### Persistencia en producción

El sistema de archivos local es ideal para desarrollo o un VPS. En plataformas serverless el disco es efímero. Para producción:

1. Monta un **volumen persistente** en `UPLOAD_DIR`, o
2. Sustituye `src/lib/storage.ts` por un almacenamiento S3-compatible.

La base de datos guarda la URL de cada imagen; si migras a S3, solo cambia la URL que devuelve la subida.

---

## Estructura del proyecto

```text
database/
  schema.sql                 Esquema MySQL/MariaDB, índices y settings iniciales
  seed-production.sql        Datos iniciales para importar en Hostinger
  install-hostinger.sql      Esquema + datos en un único archivo para phpMyAdmin
scripts/
  setup-db.mjs               Crea la base, aplica el esquema y ejecuta el seed
  seed.mjs                   Categorías, productos, pedidos demo y administrador
  db-config.mjs              Conexión, SSL y utilidades de base de datos
  bundle-sql.mjs             Regenera install-hostinger.sql
public/
  images/productos/          Ilustraciones SVG locales
src/
  app/
    (public)/                Inicio, tienda, producto, carrito, checkout, pedido, nosotros, contacto
    admin/                   Login y panel administrativo
    api/                     Route Handlers (auth, orders, admin, media, reports)
  components/
    admin/                   Gestores del panel
    brand/                   Logo
    forms/                   Formularios públicos
    shared/                  Navbar, footer, heroes, badges
    store/                   Carrito, checkout, tarjetas y filtros
    ui/                      Iconos, imágenes y utilidades visuales
  lib/
    auth/                    Contraseñas, sesiones y rate limit
    data/                    Consultas de productos y pedidos
    store/                   Formato de moneda
    api/                     Guardas de autenticación
    db.ts                    Pool de MySQL/MariaDB y transacciones
    settings.ts              Configuración editable
    storage.ts               Directorio de subidas
    uploads.ts               Validación y subida en el navegador
    validation.ts            Esquemas Zod
  types/                     Tipos compartidos
storage/
  uploads/                   Imágenes subidas (ignoradas por git)
middleware.ts                Protección de /admin y /api/admin
```

---

## Despliegue

La app necesita un entorno **Node.js** con acceso a MySQL/MariaDB y, para imágenes locales, un disco persistente.

### Hostinger (plan Ilimitado / Business)

El plan **Ilimitado** de Hostinger corresponde a **Business/Unlimited**, que admite aplicaciones Node.js y Next.js. La guía paso a paso está en:

- [`DEPLOY-HOSTINGER.md`](DEPLOY-HOSTINGER.md)

Resumen:

1. Crea la base de datos y el usuario en **hPanel → Bases de datos**. Anota el nombre completo con prefijo y usa `DB_HOST=127.0.0.1`.
2. Importa `database/install-hostinger.sql` desde phpMyAdmin (crea tablas, administrador, configuración, categorías y productos en un solo paso).
3. Sube el proyecto a GitHub (recomendado) o en un `.zip` sin `node_modules`, `.next` ni `storage/uploads`.
4. Crea el sitio como **Web App → Next.js**, selecciona Node 22 y define las variables de entorno.
5. Usa una ruta absoluta persistente en `UPLOAD_DIR`, por ejemplo `/home/u123456789/domains/tudominio.com/storage/uploads`.
6. Despliega, abre `/api/health` para confirmar la conexión, entra a `/admin/login`, cambia la contraseña y prueba una compra.

### Otros entornos

1. Configura las variables de entorno de producción.
2. Ejecuta `npm run db:setup` (o aplica `database/schema.sql` y luego el seed) contra la base de producción.
3. Ejecuta `npm run build` y `npm run start`.
4. Define `NEXT_PUBLIC_APP_URL` con el dominio real.
5. Monta un volumen persistente en `UPLOAD_DIR` o conecta almacenamiento S3-compatible.
6. Cambia la contraseña del administrador.

### Notas

- Las rutas de subida usan el runtime de Node.js (`export const runtime = "nodejs"`).
- En plataformas con disco efímero (Vercel, contenedores sin volumen) las imágenes locales no persisten; usa S3 o un volumen externo.
- El build usa `next build --webpack` para evitar el fallo de Turbopack en los servidores de build de Hostinger.
- El middleware de Next.js 16 sigue funcionando mediante `src/proxy.ts`.

---

## Seguridad antes de publicar

- [ ] Cambia `ADMIN_PASSWORD` y vuelve a ejecutar `npm run db:seed` (o cambia la contraseña desde Configuración).
- [ ] Usa una contraseña larga y única.
- [ ] Configura HTTPS en producción.
- [ ] Revisa `ADMIN_EMAIL` y elimina usuarios que no necesites.
- [ ] No publiques `.env.local` (ya está en `.gitignore`).
- [ ] Define `DB_SSL=true` solo si tu proveedor externo lo exige.
- [ ] Limita el acceso remoto a la base de datos (Hostinger la expone solo en `127.0.0.1` por defecto).
- [ ] Revisa textos, precios, condiciones y datos legales antes de abrir al público.
- [ ] Configura copias de seguridad de la base MySQL y del directorio de imágenes.
- [ ] Si conectas pagos reales, valida los webhooks y nunca confíes solo en el cliente.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `ECONNREFUSED` al iniciar | MySQL no está corriendo o el host/puerto es incorrecto | Ejecuta `npm run db:up` o inicia MySQL; revisa `DB_HOST`/`DB_PORT` |
| `Access denied for user ...@'::1'` | Node resolvió `localhost` a IPv6 | En Hostinger usa `DB_HOST=127.0.0.1` |
| `ER_BAD_DB_ERROR` | La base no existe | Créala en hPanel/phpMyAdmin o ejecuta `npm run db:setup` |
| `Duplicate entry` al guardar | Slug, correo o código repetido | Cambia el valor; la API ya responde 409 en categorías/productos |
| Las columnas nuevas no existen | Esquema anterior | Ejecuta `npm run db:setup` (o importa el esquema actualizado) |
| Una imagen no sube | Formato no soportado o más de 20 MB | Convierte a JPG/PNG/WebP y reduce el tamaño |
| La imagen desaparece tras un despliegue | Disco efímero en serverless | Usa un volumen persistente o S3 |
| No puedo entrar al panel | Credenciales distintas o sesión expirada | Revisa `.env.local`, vuelve a ejecutar el seed o cambia la contraseña |
| El panel redirige a login en cada ruta | Cookie bloqueada o dominio distinto | Usa el mismo dominio y HTTPS; revisa la configuración de cookies |

---

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
