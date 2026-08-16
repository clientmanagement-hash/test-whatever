# PROYECTO — Cabañas La Maite (pagina-realestate)

Handoff para continuar el desarrollo. Última actualización: basada en el estado del repo en `main` (HEAD = `f52d013`).

---

## 1. Qué es este proyecto

Sitio web estático (sin build, sin framework, sin servidor) de un hospedaje con 2 lofts en **Playa Sámara, Nicoya, Guanacaste, Costa Rica**: "Cabañas La Maite" (en Google/Facebook figura como "Cabañas Lamaite").

**Propósito actual:** página de presentación + **reserva directa con pago en línea** (100% del total al reservar vía Smart Buttons de PayPal con backend en Vercel, tarjeta sin cuenta PayPal) + formulario de consulta que envía emails por FormSubmit + contacto WhatsApp/redes.

---

## 2. Repositorio y git

- **Remote:** `https://github.com/clientmanagement-hash/test-whatever.git` (único remote `origin`)
- **Branch:** `main` (única rama). No hay PRs ni ramas de feature — se trabaja directo sobre main.
- **Convención establecida con el dueño:** después de CADA cambio aceptado → `git add ... && git commit -m "..." && git push origin main`. Mensajes de commit en **español**, descriptivos.
- `.gitignore`: `contenido/` (materiales fuente del cliente), `.reasonix/` (metadatos de herramienta), `.DS_Store`, `*.log`. **NUNCA** commitear `contenido/`.
- Historial: ~50 commits desde "Initial commit - Simple website". Todo el trabajo de diseño/funcionalidad está commiteado y pusheado.

---

## 3. Estructura de archivos

```
/ (raíz del repo)
├── index.html      → portada (todo el sitio en una página: hero, stats, lofts, galería, ubicación, reservar, footer)
├── loft-1.html     → página de detalle Loft 1
├── loft-2.html     → página de detalle Loft 2
├── styles.css      → TODO el CSS (único stylesheet, ~1100 líneas)
├── script.js       → TODO el JS (menú, i18n ES/EN, reveal, lightbox, formulario, widget de reserva) ~700 líneas
├── img/
│   ├── logo.png    → logo oficial (400×400, fondo blanco)
│   ├── favicon.png → logo 64×64
│   ├── hero.jpg    → foto principal del hero (1086×1448, vertical — se recorta en pantallas anchas)
│   ├── loft1/      → 15 fotos del Loft 1 (3728xxxx.jpg / 3748xxxx.jpg)
│   └── loft2/      → 17 fotos del Loft 2 (loft2-01.jpg … loft2-17.jpg, de capturas de pantalla ~600px)
├── contenido/      → ⚠️ EXCLUIDO de git (fotos originales, .docx, .rtf del cliente). No tocar.
├── api/            → Funciones serverless de Vercel (backend para el pago PayPal)
│   └── paypal/
│       ├── config.js         → GET /api/paypal/config (client id público + moneda)
│       ├── create-order.js   → POST /api/paypal/create-order (Orders API v2)
│       └── capture-order.js  → POST /api/paypal/capture-order (cobra la orden)
├── docs/handoff/   → este documento
└── .gitignore
```

---

## 4. Stack y arquitectura

- **HTML5 + CSS3 + Vanilla JS** (ES6). **Sin npm, sin build, sin dependencias locales.** Solo recurso externo: Google Fonts (Roboto 300/400/500/700/900).
- Estático → **hosteable en GitHub Pages** (cualquier hosting estático). Para probar local: `python3 -m http.server 8000` (importante: servir por HTTP, no abrir `file://` — FormSubmit lo exige).
- Todo el comportamiento está en `script.js`, que corre al final del `<body>` (DOM ya cargado; no usa DOMContentLoaded).

---

## 5. Sistema de diseño (styles.css)

