# PROYECTO — Cabañas La Maite (pagina-realestate)

Handoff para continuar el desarrollo desde cualquier computadora. Última actualización: 2026-08-20.
Leer TODO antes de tocar código. Si algo de este documento contradice lo que ves en el repo, el repo manda.

---

## 1. Qué es este proyecto

Sitio web estático + funciones serverless (Vercel) de un hospedaje con **2 lofts** en **Playa Sámara, Nicoya, Guanacaste, Costa Rica**: "Cabañas La Maite" (en Google/Facebook figura como "Cabañas Lamaite").

**Funcionalidad actual:** página de presentación bilingüe (ES/EN) + **reserva directa con pago en línea** (100% del total al reservar, PayPal con tarjeta sin cuenta) + **sistema iCal anti overbooking** (la web bloquea fechas reservadas en Booking/Airbnb/Expedia y viceversa) + notificación por email de cada reserva + contacto WhatsApp/redes/SINPE Móvil.

---

## 2. Repositorio y git

- **Remote:** `https://github.com/clientmanagement-hash/test-whatever.git` (único remote `origin`)
- **Branch:** `main` (única rama). Se trabaja directo sobre main, sin PRs.
- **Convención con el dueño:** después de CADA cambio aceptado → `git add ... && git commit -m "..." && git push origin main`. Mensajes de commit en **español**, descriptivos.
- `.gitignore`: `contenido/`, `.reasonix/`, `.DS_Store`, `*.log`, `docs/*.docx`, `.env*`. **NUNCA** commitear `contenido/` ni credenciales.

---

## 3. Estructura de archivos

```
/ (raíz)
├── index.html      → portada (hero, stats, lofts con carrusel, galería, ubicación, reservar, footer)
├── loft-1.html     → página de detalle Loft 1
├── loft-2.html     → página de detalle Loft 2
├── admin.html      → panel de administración del calendario iCal (PIN)
├── styles.css      → TODO el CSS (único stylesheet)
├── script.js       → TODO el JS del frontend (i18n, menú, carrusel, calendario propio, widget, pago)
├── package.json    → única dependencia: @vercel/kv (para el almacenamiento persistente)
├── vercel.json     → cron diario 04:00 → /api/ical/external/refresh-all
├── api/            → Funciones serverless de Vercel (CommonJS obligatorio, ver §13)
│   ├── paypal/
│   │   ├── _pricing.js      → precios (fuente de verdad del COBRO; incluye desayuno y Semana Santa)
│   │   ├── config.js        → GET /api/paypal/config (client id público + precios)
│   │   ├── create-order.js  → POST (crea orden PayPal; valida propiedad + disponibilidad → 409)
│   │   └── capture-order.js → POST (cobra, registra reserva, envía email de aviso)
│   └── ical/
│       ├── _lib.js          → almacenamiento (Upstash/efímero), propiedades, disponibilidad, PIN
│       ├── _ics.js          → generar/parsear ICS (RFC 5545)
│       ├── property/[propertyId].js → GET feed .ics público por propiedad
│       ├── reservations.js  → POST/DELETE reservas
│       ├── availability.js  → GET rangos bloqueados (para el widget)
│       ├── external.js      → POST importar calendario externo
│       ├── external/[id].js → POST refresh / DELETE
│       ├── external/refresh-all.js → POST refrescar todos (cron/manual)
│       └── admin.js         → GET datos del panel (PIN)
├── samples/external.ics → feed de prueba para el import (se puede borrar)
├── img/
│   ├── logo.png, favicon.png, hero.jpg
│   ├── loft1/  (15 fotos 3728xxxx.jpg — resolución baja 576-1024px)
│   ├── loft2/  (loft2-01…17.jpg — capturas de pantalla ~600px, resolución muy baja)
│   └── gallery/ (g1…g5.jpg — fotos de la galería)
├── contenido/      → ⚠️ EXCLUIDO de git (fotos y textos originales del cliente). No tocar.
└── docs/handoff/   → este documento
```

