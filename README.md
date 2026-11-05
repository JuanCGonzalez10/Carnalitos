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
| Base de datos | PostgreSQL (`pg`) |
| Autenticación | Sesiones propias con scrypt + cookie HTTP-only |
| Validación | Zod |

---

## Requisitos

- **Node.js 20+** (probado con Node 22).
- **PostgreSQL 14+** con permisos para crear extensiones (`pgcrypto`).
- npm.

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

3. **Configura PostgreSQL** en `.env.local`:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carnalitos
   ```

   El script crea la base de datos si no existe.

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
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL |
| `DATABASE_SSL` | No | `true` para proveedores gestionados que exigen SSL |
| `ADMIN_NAME` | No | Nombre del administrador inicial |
| `ADMIN_EMAIL` | Sí | Correo del administrador inicial |
| `ADMIN_PASSWORD` | Sí | Contraseña del administrador inicial |
| `NEXT_PUBLIC_APP_URL` | No | URL pública del sitio (metadatos y enlaces) |
| `NEXT_PUBLIC_WHATSAPP` | No | Número de WhatsApp de respaldo |
| `UPLOAD_DIR` | No | Carpeta local de imágenes subidas (por defecto `storage/uploads`) |

---

## Base de datos y scripts

| Comando | Qué hace |
|---|---|
| `npm run db:setup` | Crea la base si falta, aplica `database/schema.sql` y ejecuta el seed |
| `npm run db:seed` | Vuelve a cargar datos iniciales sin borrar la base |
| `npm run db:reset` | **Elimina todas las tablas** y reconstruye desde cero |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación de tipos |

El esquema es idempotente (`create table if not exists`). El seed crea/actualiza el administrador, inserta las categorías con `on conflict do update`, y **no sobrescribe** productos existentes (`on conflict do nothing`), para respetar los cambios de precio o stock hechos desde el panel.

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
  schema.sql                 Esquema PostgreSQL, índices y settings iniciales
scripts/
  setup-db.mjs               Crea la base, aplica el esquema y ejecuta el seed
  seed.mjs                   Categorías, productos, pedidos demo y administrador
  db-config.mjs              Conexión, SSL y utilidades de base de datos
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
    db.ts                    Pool de PostgreSQL y transacciones
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

La app necesita un entorno **Node.js** con acceso a PostgreSQL y, para imágenes locales, un disco persistente. Opciones habituales: VPS, Docker, Render, Railway o Fly.io con volumen.

### Pasos generales

1. Configura las variables de entorno de producción.
2. Ejecuta `npm run db:setup` (o aplica `database/schema.sql` y luego el seed) contra la base de producción.
3. Ejecuta `npm run build` y `npm run start`.
4. Define `NEXT_PUBLIC_APP_URL` con el dominio real.
5. Monta un volumen persistente en `UPLOAD_DIR` o conecta almacenamiento S3-compatible.
6. Cambia la contraseña del administrador.

### Notas

- Las rutas de subida usan el runtime de Node.js (`export const runtime = "nodejs"`).
- En Vercel, las imágenes locales no persisten; usa S3 o un volumen externo.
- El middleware de Next.js 16 sigue funcionando, aunque la versión actual recomienda migrar a la convención `proxy`.

---

## Seguridad antes de publicar

- [ ] Cambia `ADMIN_PASSWORD` y vuelve a ejecutar `npm run db:seed` (o cambia la contraseña desde Configuración).
- [ ] Usa una contraseña larga y única.
- [ ] Configura HTTPS en producción.
- [ ] Revisa `ADMIN_EMAIL` y elimina usuarios que no necesites.
- [ ] No publiques `.env.local` (ya está en `.gitignore`).
- [ ] Define `DATABASE_SSL=true` si tu proveedor lo exige.
- [ ] Limita el acceso a la base de datos por red/firewall.
- [ ] Revisa textos, precios, condiciones y datos legales antes de abrir al público.
- [ ] Configura copias de seguridad de PostgreSQL y del directorio de imágenes.
- [ ] Si conectas pagos reales, valida los webhooks y nunca confíes solo en el cliente.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `ECONNREFUSED` al iniciar | PostgreSQL no está corriendo o `DATABASE_URL` es incorrecta | Inicia PostgreSQL y revisa la cadena de conexión |
| `extension "pgcrypto" is not available` | El usuario no puede crear extensiones | Usa un superusuario o habilita la extensión manualmente |
| Las columnas nuevas no existen | Esquema anterior | Ejecuta `npm run db:setup` |
| Una imagen no sube | Formato no soportado o más de 20 MB | Convierte a JPG/PNG/WebP y reduce el tamaño |
| La imagen desaparece tras un despliegue | Disco efímero en serverless | Usa un volumen persistente o S3 |
| No puedo entrar al panel | Credenciales distintas o sesión expirada | Revisa `.env.local`, vuelve a ejecutar el seed o cambia la contraseña |
| El panel redirige a login en cada ruta | Cookie bloqueada o dominio distinto | Usa el mismo dominio y HTTPS; revisa la configuración de cookies |

---

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