**Paleta** (definida en `:root` — sacada del logo del cliente, sin rosa):
- `--verde-950:#0b1f12` `--verde-900:#112a19` `--verde-800:#163520` `--verde-700:#1d452a` `--verde-600:#265a38` (verde bosque principal) `--verde-500:#41754f` `--verde-300:#a3bfa9`
- `--tan-600:#8a6536` `--tan-500:#a97d45` (acento arena — reemplazó al rosa)
- `--arena:#f6f2e9` `--arena-2:#ece5d6` (fondos claros)
- `--ink:#0d0d0d` `--paper:#ffffff` `--gris-600:#5b635e` `--gris-400:#9aa39d`
- Fuente: **Roboto** (Google Fonts). Botones primarios: fondo arena + texto verde oscuro (contraste ~5:1).

**Secciones index.html:** header fijo (transparente → verde oscuro al scrollear) · hero full-screen con foto + overlay · franja de datos (900 m Buena Vista, 1,6 km Sámara, Piscina, 9.8/10) · lofts (tarjetas editoriales alternadas) · galería (mosaico + lightbox) · ubicación (mapa Google embebido + badge con dirección VFH4+X8) · reservar (tarjetas + formulario) · footer oscuro.

**Responsive:** breakpoints 1024 / 860 / 560 px; menú móvil tipo drawer; `prefers-reduced-motion` soportado.

---

## 6. i18n ES/EN (importante)

- **Español es el contenido por defecto del HTML.** El inglés se aplica por JS.
- Mecánica en `script.js`:
  - `data-i18n="clave"` → texto plano; `data-i18n-html="clave"` → innerHTML (br/span/strong); `data-i18n-attr="attr:clave;attr2:clave2"` → atributos (placeholder, alt, title, aria-label).
  - Diccionario **EN** en `I18N.en` (~180 claves). Se captura el texto original ES en `dataset` la primera vez (`dataset.esText/esHtml/esAttrs`) para poder volver.
  - Detección de idioma: `localStorage.getItem('maite-lang')` → si no, `navigator.language`. Botones `.lang-btn[data-lang=es|en]` en el menú. Persistencia en `localStorage` clave `maite-lang`.
  - Al cambiar idioma: `applyLang()` → ejecuta las funciones registradas con `registerDynamic()` (para re-traducir textos dinámicos del widget).
- **REGLAS:** toda clave usada en HTML debe existir en el diccionario. Verificar con el script del §10. Claves sin usar actualmente (inofensivas): `hero.book` (se quitó el botón del hero), `paypal.item` (se migró a NCP).

---

## 7. Widget de reserva directa (script.js)

Ubicado en la tarjeta "Reserva directa" de la sección Reservar (index.html). IDs: `direct-loft, direct-guests, direct-in, direct-out, direct-rate, direct-nights, direct-total, direct-deposit, direct-deposit-label, direct-fee-note, paypal-hosted-container, direct-pay-status`.

**Config central (`const BOOKING`)** — valores ACTUALES:
```js
const BOOKING = {
    currency: 'USD',
    baseGuests: 2,          // tarifa incluye 2 personas
    minNights: 2,           // estadía mínima
    extraGuestFee: 10,      // $ por persona adicional/noche
    seasons: [
        { from: '01-01', to: '12-31', rate: 116 }   // TARIFA FIJA $116/noche
    ],
    depositPct: 100,        // pago del 100% al reservar
    paypalNcpUrl: 'https://www.paypal.com/ncp/payment/EFL42U7N5PB8J'
};
```
- **Lógica:** `rateForDate(date)` soporta temporadas (rangos `MM-DD`, incluye cruce de año nuevo) — aunque hoy hay una sola temporada fija. El widget suma cada noche + cargo por persona extra, calcula total y pago (100%).
- **Mínimo de noches:** `minNights`. El input de salida se bloquea a `entrada + minNights` días (`addDays` con UTC). Si se teclea menos → muestra "Mínimo 2 noches" y el botón queda deshabilitado.
- **Pago (100% al reservar):** botón **Smart Buttons de PayPal** renderizado dinámicamente. El frontend pide el client id (y los precios) a `GET /api/paypal/config`, carga el SDK con `components=buttons`, y en `createOrder` envía **solo `checkIn`/`checkOut`/`guests`** a `POST /api/paypal/create-order` — el monto lo recalcula el servidor (`api/paypal/pricing.js`, fuente de verdad del cobro y de lo mostrado; `Object.assign` sobrescribe `BOOKING` en el cliente). `onApprove` → `POST /api/paypal/capture-order` cobra (idempotente con `PayPal-Request-Id: capture-<orderID>`). Mensajes bilingües en `#direct-pay-status` (también mapea códigos de error del servidor: `min_nights`, `too_long`, `too_many_guests`...).

