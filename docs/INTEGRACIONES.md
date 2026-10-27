# Integraciones

Guía para conectar servicios reales al sistema de Adrenalina Extrema Huila.

## Principio general

La aplicación **no simula pagos, correos ni facturas DIAN**. Cuando una integración no está configurada:

- El panel la muestra como “no configurada”.
- El endpoint correspondiente responde `501` con un mensaje claro.
- La reserva sigue funcionando con registro manual de pagos.

Esto evita que un cliente reciba una confirmación de pago falsa o un documento que parezca una factura electrónica sin serlo.

---

## 1. WhatsApp

**Estado: funcional, sin credenciales adicionales.**

El sitio genera enlaces `wa.me` con mensajes prellenados desde:

- Botón flotante global.
- Detalle de glamping y de actividad.
- Confirmación de reserva.
- Página de contacto.

### Configuración

En **Admin → Configuración → Negocio**, edita el campo WhatsApp. También puedes definir un respaldo:

```env
NEXT_PUBLIC_WHATSAPP=+573000000000
```

El número se normaliza eliminando caracteres no numéricos. Para Colombia usa el formato internacional `+57...`.

### Mensaje de reserva

Al crear una reserva, `src/app/api/bookings/route.ts` construye una URL con:

- Código de reserva.
- Fechas y huéspedes.
- Total y anticipo.
- Nombre del alojamiento.

No se envía nada automáticamente: el usuario decide abrir WhatsApp.

### WhatsApp Business API (opcional)

Si más adelante quieres mensajes automáticos, necesitarás:

1. Una cuenta de WhatsApp Business Platform (Meta).
2. Un número verificado y plantillas aprobadas.
3. Un proveedor o integración directa con la Cloud API.
4. Un webhook para estados de entrega.

Ese flujo **no está implementado**. Los enlaces `wa.me` actuales no requieren API ni tokens.

---

## 2. Pagos en línea con Wompi

**Estado: preparado, no implementado.**

El sistema registra pagos manuales y calcula anticipo/saldo. Para cobrar en línea falta crear transacciones y conciliar webhooks.

### Variables

```env
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_EVENTS_SECRET=...
WOMPI_ENV=sandbox
```

`src/lib/settings.ts` marca la integración como habilitada solo si existen `WOMPI_PUBLIC_KEY` y `WOMPI_PRIVATE_KEY`.

### Flujo recomendado

1. **Crear la reserva** (ya existe) y dejarla en `pending`.
2. **Crear una transacción** en Wompi con:
   - `amount_in_cents` = anticipo o total, en centavos COP.
   - `currency` = `COP`.
   - `reference` = código de reserva + sufijo único.
   - `customer_email` = correo del huésped.
   - `redirect_url` = página de resultado.
   - Firma de integridad con la llave privada.
3. **Redirigir** al checkout o usar el widget de Wompi.
4. **Webhook** `transaction.updated`:
   - Verificar la firma con `WOMPI_EVENTS_SECRET`.
   - Buscar la reserva por `reference`.
   - Si el estado es `APPROVED`, registrar el pago con `status = 'approved'` y actualizar `payment_status`.
   - Si es `DECLINED`, `VOIDED` o `ERROR`, no marcar como pagado.
   - Guardar el ID de transacción para idempotencia.
5. **Reconciliación**: consultar la transacción por API antes de confirmar, no confiar solo en el redirect.

### Dónde implementarlo

- Nuevo Route Handler, por ejemplo `src/app/api/payments/wompi/route.ts` (crear transacción).
- Nuevo webhook, por ejemplo `src/app/api/webhooks/wompi/route.ts`.
- Reutilizar `src/lib/data/bookings.ts` para registrar pagos y recalcular saldos.

### Reglas de negocio

- El anticipo por defecto es el 30 % (`booking.depositPercent`).
- Un pago aprobado debe ser idempotente: si llega dos veces el mismo evento, no duplicar.
- No cambies una reserva a `confirmed` solo porque el usuario volvió del checkout; espera la confirmación del webhook o la consulta a la API.
- Mantén el registro manual de pagos como respaldo operativo.

### Pruebas

- Usa el entorno sandbox de Wompi y tarjetas de prueba.
- Verifica eventos duplicados, montos alterados y referencias inexistentes.
- Prueba el flujo con y sin webhook (reconciliación).

---

## 3. Facturación electrónica

**Estado: preparado, no implementado. La app no emite facturas DIAN.**

En Colombia, la facturación electrónica debe hacerse a través de un proveedor tecnológico autorizado o con un sistema propio validado. Este proyecto **no** genera CUFE, XML UBL, resolución DIAN ni validación previa.

### Endpoint actual

`POST /api/admin/bookings/[id]/invoice`

- Sin credenciales: `501` `INVOICING_NOT_CONFIGURED`.
- Con credenciales: `501` `INVOICING_MAPPING_PENDING` (falta el mapeo del proveedor).

### Variables

```env
FACTUS_CLIENT_ID=
FACTUS_CLIENT_SECRET=
FACTUS_API_URL=
```

Puedes usar Factus u otro proveedor autorizado (Alegra, Siigo, etc.). La app solo verifica que existan las variables.

### Qué falta implementar

1. **Datos fiscales del negocio**: NIT, razón social, régimen, resolución de facturación, prefijo, rango y fecha de vigencia.
2. **Datos del adquiriente**: nombre, NIT/cédula, correo, dirección, responsabilidad tributaria.
3. **Mapeo de conceptos**:
   - Alojamiento (noches × tarifa).
   - Actividades y servicios.
   - Impuestos y retenciones según corresponda.