---

## 4. Stack y arquitectura

- **HTML5 + CSS3 + Vanilla JS** (ES6), sin build. Recursos externos: Google Fonts (Roboto) y el SDK de PayPal (se carga dinámico).
- Frontend estático + **funciones serverless de Vercel** en `api/` (Node, CommonJS, `fetch` global disponible).
- `script.js` corre al final del `<body>` (no usa DOMContentLoaded). **Cada sección está guardada** (no rompe si falta un elemento, p. ej. en páginas de loft no hay widget).
- Para probar local: `python3 -m http.server 8000`. **Ojo:** localmente `/api/*` no existe → el pago/iCal se degradan (el widget funciona, muestra avisos; el calendario no bloquea).

---

## 5. Sistema de diseño

**Paleta** (`:root` en styles.css, del logo, sin rosa): verdes bosque (`--verde-950…300`), acento arena `--tan-500:#a97d45`/`--tan-600`, fondos `--arena`, `--ink`. Fuente Roboto.

**Secciones index:** header fijo · hero full-screen · franja de datos ("A 900 m de Playa Buena Vista" / "Piscina" / "9.8 Excepcional" / "A 1,6 km de Playa Sámara") · lofts (tarjetas con **carrusel de 5 fotos** + flechas + dots + swipe) · galería (mosaico + lightbox) · ubicación (mapa + badge VFH4+X8) · reservar · footer.

**Responsive:** breakpoints 1024/860/560px; menú móvil drawer; `prefers-reduced-motion`.

---

## 6. i18n ES/EN

- **Español = contenido del HTML**; el inglés se aplica por JS (`I18N.en`, ~190 claves en `script.js`).
- Atributos: `data-i18n` (texto), `data-i18n-html` (innerHTML), `data-i18n-attr="attr:clave"`.
- `applyLang()` re-traduce textos dinámicos vía `registerDynamic(fn)` (el widget y el calendario se registran).
- **Regla:** toda clave usada debe existir en el diccionario (verificar §10.1).
- Detección: `localStorage 'maite-lang'` → `navigator.language`; botones ES|EN en el menú.

---

## 7. Tarifas (ESTADO ACTUAL — el dueño cambia seguido, confirmar siempre)

```
Base:            $116/noche para 2 personas, todo el año (tarifa fija)
Persona extra:   +$10/persona/noche
Mínimo:          2 noches · Máximo: 60 noches · Máx 8 huéspedes
Pago:            100% del total al reservar (depositPct: 100)
Semana Santa:    2027-03-21 → 2027-03-28: $130,50/noche (evento único en BOOKING.events)
Desayuno:        $11 por persona por noche (interruptor en el widget)
                 Ej.: 2 noches × 2 personas = +$44 → total $276
```
- **FUENTE DE VERDAD del cobro:** `api/paypal/_pricing.js` (`PRICING`). El cliente NUNCA envía el monto — solo `checkIn/checkOut/guests/breakfast`; el servidor recalcula.
- **Espejo de display en el frontend:** `const BOOKING` en `script.js` (se sobrescribe con los precios del servidor vía `/api/paypal/config`). Si cambias tarifas, actualiza AMBOS (servidor es autoridad; si difieren, gana el servidor).
- Tarjetas de lofts: texto "Desde $116/noche" es fijo en index.html (actualizar a mano si cambia).

---

## 8. Widget de reserva (script.js + index.html)

En la tarjeta "Reserva directa" (sección Reservar). Elementos: `direct-loft` (loft1|loft2), `direct-guests` (1-8), **`direct-name` / `direct-phone` (opcionales)**, campos de fecha **`direct-in-field`/`direct-out-field`** (botones que abren el **calendario propio**), ocultos `direct-in`/`direct-out`, interruptor **`direct-breakfast`** (desayuno), resumen (`direct-rate/nights/total/deposit`), `paypal-hosted-container` (Smart Buttons), `direct-pay-status`, nota SINPE (`#direct-... .sinpe-note`).

