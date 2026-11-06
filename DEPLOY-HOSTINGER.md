# Publicar Carnalitos en Hostinger (plan Ilimitado)

Esta guía deja la tienda funcionando en el plan **Ilimitado** de Hostinger (equivalente a **Business/Unlimited**), que admite aplicaciones **Node.js/Next.js** y bases de datos **MySQL/MariaDB**.

> Resumen: la app ya usa **MySQL** mediante `mysql2`, el esquema está en `database/schema.sql` y los datos iniciales para producción en `database/seed-production.sql`. Para importar todo de una sola vez usa `database/install-hostinger.sql`.

---

## Ruta rápida

1. Sube el código actualizado a GitHub (rama `main`).
2. En Hostinger, haz **Redeploy** de la app Node.js.
3. En hPanel crea la base MySQL y guarda usuario, contraseña y nombre con prefijo.
4. En phpMyAdmin importa `database/install-hostinger.sql`.
5. En las variables de entorno de la app configura `DB_HOST=127.0.0.1`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `NEXT_PUBLIC_APP_URL` y `UPLOAD_DIR`.
6. Abre `https://tudominio.com/api/health`: debe decir `status: ok`.

---

## 1. Requisitos

- Plan **Ilimitado / Business** activo (los planes compartidos básicos no incluyen Node.js).
- Dominio o subdominio apuntando a Hostinger.
- Node.js **22.x** (recomendado; también sirve 20.x).
- Una base de datos MySQL creada desde hPanel.

La app no necesita WebSockets entrantes ni workers permanentes, así que encaja con las limitaciones del hosting compartido de Hostinger.

---

## 2. Crear la base de datos en Hostinger

1. Entra a **hPanel → Websites → Administrar sitio → Bases de datos → Administración**.
2. Crea una base de datos. Hostinger mostrará nombres con prefijo, por ejemplo:
   - Base de datos: `u123456789_carnalitos`
   - Usuario: `u123456789_carnalitos`
   - Contraseña: la que definas
   - Host: `127.0.0.1`
3. Guarda esos datos. **No uses `localhost`** en Node.js: usa `127.0.0.1`.

### Importar el esquema y los datos

1. Abre **phpMyAdmin** desde hPanel y selecciona la base creada.
2. Pestaña **Importar** → selecciona **`database/install-hostinger.sql`** → **Continuar**.
   Este único archivo crea las tablas y carga el administrador, la configuración, las 5 categorías y los 10 productos. Es seguro importarlo más de una vez: no borra ni duplica datos.
3. Verifica que existan las tablas `admin_users`, `settings`, `categories`, `products`, `orders`, `order_items` y `contact_messages`.

> Alternativa: importar primero `database/schema.sql` y después `database/seed-production.sql`. Ambos también son idempotentes.

`seed-production.sql` crea:

- Administrador inicial: `carnalitosbarf@gmail.com`
- Contraseña inicial: `Cami0510*`
- Configuración, 5 categorías y 10 productos.
- **No** crea pedidos ni mensajes de demostración.

Cambia la contraseña desde el panel apenas entres.

> Si prefieres ejecutar los scripts desde tu computador, habilita el acceso remoto a MySQL en hPanel, coloca el host remoto en `DB_HOST` y ejecuta `npm run db:setup`. Para producción se recomienda la importación por phpMyAdmin.

---

## 3. Preparar el proyecto para subir

Sube **solo el código fuente**. Excluye:

```text
node_modules/
.next/
.git/
.env.local
storage/uploads/*
```

Incluye siempre `package.json` y `package-lock.json` para que Hostinger instale las versiones exactas.

### Opción A: GitHub (recomendada)

1. Crea un repositorio y sube el proyecto.
2. En Hostinger: **Websites → Create site → Web App → Import Git Repository**.
3. Autoriza GitHub y selecciona el repositorio y la rama.
4. Configura el build (ver sección 4).
5. Agrega las variables de entorno y despliega.

### Opción B: ZIP

1. Comprime el proyecto sin las carpetas indicadas arriba.
2. En Hostinger: **Create site → Web App → Upload your website files**.
3. Sube el ZIP y sigue el asistente.

---

## 4. Configuración de build en Hostinger

| Campo | Valor |
|---|---|
| Framework | **Next.js** (si no lo detecta, elige “Other”) |
| Node.js | **22.x** |
| Build command | `npm run build` |
| Output directory | `.next` |
| Start command / Entry | `npm start` (Hostinger suele detectarlo solo) |
| Root directory | `/` (raíz del repositorio) |

El proyecto ya compila con `next build --webpack` para evitar el error de Turbopack en los servidores de build de Hostinger.

---

## 5. Variables de entorno

En el asistente de despliegue abre **Environment variables → Add more / Import .env** y agrega:

```env
# Base de datos MySQL de Hostinger
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=u123456789_carnalitos
DB_PASSWORD=TU_CONTRASEÑA
DB_NAME=u123456789_carnalitos
DB_CONNECTION_LIMIT=5

# Sitio
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tudominio.com
NEXT_PUBLIC_WHATSAPP=+573108338636

# Administrador (solo lo usan los scripts de seed)
ADMIN_NAME=Administrador Carnalitos
ADMIN_EMAIL=carnalitosbarf@gmail.com
ADMIN_PASSWORD=TuClaveSegura

# Imágenes persistentes (ruta absoluta)
UPLOAD_DIR=/home/u123456789/domains/tudominio.com/storage/uploads

# Correo (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=carnalitosbarf@gmail.com
SMTP_PASS=tu_password_de_aplicacion
EMAIL_USER=carnalitosbarf@gmail.com
EMAIL_PASS=tu_password_de_aplicacion

# WhatsApp (opcional)
CALLMEBOT_API_KEY=
CALLMEBOT_PHONE=+573108338636

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Notas importantes:

- **`NEXT_PUBLIC_APP_URL` es de build**: si la cambias, vuelve a desplegar.
- `NEXT_PUBLIC_*` también se graba en el build.
- Usa el **nombre completo** de base y usuario (con prefijo).
- Nunca subas `.env.local` al repositorio.

---

## 6. Imágenes persistentes (importante)

Cada despliegue de Hostinger crea una carpeta nueva y reemplaza `hbuilds/current`. Si guardas las imágenes dentro del proyecto, **se pierden al volver a desplegar**.

Solución:

1. En **File Manager**, crea una carpeta fuera de `hbuilds` y `public_html`, por ejemplo:

   ```text
   /home/u123456789/domains/tudominio.com/storage/uploads
   ```

2. Define `UPLOAD_DIR` con esa ruta absoluta.
3. Verifica permisos de escritura para el usuario de la app.
4. Sube una imagen desde **Admin → Productos** y comprueba que se vea en `/api/media/...`.

La base de datos solo guarda la URL (`/api/media/archivo.jpg`), así que las imágenes siguen funcionando entre despliegues.

---

## 7. Primer acceso y pruebas

Antes de entrar al panel, abre esta URL para confirmar que la app y la base están conectadas:

```text
https://tudominio.com/api/health
```

Debe responder `{"status":"ok", ...}`. Si responde `503`, el mismo JSON indica si faltan variables, tablas o credenciales.

1. Abre `https://tudominio.com/admin/login`.
2. Entra con:
   - Correo: `carnalitosbarf@gmail.com`
   - Contraseña: `Cami0510*`
3. Cambia la contraseña en **Configuración → Cuenta**.
4. Revisa **Configuración** (datos del negocio, envío, condiciones).
5. Prueba:
   - Inicio y tienda con productos.
   - Una compra de prueba.
   - Consulta del pedido por código.
   - Cambio de estado del pedido en el panel.
   - Subida de una imagen.
   - Envío del formulario de contacto.
   - Notificaciones de correo/WhatsApp si las configuraste.
6. Elimina el pedido de prueba si lo deseas.

---

## 8. Dominio y SSL

1. Conecta el dominio en **hPanel → Dominios**.
2. Activa el **SSL gratuito**.
3. Confirma que `NEXT_PUBLIC_APP_URL` use `https://`.
4. Vuelve a desplegar si cambiaste esa variable.
5. Prueba tanto `tudominio.com` como `www.tudominio.com` (Hostinger ejecuta procesos separados para cada uno).

---

## 9. Actualizaciones y copias de seguridad

- Para actualizar: haz `push` a la rama conectada o sube un ZIP nuevo y **Deploy**.
- La base MySQL y la carpeta de `UPLOAD_DIR` no se tocan al desplegar.
- Descarga copias periódicas de la base desde phpMyAdmin (**Exportar**) y de la carpeta de imágenes desde File Manager.
- Revisa **Resource Usage** y **Deployments** en el panel de Hostinger.

---

## 10. Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| “This page couldn't load / server error” (500) | La app desplegada no tiene la versión MySQL o le faltan variables. Verifica que el último commit esté desplegado y abre `/api/health`. |
| `/api/health` responde 503 | El JSON indica el problema exacto: variables faltantes, credenciales incorrectas o tablas sin importar. |
| `Table '...' doesn't exist` | Importa `database/install-hostinger.sql` en phpMyAdmin. |
| `Access denied for user ...@'::1'` | `DB_HOST` está en `localhost`. Cámbialo a `127.0.0.1` y reinicia la app. |
| `ER_BAD_DB_ERROR` | El nombre de la base no incluye el prefijo o no existe. Revisa `DB_NAME`. |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL no está disponible o el puerto no es 3306. |
| Error 503 | Límite de procesos/memoria del plan. Reinicia la app y revisa Resource Usage. |
| Las imágenes desaparecen al desplegar | `UPLOAD_DIR` apunta dentro del proyecto. Usa una ruta absoluta fuera de `hbuilds`. |
| El build falla por Turbopack | Ya está forzado `next build --webpack`; si persiste, revisa los build logs. |
| 403 después de desplegar | El `.htaccess` de `public_html` lo genera Hostinger; no lo edites y vuelve a desplegar. |
| Cambios que no aparecen | Fuerza **Deployments → Redeploy**, limpia caché CDN y reinicia la app. |
| No entran los correos | Gmail requiere una **contraseña de aplicación**, no la contraseña normal. |
| `Duplicate entry` al guardar | Ya existe ese slug/correo/código. Usa otro valor. |

---

## 11. Límites de Hostinger que conviene conocer

- Una sola petición se corta a los **120 segundos**.
- No hay WebSockets entrantes ni workers permanentes.
- El plan Ilimitado/Business permite hasta **5 sitios Node.js**.
- Un proceso Next.js puede consumir unos 10–11 hilos; el plan comparte un límite de procesos.
- No se pueden abrir puertos propios: la app debe escuchar en el puerto que Hostinger asigna (Next.js lo toma de `PORT` automáticamente).

Con esta configuración la tienda queda lista para producción.