---

## 8. Formulario de contacto → email

- `#contact-form` en index.html (novalidate; validación propia en JS).
- Envío por **FormSubmit AJAX**: `POST https://formsubmit.co/ajax/cabanaslamaite@gmail.com` con JSON `{...data, _subject, _template:'table', _captcha:'false'}`.
- Mensajes de éxito/error bilingües (`reservar.form.ok/errNombre/errEmail/errSend`).
- **⚠️ ACTIVACIÓN:** FormSubmit manda un email de activación a `cabanaslamaite@gmail.com` que el dueño debe confirmar UNA vez (puede que aún no lo haya hecho — si el formulario no llega, recordárselo: revisar spam).
- Requiere servir por HTTP (Origin válido); funciona en localhost y GitHub Pages.

---

## 9. Enlaces y datos externos (verificados en el código)

| Elemento | Valor |
|---|---|
| WhatsApp | `https://wa.me/50683063336` (+506 8306 3336) — tarjeta en Reservar + footer |
| Facebook | `https://www.facebook.com/LamaiteEcologicas` — tarjeta "Redes sociales" + footer |
| Instagram | `https://www.instagram.com/cabanaslamaite/` — tarjeta + footer |
| Booking.com (tarjeta, footer, CTAs de lofts) | `https://www.booking.com/hotel/cr/cabanas-lamaite-samara.es.html` — **el botón del hero fue ELIMINADO por pedido del dueño** |
| Pago PayPal | **Smart Buttons + Vercel Functions** (`/api/paypal/*`) — credenciales en env vars de Vercel (nunca en el repo) |
| Mapa | `https://www.google.com/maps?q=9.8799882,-85.5441426&z=16&output=embed` (Cabañas Lamaite) |
| Dirección mostrada | VFH4+X8 Sámara, Guanacaste, Costa Rica |
| Valoración mostrada | 9.8 · "Excepcional · 155 comentarios" (según Booking, a confirmar cuando cambie) |

---

## 10. Verificaciones rápidas antes de commitear (¡hacerlas siempre!)