**Calendario propio:** las fechas bloqueadas (propias + externas) salen **tachadas y no seleccionables**; se respeta el mínimo de noches; selección en dos fases (entrada → salida); `position: fixed` calculada desde el campo (la tarjeta tiene `overflow:hidden` y lo recortaba). Cierra con clic fuera, Esc, scroll, resize. Meses/nombres según idioma.

**Disponibilidad:** `loadAvailability()` trae `/api/ical/availability` y `datesBlocked()` rechaza rangos solapados (muestra "Fechas no disponibles"). El servidor también valida en `create-order` (409 `dates_unavailable`).

**Pre-selección:** desde loft-1/2.html los botones "Reservar" llevan a `index.html?loft=loft1|loft2#reservar` y el widget preselecciona el loft.

**Pago:** Smart Buttons de PayPal. `createOrder` envía `{propertyId, checkIn, checkOut, guests, breakfast}` → servidor calcula monto y crea la orden. `onApprove` envía `{orderID, propertyId, checkIn, checkOut, guests, name, phone, breakfast}` → `capture-order` cobra, registra reserva y envía email.

---

## 9. Sistema iCal (anti overbooking) — COMPLETO Y EN PRODUCCIÓN

**Estado:** funcionando con persistencia (Upstash Redis, `storage: vercel-kv`). Booking importado (Loft 1: 10 eventos, Loft 2: 11). Anti doble reserva verificado.

**Endpoints** (`api/ical/`, CommonJS):
- `GET /api/ical/property/:id` → feed .ics público (UID/descripción usan el host de la petición — adaptativo).
- `POST|DELETE /api/ical/reservations` → crear/borrar reserva (body: `propertyId, checkIn, checkOut, guest, name, phone, breakfast, source`).
- `GET /api/ical/availability` → rangos bloqueados por propiedad (widget).
- `POST /api/ical/external` → importar URL .ics (descarga + parsea; body `propertyId, name, url`).
- `POST|DELETE /api/ical/external/:id` → refrescar/eliminar.
- `POST /api/ical/external/refresh-all` → cron diario 04:00 (`vercel.json`); exige `Authorization: Bearer $CRON_SECRET` solo si existe la env.
- `GET /api/ical/admin` → panel (PIN `X-Admin-Pin`; env `ADMIN_PIN`, por defecto `maite-admin-2026` — **cambiar**).

**Almacenamiento (`_lib.js`):** usa `@vercel/kv` con env `KV_REST_API_URL`/`KV_REST_API_TOKEN` **o** `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (acepta ambos nombres). Sin env → modo `dev-ephemeral` (NO persiste entre requests — solo para pruebas).

**Reservas:** `capture-order.js` registra la reserva al cobrar (con `name/phone/breakfast`) → aparece en el feed y en el panel.

**Panel admin:** `https://www.cabanaslamaite.com/admin.html` — PIN; muestra modo de almacenamiento (aviso naranja si es efímero), URLs de export por loft (botón Copiar), reservas (añadir/borrar, badge 🥐 desayuno, nombre/teléfono), calendarios externos (añadir/refrescar/quitar, estado y nº de eventos), botón "refrescar todos".

**Enlaces de export para Booking/Airbnb/Expedia (importar):**
```
https://www.cabanaslamaite.com/api/ical/property/loft1
https://www.cabanaslamaite.com/api/ical/property/loft2
```

---

## 10. Emails de reserva (FormSubmit — ACTIVADO)

- **FormSubmit ya está activado** (el dueño hizo clic en el email de activación). El formulario de contacto y el aviso de reservas envían a `cabanaslamaite@gmail.com` (env `NOTIFY_EMAIL` para cambiar).
- `capture-order.js` → `notifyReservation()`: email en **formato tabla** con TODOS los detalles: Loft, Entrada, Salida, Noches, Huéspedes, Nombre, Teléfono/WhatsApp, **Desayuno incluido (SÍ ☕ / No)**, Precio por noche, Monto cobrado (real de PayPal), Orden.
- **⚠️ FormSubmit exige cabeceras `Origin`/`Referer`** con el dominio del sitio — el fetch del servidor las incluye (`Origin: https://www.cabanaslamaite.com`). Sin ellas responde "open this page through a web server".