4. **Llamada al proveedor**: crear factura, obtener XML/CUFE y estado de validación.
5. **Almacenamiento**: guardar número, CUFE, XML y PDF; asociarlos a la reserva.
6. **Estados**: borrador, emitida, validada, rechazada, anulada.
7. **Notas crédito** para cancelaciones o correcciones.
8. **Envío al cliente** por correo y entrega del PDF/XML.

### Reglas

- No muestres “factura emitida” hasta recibir confirmación del proveedor.
- No uses el comprobante PDF interno como factura.
- Separa claramente “comprobante de reserva y pagos” de “factura electrónica”.
- Conserva los documentos según los requisitos legales y contables aplicables.

### Referencias

- Documentación del proveedor contratado.
- Requisitos de facturación electrónica de la DIAN vigentes al momento de la implementación.

---

## 4. Correos transaccionales (SMTP)

**Estado: preparado, no implementado.**

Variables:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

`src/lib/settings.ts` marca el correo como habilitado si existen host, usuario y contraseña.

### Casos de uso sugeridos

- Confirmación de reserva al huésped.
- Notificación interna de nueva reserva.
- Recordatorio de llegada.
- Confirmación de pago del anticipo.
- Respuesta a mensajes de contacto.

### Implementación

1. Instala un cliente SMTP (por ejemplo `nodemailer`).
2. Crea `src/lib/email.ts` con una función `sendMail`.
3. Envía después de crear la reserva o registrar un pago.
4. Usa plantillas HTML simples y textos en español.
5. Maneja errores sin bloquear la reserva: el correo es secundario, la reserva ya existe.
6. Evita enviar datos sensibles innecesarios.

### Buenas prácticas

- Usa un remitente verificado (SPF/DKIM/DMARC).
- No pongas credenciales SMTP en el cliente.
- Registra intentos y errores para diagnóstico.
- Incluye enlace a la consulta de reserva (`/reserva?code=...&email=...`).

---

## 5. Almacenamiento de imágenes (S3-compatible)

**Estado: local por defecto.**

Las fotos se guardan en `UPLOAD_DIR` y se sirven desde `/api/media/[filename]`.

Para producción serverless o multi-instancia:

1. Crea un bucket (S3, R2, Supabase Storage, etc.).
2. Cambia `src/lib/storage.ts` para exponer una función de subida y otra de lectura.
3. En `src/app/api/admin/upload/route.ts`, sube el buffer al bucket y devuelve la URL pública o firmada.
4. Ajusta `/api/media/[filename]` o elimina la ruta si usas URLs directas.
5. Mantén la validación por firma binaria y el límite de 20 MB.
6. Define políticas de caché y de acceso.

La base de datos solo guarda la URL, así que la migración no requiere cambios de esquema.

---

## 6. Comprobantes PDF

**Estado: funcional.**

`src/lib/pdf/receipt.ts` genera un comprobante con:

- Datos del negocio y código de reserva.
- Huésped, fechas, huéspedes y estado.
- Detalle de alojamiento, actividades y servicios.
- Totales, anticipo, pagado y saldo.
- Pagos registrados.
- Aclaración expresa: **no es una factura electrónica validada por la DIAN**.

`next.config.ts` incluye `serverExternalPackages: ["pdfkit"]` para que las fuentes AFM se resuelvan correctamente en el servidor.

### Si personalizas el PDF

- Usa fuentes estándar (`Helvetica`) o registra una fuente TTF propia.
- Mantén la nota legal.
- Prueba con reservas sin pagos, con varios pagos y con textos largos.
- No incluyas datos de tarjeta.

---

## 7. Reportes CSV

**Estado: funcional.**

`GET /api/admin/reports/export?from=...&to=...&status=...`

- Requiere sesión de administrador.
- Exporta hasta 10 000 reservas.
- Incluye BOM UTF-8 para abrir correctamente en Excel.
- Columnas: código, fechas, huésped, alojamiento, estados, totales, anticipo, pagado, saldo y origen.

Para contabilidad, cruza los pagos con los comprobantes PDF. El CSV no reemplaza una factura electrónica.

---

## 8. Seguridad de las integraciones

- Guarda secretos solo en variables de entorno del servidor.
- Nunca expongas `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `FACTUS_CLIENT_SECRET` ni `SMTP_PASSWORD` en el cliente.
- Valida firmas de webhooks y usa comparación en tiempo constante cuando aplique.
- Implementa idempotencia por ID de evento/transacción.
- Verifica montos y moneda contra la reserva.
- Registra auditoría de cambios de estado y pagos.
- Limita el acceso a los endpoints de administración.
- Revisa los logs sin incluir datos personales innecesarios.
- Prueba en sandbox antes de producción.

---

## 9. Checklist para activar una integración

- [ ] Credenciales reales configuradas en el entorno.
- [ ] Endpoint implementado y probado en sandbox.
- [ ] Manejo de errores y reintentos.
- [ ] Idempotencia y validación de firmas.
- [ ] Registro en base de datos del ID externo.
- [ ] Estados visibles y coherentes en el panel.
- [ ] Pruebas de casos felices y fallidos.
- [ ] Documentación actualizada.
- [ ] Copia de seguridad y plan de reversa.
- [ ] Aviso claro al usuario de que no se simulan pagos/facturas.
