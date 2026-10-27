# Adrenalina Extrema Huila

Sitio web y sistema de reservas para un centro de glamping y aventura en el Cañón del Magdalena (Huila, Colombia).

Incluye catálogo público, motor de reservas con disponibilidad real, panel administrativo protegido, tarifas por temporada/fin de semana/festivos, comprobantes PDF, reportes CSV y la preparación de integraciones de pago, WhatsApp y facturación electrónica.

> **Contenido provisional:** los textos, precios, fotografías y datos de contacto iniciales son de demostración y deben editarse desde el panel antes de publicar. No se inventaron datos legales ni se simulan pagos o facturas DIAN.

---

## Contenido

- [Qué incluye](#qué-incluye)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Puesta en marcha](#puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos y scripts](#base-de-datos-y-scripts)
- [Tarifas: base, fin de semana y festivos](#tarifas-base-fin-de-semana-y-festivos)
- [Fotografías y almacenamiento](#fotografías-y-almacenamiento)
- [Reservas, pagos y comprobantes](#reservas-pagos-y-comprobantes)
- [Integraciones](#integraciones)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Despliegue](#despliegue)
- [Seguridad antes de publicar](#seguridad-antes-de-publicar)
- [Solución de problemas](#solución-de-problemas)

---

## Qué incluye

### Sitio público

| Ruta | Descripción |
|---|---|
| `/` | Inicio con propuesta de valor, alojamientos destacados, actividades y llamado a reservar |
| `/glampings` | Catálogo de alojamientos con precio desde, capacidad y filtros visuales |
| `/glampings/[slug]` | Detalle: galería, amenidades, condiciones, tarifas base/fin de semana/festivo, temporadas y caja de disponibilidad |
| `/actividades` | Catálogo de experiencias de aventura |
| `/actividades/[slug]` | Detalle con duración, dificultad, edad mínima, inclusión, requisitos y tarifas |
| `/galeria` | Galería fotográfica por categorías |
| `/contacto` | Ubicación, mapa, canales de contacto, condiciones y formulario |
| `/reservar` | Asistente de reserva en 3 pasos con cotización y disponibilidad en vivo |
| `/reserva` | Consulta de una reserva por código y correo |

También incluye navegación responsive, botón flotante de WhatsApp, enlaces a redes sociales, SEO básico (`sitemap.ts`, `robots.ts`, metadatos Open Graph) y animaciones sutiles con Framer Motion.

### Reservas

- Validación de fechas, capacidad, noches mínimas y extras.
- Prevención de reservas solapadas a nivel de base de datos (`EXCLUDE USING gist` + `daterange`).
- Cotización automática por noche, actividades y servicios.
- Códigos únicos de reserva (`AEH-XXXXXX`).
- Estados de reserva: pendiente, confirmada, check-in, completada, cancelada, no-show.
- Estados de pago: sin pago, anticipo pagado, pagado, reembolsado.
- Anticipo configurable (por defecto 30 %) y saldo pendiente.
- Consulta pública de la reserva por código + correo.
- Mensaje prellenado de WhatsApp al finalizar.

### Panel administrativo (`/admin`)

- Autenticación propia con contraseña (scrypt) y sesión en cookie HTTP-only.
- Panel con ingresos cobrados, saldo por cobrar, reservas del mes, ocupación, próximas llegadas y actividad reciente.
- **Reservas:** listado, filtros, detalle, cambio de estado, registro de pagos, comprobante PDF y facturación (integración).
- **Clientes:** historial y datos de contacto.
- **Mensajes:** bandeja de mensajes del formulario público.
- **Glampings:** información, fotos (subir, reordenar, marcar principal, eliminar), tarifas por temporada, fechas bloqueadas y vista previa.
- **Actividades y servicios:** CRUD, precios base/fin de semana/festivo, publicación y destacados.
- **Galería:** carga múltiple, categorías, orden y visibilidad.
- **Reportes:** métricas por periodo, métodos de pago, top alojamientos, exportación CSV e impresión.
- **Configuración:** datos del negocio, reglas de reserva, estado de integraciones y cambio de contraseña.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React Compiler) |
| UI | React 19, TypeScript, Tailwind CSS, Framer Motion |
| Base de datos | PostgreSQL (`pg`) |
| Autenticación | Sesiones propias con scrypt + cookie HTTP-only |
| PDF | `pdfkit` |
| Validación | Zod |
| Pruebas | Vitest |

---

## Requisitos

- **Node.js 20+** (probado con Node 22).
- **PostgreSQL 14+** con permisos para crear extensiones (`pgcrypto`, `btree_gist`).
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
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/adrenalina_extrema
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

   - Sitio público: <http://localhost:3000>
   - Panel: <http://localhost:3000/admin/login>

6. **Ingresa al panel** con el correo y la contraseña definidos en `.env.local` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Los valores por defecto son:

   ```text
   Correo: admin@adrenalinaextrema.co
   Contraseña: Adrenalina2026!
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
| `UPLOAD_DIR` | No | Carpeta local de fotos subidas (por defecto `storage/uploads`) |
| `WOMPI_PUBLIC_KEY` | No | Llave pública de Wompi |
| `WOMPI_PRIVATE_KEY` | No | Llave privada de Wompi |
| `WOMPI_EVENTS_SECRET` | No | Secreto de webhooks de Wompi |
| `WOMPI_ENV` | No | `sandbox` o `production` |
| `FACTUS_CLIENT_ID` | No | Credencial del proveedor de facturación electrónica |
| `FACTUS_CLIENT_SECRET` | No | Credencial del proveedor de facturación electrónica |
| `FACTUS_API_URL` | No | Endpoint del proveedor de facturación |
| `SMTP_HOST` | No | Servidor SMTP para correos transaccionales |
| `SMTP_PORT` | No | Puerto SMTP (por defecto 587) |
| `SMTP_USER` | No | Usuario SMTP |
| `SMTP_PASSWORD` | No | Contraseña SMTP |
| `SMTP_FROM` | No | Remitente de los correos |

Sin credenciales de integraciones el sistema funciona normalmente, pero **no simula pagos ni facturas DIAN**.

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
| `npm run test` | Pruebas unitarias (Vitest) |

El esquema es idempotente: usa `create table if not exists`, `alter table ... add column if not exists` e índices condicionales. Puedes volver a ejecutar `db:setup` sobre una base existente para aplicar columnas nuevas sin perder información.

El seed no sobrescribe el nombre ni el precio de glampings ya existentes; solo completa tarifas de fin de semana/festivo cuando están vacías. Aun así, revisa los datos después de cada ejecución.

---

## Tarifas: base, fin de semana y festivos

Cada glamping y cada actividad tiene tres precios:

| Tarifa | Cuándo se aplica |
|---|---|
| **Base** | Noches de lunes a viernes sin festivo |
| **Fin de semana** | Noche de **sábado o domingo** |
| **Festivo** | **Festivo colombiano** (fijos, Ley Emiliani y Semana Santa) |

### Precedencia por noche (glampings)

1. **Temporada** configurada con rango de fechas (la que empieza más tarde gana si hay solapamiento).
2. **Festivo** colombiano.
3. **Fin de semana** (sábado/domingo).
4. **Base**.

Si una tarifa de fin de semana o festivo está vacía, se usa la base. Las temporadas también pueden exigir noches mínimas.

### Precio de actividades

El precio de una actividad se define según la **fecha de llegada** de la reserva:

1. Si la llegada es festivo → precio de festivo.
2. Si es sábado o domingo → precio de fin de semana.
3. En otro caso → precio base.

Si la tarifa especial no está configurada, se usa la base.

### Festivos colombianos

Se calculan automáticamente en `src/lib/booking/holidays.ts`:

- Fijos: Año Nuevo, Día del Trabajo, Independencia, Batalla de Boyacá, Inmaculada Concepción y Navidad.
- Trasladados al lunes por la **Ley Emiliani**: Reyes Magos, San José, San Pedro y San Pablo, Asunción, Día de la Raza, Todos los Santos e Independencia de Cartagena.
- Semana Santa y derivados: Jueves Santo, Viernes Santo, Ascensión, Corpus Christi y Sagrado Corazón.

No hay que mantener una lista manual de fechas: el cálculo cubre cualquier año.

### Dónde se editan

- **Glampings → [alojamiento] → Tarifas y fechas:** precio base, sábado/domingo y festivo, además de temporadas por rango de fechas y noches mínimas.
- **Glampings → [alojamiento] → Información:** también permite ajustar esos tres precios generales en «Capacidad y precio».
- **Actividades → [actividad]:** precio base, fin de semana y festivo.

El sitio público y el asistente de reserva muestran la tarifa aplicable y el desglose por noche.

---

## Fotografías y almacenamiento

- Formatos aceptados: **JPG, PNG, WebP, GIF y AVIF**.
- Tamaño máximo: **20 MB** por archivo.
- El servidor detecta el tipo real por firma binaria, no por extensión ni MIME declarado.
- El navegador reduce fotos muy grandes antes de subirlas (máximo 2400 px) y convierte HEIC/HEIF cuando el navegador puede leerlo.
- Si el navegador no puede convertir un HEIC/HEIF, el servidor responde con un mensaje claro pidiendo convertir a JPG o PNG.
- Las fotos se guardan en `UPLOAD_DIR` (por defecto `storage/uploads`) y se sirven en `/api/media/[filename]`.

### Persistencia en producción

El sistema de archivos local es ideal para desarrollo o un VPS. En plataformas serverless (por ejemplo, Vercel) el disco es efímero: las fotos subidas se pierden entre despliegues. Para producción:

1. Monta un **volumen persistente** en `UPLOAD_DIR`, o
2. Sustituye `src/lib/storage.ts` y la ruta `/api/media` por un almacenamiento S3-compatible (S3, Cloudflare R2, Supabase Storage, etc.).

La base de datos guarda la URL de cada foto; si migras a S3, solo cambia la URL que devuelve la subida.

### Panel de fotos

- Subida múltiple y por arrastre.
- Reordenar con flechas o arrastrando.
- Marcar una foto como principal (se sincroniza con la portada del glamping).
- Eliminar una foto; si era la principal, se promueve la siguiente automáticamente.
- La vista se refresca tras cada operación para evitar estados desactualizados.

---

## Reservas, pagos y comprobantes

- El anticipo se calcula con `booking.depositPercent` (editable en Configuración).
- Los pagos se registran manualmente desde el detalle de la reserva (efectivo, Nequi, Bancolombia, tarjeta, transferencia u otro).
- El estado de pago y el saldo se recalculan al registrar o eliminar pagos.
- **Comprobante PDF:** descargable desde el detalle de la reserva. Certifica los pagos registrados y aclara que **no es una factura electrónica DIAN**.
- **Reportes CSV:** exportación con filtros por fecha y estado; incluye totales, anticipo, pagado y saldo.
- **Impresión:** el resumen de reportes tiene una hoja de estilos para imprimir.

---

## Integraciones

La app está preparada para conectar servicios reales, pero no los simula. El detalle técnico está en [`docs/INTEGRACIONES.md`](docs/INTEGRACIONES.md).

| Integración | Estado | Qué falta |
|---|---|---|
| **WhatsApp** | Funcional | Solo configura el número en Configuración o `NEXT_PUBLIC_WHATSAPP` |
| **Pagos en línea (Wompi)** | Preparado | Implementar la creación de transacciones y el webhook con credenciales reales |
| **Facturación electrónica (Factus u otro)** | Preparado | Mapear la reserva al API del proveedor autorizado |
| **Correos transaccionales (SMTP)** | Preparado | Enviar confirmaciones y recordatorios con un servidor SMTP |
| **Redes sociales** | Funcional | Editar enlaces en Configuración |

El endpoint `/api/admin/bookings/[id]/invoice` responde `501` mientras no exista un proveedor configurado. El panel muestra el estado como “no configurado”, nunca como factura emitida.

---

## Estructura del proyecto

```text
database/
  schema.sql                 Esquema PostgreSQL, índices y restricciones
scripts/
  setup-db.mjs               Crea la base, aplica el esquema y ejecuta el seed
  seed.mjs                   Datos iniciales y administrador
  db-config.mjs              Conexión, SSL y utilidades de base de datos
src/
  app/
    (public)/                Inicio, glampings, actividades, galería, contacto, reservar, reserva
    admin/                   Login y panel administrativo
    api/                     Route Handlers (auth, quote, bookings, admin, media, reports)
  components/
    admin/                   Editores y gestores del panel
    booking/                 Asistente de reserva
    forms/                   Formularios públicos
    shared/                  Navbar, heroes, tarjetas, galería, badges
    ui/                      Iconos e imágenes
  lib/
    auth/                    Contraseñas, sesiones y rate limit
    booking/                 Disponibilidad, cotización, festivos y códigos
    data/                    Consultas de glampings, catálogo y reservas
    pdf/                     Comprobante PDF
    api/                     Guardas de autenticación
    db.ts                    Pool de PostgreSQL y transacciones
    storage.ts               Directorio de subidas
    uploads.ts               Validación, conversión y subida en el navegador
    validation.ts            Esquemas Zod
  types/                     Tipos compartidos
storage/
  uploads/                   Fotos subidas (ignoradas por git)
middleware.ts                Protección de /admin y /api/admin
```

---

## Despliegue

La app necesita un entorno **Node.js** con acceso a PostgreSQL y, para fotos locales, un disco persistente. Opciones habituales: VPS, Docker, Render, Railway o Fly.io con volumen.

### Pasos generales

1. Configura las variables de entorno de producción.
2. Ejecuta `npm run db:setup` (o aplica `database/schema.sql` y luego el seed) contra la base de producción.
3. Ejecuta `npm run build` y `npm run start`.
4. Define `NEXT_PUBLIC_APP_URL` con el dominio real.
5. Monta un volumen persistente en `UPLOAD_DIR` o conecta almacenamiento S3-compatible.
6. Cambia la contraseña del administrador.

### Notas

- `next.config.ts` marca `pdfkit` como paquete externo del servidor para que encuentre sus fuentes AFM al generar PDF.
- La ruta de subida y los PDF usan el runtime de Node.js (`export const runtime = "nodejs"`).
- En Vercel, las fotos locales no persisten; usa S3 o un volumen externo.
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
- [ ] Revisa los textos, precios, condiciones y datos legales antes de abrir al público.
- [ ] Configura copias de seguridad de PostgreSQL y del directorio de fotos.
- [ ] Si conectas pagos o facturación, valida los webhooks y nunca confíes solo en el cliente.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `ECONNREFUSED` al iniciar | PostgreSQL no está corriendo o `DATABASE_URL` es incorrecta | Inicia PostgreSQL y revisa la cadena de conexión |
| `extension "btree_gist" is not available` | El usuario no puede crear extensiones | Usa un superusuario o habilita la extensión manualmente |
| Las columnas nuevas no existen | Esquema anterior | Ejecuta `npm run db:setup` |
| Una foto no sube | Formato no soportado, HEIC sin conversión o más de 20 MB | Convierte a JPG/PNG/WebP y reduce el tamaño |
| La foto desaparece tras un despliegue | Disco efímero en serverless | Usa un volumen persistente o S3 |
| El PDF responde 500 | `pdfkit` no encuentra sus fuentes | Verifica `serverExternalPackages: ["pdfkit"]` en `next.config.ts` y reinstala dependencias |
| No puedo entrar al panel | Credenciales distintas o sesión expirada | Revisa `.env.local`, vuelve a ejecutar el seed o cambia la contraseña |
| El panel redirige a login en cada ruta | Cookie bloqueada o dominio distinto | Usa el mismo dominio y HTTPS; revisa la configuración de cookies |
| Los precios de fin de semana no cambian | La noche no es sábado/domingo ni festivo, o la tarifa está vacía | Revisa la fecha y configura la tarifa en el panel |

---

## Licencia

MIT. Consulta [`LICENSE`](LICENSE).