---

## 11. Despliegue y variables de entorno (Vercel)

- **Proyecto:** "Cabañas La Maite". **Dominio:** `https://www.cabanaslamaite.com` (comprado en Vercel; el subdominio `cabanaslamaite.vercel.app` sigue como respaldo; auto-deploy en push a `main`). No usar dominios con ñ (el dueño pidió reembolso del anterior por el punycode `xn--`).
- **Env vars en Vercel (Production):**
  - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (Sensitive) — **actualmente en SANDBOX** (`PAYPAL_ENV=sandbox`): nadie cobra de verdad todavía. Para cobrar: `PAYPAL_ENV=live` + credenciales LIVE (están en `docs/Paypal credentials.docx`, fuera de git — no leer ese archivo en conversaciones de IA) → redeploy → probar con un pago real pequeño.
  - `PAYPAL_CURRENCY=USD`
  - `KV_REST_API_URL`, `KV_REST_API_TOKEN` (Upstash) — persistencia iCal ✅ conectada.
  - `ADMIN_PIN` — NO definida → PIN por defecto `maite-admin-2026` (⚠️ cambiarla).
  - `CRON_SECRET` — opcional (firma del cron).
  - `NOTIFY_EMAIL` — opcional (destino de los emails; por defecto cabanaslamaite@gmail.com).
- **En GitHub Pages NO funciona** el pago ni el iCal (`/api` no existe) — solo en Vercel.

---

## 12. Verificaciones rápidas antes de commitear (¡siempre!)