```bash
# 1) Toda clave data-i18n usada existe en el diccionario:
python3 -c "import re; js=open('script.js').read(); d=set(re.findall(r\"'([^']+)':\s*'\", js.split('const I18N = {')[1].split('};')[0])); u=set(); [u.add(m) for f in ['index.html','loft-1.html','loft-2.html'] for m in re.findall(r'data-i18n(?:-html)?=\"([^\"]+)\"', open(f).read())]; [u.add(p.split(':')[1]) for f in ['index.html','loft-1.html','loft-2.html'] for m in re.findall(r'data-i18n-attr=\"([^\"]+)\"', open(f).read()) for p in m.split(';')]; print('faltan:', sorted(k for k in u if k not in d) or 'ninguna')"

# 2) Equilibrio de sintaxis JS (strings/comentarios quitados):
python3 - <<'EOF'
import re
src = re.sub(r'`(?:\\.|[^`\\])*`','""',open('script.js').read())
src = re.sub(r"'(?:\\.|[^'\\])*'",'""',src)
src = re.sub(r'"(?:\\.|[^"\\])*"','""',src)
src = re.sub(r'/\*.*?\*/','',src,flags=re.S)
src = re.sub(r'//[^\n]*','',src)
for a,b in [('(',')'),('{','}'),('[',']')]:
    print(a+b, src.count(a), src.count(b), 'OK' if src.count(a)==src.count(b) else 'MISMATCH')
EOF

# 3) HTML bien formado (python html.parser, tags balanceados) en las 3 páginas.
# 4) Servir y curl 200: python3 -m http.server 8000 → curl cada página y cada asset referenciado.
# 5) Imágenes referenciadas existen (grep img/ en HTML vs ls img/).
```

---

## 11. PENDIENTES / decisiones abiertas (contexto para el siguiente agente)
0. **⚠️ OBLIGATORIO: persistencia del calendario iCal con Upstash Redis (gratis).** El sistema iCal (sección 15) está implementado y probado, pero en producción usa el modo `dev-ephemeral` (memoria + /tmp por instancia) que **NO persiste entre requests** en Vercel. **Nota:** Vercel KV ya no existe para cuentas nuevas (docs de Vercel); el reemplazo gratuito es **Upstash Redis directamente** — `@vercel/kv` funciona con cualquier base Upstash usando las mismas env vars. Pasos: console.upstash.com → Redis → + Create Database (plan Free, 256 MB / 500K comandos al mes, sin tarjeta) → en la base, sección Connect → pestaña REST → copiar el HTTPS (REST URL) y el Token → en Vercel (proyecto Cabañas la Maite) → Settings → Environment Variables: `KV_REST_API_URL` = HTTPS, `KV_REST_API_TOKEN` = Token (marcar Sensitive) → Redeploy. El panel admin mostrará "Vercel KV (persistente)".

1. **Credenciales PayPal en Vercel (paso del dueño, OBLIGATORIO para el pago):** en Vercel → proyecto → Settings → Environment Variables: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (marcar *Sensitive*), `PAYPAL_ENV` (`sandbox`|`live`), `PAYPAL_CURRENCY` (`USD`). Preview/Testing = sandbox; Production = live. El dueño ya tiene las credenciales (sandbox/live) en `docs/Paypal credentials.docx` — **no leer ese archivo** (secreto); va directo a Vercel.
2. **Verificar flujo sandbox** (pago falso) antes de pasar a live; luego canjear por live en Production y hacer un pago real pequeño de prueba.
3. **Deploy en Vercel:** el repo debe estar importado en Vercel (el dueño tiene proyecto "Cabañas La Maite") — `api/` se detecta solo. En GitHub Pages el botón de pago NO funciona (muestra aviso).
4. **Overbooking** — discutido, NO implementado. Opciones: iCal unidireccional (requiere URLs iCal de Booking/Airbnb/Expedia), o channel manager (Beds24/Lodgify/Tokeet/Hostaway). El dueño no dio los enlaces iCal.
5. **Wompi (Davivienda CR)** — alternativa solo si PayPal no satisface (requiere cuenta del dueño + llaves).

---

## 12. Lecciones / gotchas (¡evitar repetir!)

- **Nunca romper bloques de comentario al reemplazar código en script.js.** Ocurrió un bug real: líneas de comentario quedaron fuera del `/* */` → error de sintaxis → el script no cargaba → las secciones `.reveal` quedaban con `opacity:0` → **página aparentemente vacía**. SIEMPRE correr la verificación de equilibrio (§10.2) y revisar visualmente las zonas editadas.
- Las secciones con clase `.reveal` empiezan invisibles (opacity 0) y solo aparecen con JS (`IntersectionObserver` → `.in-view`). Si JS falla, el sitio se ve "vacío" — síntoma de error de JS.
- Al editar con `multi_edit` en un solo archivo: si una edición falla, TODAS fallan (atómico). Cuidar espaciado exacto; verificar con el mensaje de error.
- No commitear `contenido/` ni `.DS_Store` (gitignore). No borrar originales de `contenido/`.
- El dueño escribe mezclado español/inglés → responder en el idioma de su último mensaje. Mensajes de commit en español.
- Antes de cada cambio de contenido: hacer `git status` para ver el estado real; no asumir.
- **Idioma de la página:** ES es el HTML; EN vía diccionario. Un texto nuevo en el HTML sin `data-i18n` quedará solo en español (y viceversa: clave nueva sin usar es inofensiva).
- Acentos: el dueño a veces escribe sin tilde ("jardin") — usar español correcto con tildes en el sitio.
- Precios y montos: el dueño cambia seguido (130→116, 50%→100%) — siempre confirmar valores actuales en `BOOKING` antes de editar y actualizar TODOS los lugares (config, tarjetas "Desde $X", textos).

---

## 15. Sistema iCal (sincronización de calendarios, sin canal manager)
**Estado:** implementado y probado (generación/parseo ICS ✓, importación externa ✓, anti doble reserva ✓, panel admin ✓, cron ✓). Falta solo Vercel KV para persistencia real (ver §11.0).

**Arquitectura** (`api/ical/`, CommonJS):
- `_lib.js` — almacenamiento (Vercel KV si `KV_REST_API_URL`/`KV_REST_API_TOKEN`, si no `dev-ephemeral`), propiedades (`loft1`, `loft2`), disponibilidad/solapamiento, registro de reservas, PIN admin, readBody.
- `_ics.js` — `buildCalendar` (RFC 5545, VEVENT all-day por reserva) y `parseIcs` (parser mínimo: VALUE=DATE/DATE-TIME/TZID, líneas continuadas, sin EXDATE).
- Rutas:
  - `GET /api/ical/property/:id` → feed .ics público (lo importan Airbnb/Booking/Expedia; bloquea las noches reservadas en la web).
  - `POST|DELETE /api/ical/reservations` → crear/borrar reserva (manual/admin).
  - `GET /api/ical/availability` → rangos bloqueados por propiedad (lo usa el widget).
  - `POST /api/ical/external` → importa una URL .ics externa (descarga + parsea al momento).
  - `POST|DELETE /api/ical/external/:id` → refrescar / eliminar.
  - `POST /api/ical/external/refresh-all` → refresca todos (cron diario 04:00 en `vercel.json`; exige `Authorization: Bearer $CRON_SECRET` solo si la env existe).
  - `GET /api/ical/admin` → datos del panel (PIN: env `ADMIN_PIN`, por defecto `maite-admin-2026`; header `X-Admin-Pin`).

**Integración con el pago/widget:**
- `api/paypal/create-order.js` valida la propiedad y devuelve `409 dates_unavailable` si las fechas están bloqueadas (web o externas) — anti doble reserva en el servidor.
- `api/paypal/capture-order.js` registra la reserva (`recordReservation`, source `web`) al cobrar → aparece en el feed .ics.
- `script.js`: `loadAvailability()` descarga `/api/ical/availability`; el widget muestra "Fechas no disponibles" y no permite pagar fechas bloqueadas; `lastBooking` incluye `propertyId`; el capture envía `propertyId/checkIn/checkOut/guest`.

**Panel admin:** `https://cabanaslamaite.vercel.app/admin.html` (PIN). Muestra modo de almacenamiento, URLs de export por propiedad, reservas (añadir/borrar), calendarios externos (añadir/refrescar/quitar) y botón "refrescar todos".

**Uso (dueño):** pegar `https://cabanaslamaite.vercel.app/api/ical/property/loft1` (y `.../loft2`) en Importar calendario de Booking/Airbnb/Expedia. Las reservas hechas en la web se bloquean solas ahí. Y pegar los exports de Airbnb/Booking/Expedia en el panel admin → bloquean las fechas en la web.

**Pruebas hechas (2026-08):** feed .ics válido (`text/calendar`), import de `samples/external.ics` (2 eventos parseados, `lastCount:2`), admin 401 sin PIN / 200 con PIN, refresh-all OK, 404 para propiedad inexistente, espejo del algoritmo (generación + solapamiento) con todas las aserciones OK. El comportamiento entre requests quedará estable al configurar KV.

**Gotchas:** rutas relativas en `api/ical/external/*` usan `../_lib` (archivos en subcarpeta). `samples/external.ics` es un feed de prueba (se puede borrar). Cron diario requiere plan con cron de Vercel (Hobby: 1/día — suficiente; si no, usar el botón manual).

## 13. Seguridad y despliegue (pago)
- **Nunca** commitear credenciales: `.gitignore` excluye `docs/*.docx` y `.env*`. El Client Secret solo existe en env vars de Vercel. `docs/Paypal credentials.docx` **no está en git** (verificado) — no abrirlo en conversaciones de IA.
- El monto del pago se recalcula **en el servidor** (api/paypal/_pricing.js); el cliente jamás envía el monto. Errores de PayPal se devuelven como códigos fijos, sin cuerpos internos al navegador.
- **Despliegue:** repo importado en Vercel → **https://cabanaslamaite.vercel.app** (auto-deploy en push a main). `api/` se detecta solo.
- **⚠️ Lección Vercel:** las funciones de `api/` deben ser **CommonJS** (`module.exports` + `require`); el ESM (`import/export`) sin `package.json` hacía que las funciones se colgaran (timeout) al arrancar. `_pricing.js` (prefijo `_`) no se expone como ruta.
- **Estado (verificado 2026-08-13):** sandbox funcionando — `GET /api/paypal/config` 200 (client id + precios), `POST /api/paypal/create-order` crea órdenes reales en sandbox ($696 para 6 noches/2 pers; $391.50 Semana Santa 3 noches), validaciones OK. En GitHub Pages el botón de pago no funciona (muestra el aviso bilingüe correspondiente).

## 13b. Cómo probar y entregar

1. `cd /Users/nikoabeachclub/Documents/dev/pagina-realestate && python3 -m http.server 8000` → http://localhost:8000
2. Probar: cambio de idioma ES/EN (botón en menú), widget (loft/fechas/huéspedes → total → botón Smart de PayPal), lightbox, menú móvil, formulario (enviar → revisar consola/red), fechas mínimas.
3. **Probar el pago en sandbox:** en https://cabanaslamaite.vercel.app, elegir fechas → clic en el botón PayPal → entrar con la cuenta **comprador de sandbox** (PayPal Developer → Sandbox → Accounts → email + pass) → verificar que aparezca "Pagar con tarjeta de débito o crédito" y que el monto esté prefijado → completar el pago falso → debe mostrar "¡Pago recibido!...".
4. Cuando todo funcione: en Vercel cambiar `PAYPAL_ENV=live` + credenciales LIVE (Production) y redesplegar; luego un pago real pequeño de prueba.
5. Verificaciones §10 → commit + push a `origin/main` (convención del dueño).

---

## 14. Fuente de los datos (carpeta contenido/, excluida de git)

- `contenido/escrito/contenido-escrito.rtf` → brief de diseño original (colores negro/blanco/verde/rosado → **el rosado se quitó por pedido**, estilo sobrio/playero/alegre, Roboto).
- `contenido/escrito/texto loft 1/Loft 1.docx` y `texto loft 2/LOFT 2.docx` → descripciones originales (la mayor parte se usa en las páginas de detalle, con ajustes pedidos por el dueño: camas 2+1 sofá, etc.).
- `contenido/imagenes/` → fotos originales (Loft 1/, loft 2/, main page photo/, carpeta sin título/). Las fotos web están en `img/` (copias convertidas/optimizadas con `sips`).
- `contenido/logo/Logo.png` → logo oficial (fuente de `img/logo.png` y `img/favicon.png`).