```bash
# 1) Claves i18n usadas existen en el diccionario:
python3 -c "import re; js=open('script.js').read(); d=set(re.findall(r\"'([^']+)':\s*'\", js.split('const I18N = {')[1].split('};')[0])); u=set(); [u.add(m) for f in ['index.html','loft-1.html','loft-2.html'] for m in re.findall(r'data-i18n(?:-html)?=\"([^\"]+)\"', open(f).read())]; [u.add(p.split(':')[1]) for f in ['index.html','loft-1.html','loft-2.html'] for m in re.findall(r'data-i18n-attr=\"([^\"]+)\"', open(f).read()) for p in m.split(';')]; print('faltan:', sorted(k for k in u if k not in d) or 'ninguna')"

# 2) Equilibrio de sintaxis JS (strings/comentarios quitados):
python3 - <<'EOF'
import re
for f in ['script.js','admin.html']+__import__('glob').glob('api/**/*.js',recursive=True):
    src = re.sub(r'`(?:\\.|[^`\\])*`','""',open(f).read())
    src = re.sub(r"'(?:\\.|[^'\\])*'",'""',src)
    src = re.sub(r'"(?:\\.|[^"\\])*"','""',src)
    src = re.sub(r'/\*.*?\*/','',src,flags=re.S)
    src = re.sub(r'//[^\n]*','',src)
    bad=[a+b+':'+str(src.count(a))+':'+str(src.count(b)) for a,b in [('(',')'),('{','}'),('[',']')] if src.count(a)!=src.count(b)]
    print(f, 'OK' if not bad else bad)
EOF

# 3) HTML bien formado (html.parser) en las 3 páginas + admin.html.
# 4) Imágenes referenciadas existen (grep src= vs ls img/).
# 5) En producción: curl https://www.cabanaslamaite.com/api/ical/availability → 200 con blocked.
```

---

## 13. Lecciones / gotchas

- **api/ debe ser CommonJS** (`module.exports` + `require`). ESM (`import/export`) sin package.json hace que las funciones se cuelguen (timeout) en Vercel. Archivos con prefijo `_` no se exponen como ruta.
- El verificador de equilibrio (§12.2) da **falsos positivos** con regex que contienen `//` y con templates anidados en admin.html — si marca raro, revisar a mano esa línea.
- Secciones `.reveal` empiezan invisibles; si el JS falla la página se ve "vacía" → síntoma de error de JS.
- `multi_edit` es atómico: si una edición falla, ninguna se aplica (cuidar espaciado exacto).
- La tarjeta de reserva tiene `overflow:hidden` — el calendario propio usa `position:fixed` para no recortarse.
- No commitear `contenido/` ni `.DS_Store`. No borrar originales.
- El dueño escribe mezclado español/inglés → responder en el idioma de su último mensaje; commits en español.
- Los precios cambian seguido (130→116, 50%→100%, desayuno $11) — confirmar valores en `_pricing.js` y `BOOKING` antes de editar, y actualizar textos fijos ("Desde $X/noche").
- Fotos: **resolución baja en origen** (Loft 1: 576-1024px; Loft 2: capturas ~600px). No se puede "crear" resolución. El dueño dijo que tomará fotos nuevas → cuando las ponga en `contenido/imagenes/alta-resolucion/` (o donde indique), copiar a `img/` y re-exportar con `sips` (~1600-2000px, calidad ~82), reemplazando en tarjetas/galería/páginas.
- El botón "Reservar en Booking" de las páginas de loft se eliminó (llevan a la reserva directa). Quedan enlaces a Booking en footer y tarjeta "Booking.com" de la sección Reservar (el dueño no pidió quitarlos).

---

## 14. PENDIENTES / decisiones abiertas

1. **Pasar el pago a LIVE** (hoy sandbox): el dueño debe poner credenciales live + `PAYPAL_ENV=live` en Vercel y probar un pago real. Este es EL paso para cobrar de verdad.
2. **Cambiar el PIN admin** (`ADMIN_PIN` en Vercel) — el por defecto `maite-admin-2026` es público en este doc.
3. **Fotos en alta resolución** — el dueño tomará fotos nuevas; integrarlas cuando las entregue.
4. **Pegar los 2 enlaces iCal de export en Booking/Airbnb/Expedia** (importar) para que bloqueen las reservas de la web — pasos dados al dueño; y él debe pegar los exports de Airbnb/Expedia en el panel (Booking ya está importado).
5. **Cron**: Vercel Hobby permite 1 cron/día (suficiente); si no funcionara, el botón "refrescar todos" del panel hace lo mismo manualmente.
6. **6-8 huéspedes / 1 huésped**: el desayuno se calcula $11 × personas × noches sin tope (regla única); el dueño validó 2-5 personas.
7. **Regla de desayuno confirmada por el dueño:** $11/persona/noche (ej. 2 noches × 2 personas = +$44 → total $276). No usar la tabla vieja ($123/$139.40/…) que quedó descartada.

---

## 15. Datos del negocio (verificados, útiles para textos)

- Dirección: **VFH4+X8 Sámara, Guanacaste, Costa Rica** · Coordenadas: 9.8799882, -85.5441426
- Distancias: **A 900 m de Playa Buena Vista · A 1,6 km de Playa Sámara** (no "50 m").
- WhatsApp: **+506 8306 3336** (`wa.me/50683063336`) — también número SINPE Móvil.
- Facebook: `https://www.facebook.com/LamaiteEcologicas` · Instagram: `https://www.instagram.com/cabanaslamaite/`
- Valoración: **9.8 · "Excepcional · 155 comentarios"** (Booking — refrescar cuando el dueño lo pida).
- Ambos lofts: **2 camas dobles + 1 sofá cama** · Piscina **compartida** (texto: "Jardín y piscina") · check-in 15:00 · check-out 11:00.
- Servicios: internet satelital, estacionamiento privado, desayuno (no incluido, reservación previa), limpieza (5+ noches), cama para bebés.
