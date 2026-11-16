# Steam Region Block Bypass

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · **Español** · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Instalar userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

Un userscript para la tienda de Steam que restaura las **páginas de producto bloqueadas** y añade una **búsqueda de invitado** opcional: sugerencias de búsqueda anónimas en la cabecera y una página `/search` de invitado que se activa aparte, sin cookies de la cuenta.

Vuelve a solicitar las URL de las aplicaciones **sin cookies de la cuenta** (vista de invitado), trasplanta el diseño real de la tienda al documento activo y restaura los controles de lista de deseos, seguir e ignorar para usuarios con sesión iniciada tras el trasplante. Las **sugerencias de búsqueda para invitados** están activadas por defecto; el modo de invitado de la **página `/search`** completa está desactivado por defecto (se activa en Region Bypass → Búsqueda). Para bloqueos basados en IP, se puede configurar una **puerta de enlace proxy** opcional desde el panel de ajustes con estilo Steam (menú de cuenta → Ajustes de Region Bypass).

Compatible con [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat y otros gestores que admitan el bloque de metadatos `// ==UserScript==`.

## Capturas de pantalla

El userscript real ejecutándose en una página de la tienda de Steam en vivo.

![Panel de ajustes de Region Bypass con las páginas General, Búsqueda, Caché, Proxy y Acerca de](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![General — idioma de la interfaz, modo de omisión, país de la tienda, notificaciones toast](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**General** — idioma de la interfaz, omisión automática/manual, banner, país de la tienda, notificaciones toast | ![Búsqueda — sugerencias de invitado, página /search opcional, registro de juegos bloqueados, sondeo](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**Búsqueda** — sugerencias de invitado, página `/search` opcional, registro de juegos bloqueados, sondeo |
| ![Caché — medidor de uso, TTL, límite de entradas, caché por origen, lista de bloqueados](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**Caché** — medidor de uso, TTL, límite de entradas, caché por origen, lista de bloqueados | ![Puerta de enlace proxy — modo de URL, host/puerto, autenticación HTTP Basic opcional](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**Puerta de enlace proxy** — modo de URL, host/puerto, autenticación HTTP Basic opcional |

Sugerencias de búsqueda para invitados en la cabecera de la tienda: **Call of Duty: Modern Warfare 4** aparece marcado como **bloqueado por región**, mientras el resto de resultados sigue disponible:

![Sugerencias de búsqueda para invitados de Call of Duty: Modern Warfare 4 con la etiqueta Region blocked](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## Instalación rápida

1. Instala un gestor de scripts de usuario (se recomiendan Tampermonkey o Violentmonkey).
2. Haz clic en el enlace de instalación de abajo: tu gestor debería abrir un diálogo de instalación.

**URL de instalación:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![Instalar](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### Instalar desde URL (panel de control)

| Gestor | Ruta |
|---------|------|
| Tampermonkey | Panel de control → **Utilidades** → **Instalar desde URL** |
| Violentmonkey | Panel de control → **+** → **Instalar desde URL** |
| Greasemonkey | Menú del complemento → **Nuevo script de usuario** → pega la URL directa |

Pega la [URL de instalación](#instalación-rápida) de arriba.

### Instalación manual

1. Abre [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js) en este repositorio.
2. Copia todo el contenido del archivo.
3. En tu gestor de scripts de usuario, crea un script nuevo y pega el código.
4. Guarda y activa el script.

## Actualizaciones

El script incluye metadatos `@updateURL` y `@downloadURL` que apuntan al archivo directo de GitHub. Los gestores compatibles buscan actualizaciones automáticamente (Tampermonkey: panel de control → intervalo de comprobación; Violentmonkey: similar).

**Para publicar una versión nueva:**

1. Actualiza `version` en `package.json` (SemVer).
2. Ejecuta `npm run build` (regenera los `.user.js` / `.meta.js` de la raíz).
3. Añade una entrada a [`CHANGELOG.md`](CHANGELOG.md).
4. Sube a `main` (o crea un GitHub Release).

Los gestores comparan el `@version` instalado con los metadatos remotos para decidir si ofrecer una actualización. Consulta [DEVELOPMENT.md](DEVELOPMENT.md) para el flujo completo.

## Funciones

- **Inyección con trasplante prioritario** — intercambia el diseño del juego de invitado en el `#responsive_page_template_content` activo, conservando la cabecera de la sesión iniciada, las variables globales de sesión, los estilos y scripts cargados; `document.write` sigue siendo el respaldo de reescritura completa
- **Restauración de la cola con sesión iniciada** — reconstruye los controles de lista de deseos, seguir e ignorar tras un trasplante y envía las acciones a través de la sesión activa
- **Omisión automática o botón** — se ejecuta al instante en páginas bloqueadas o muestra primero una propuesta manual
- **Petición anónima** — usa `GM_xmlhttpRequest` con `anonymous: true` (sin cookies de inicio de sesión)
- **Idioma de la tienda** — la petición de invitado usa `Steam_Language`, `?l=` y `Accept-Language` para que la página coincida con el idioma de tu interfaz de Steam
- **Cookies de verificación de edad** — envía cookies `birthtime` / de contenido para adultos para que las páginas de invitado se detengan menos en la comprobación de edad
- **País de la tienda opcional (`cc`)** — sobrescribe el país de la tienda de Steam para la petición de invitado
- **Panel de puerta de enlace proxy** — activar/desactivar, host, puerto, usuario, contraseña, modo de URL
- **Interruptor maestro de región + control del banner** — desactiva la omisión de páginas sin afectar a la búsqueda de invitado; oculta el banner de región cuando quieras
- **Interfaz estilo Steam** — entrada de ajustes en el desplegable de la cuenta (`#account_dropdown`, estilo SteamDB); botón de reserva sin sesión en `#global_actions`; panel de lista de inicio con páginas General / Búsqueda / Caché / Proxy / Acerca de, edición de borrador, Restablecer, Cancelar, Guardar y Guardar y recargar
- **Interfaz localizada** — panel y mensajes en en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl; selector de idioma de la interfaz con detección automática del navegador
- **Controles manuales** — recarga el contenido inyectado, abre los ajustes desde el banner o el menú del gestor de scripts
- **Sugerencias de búsqueda para invitados** — activadas por defecto: desplegable de sugerencias anónimas mediante la misma pila de peticiones de invitado (proxy / `cc` / caché); se desactivan en **Region Bypass → Búsqueda**
- **Página `/search` de invitado** — opcional: nueva petición e inyección anónimas para `store.steampowered.com/search` (misma pila); se activa por separado en **Region Bypass → Búsqueda**
- **Pestaña Caché** — medidor de uso, TTL y máximo de entradas, elección de qué páginas de invitado guardar, exploración/eliminación del HTML en caché, exploración/limpieza de la lista de juegos bloqueados
- **Registro de juegos bloqueados** — recuerda los ID de aplicaciones bloqueadas por región (interruptores de la pestaña Búsqueda) y los resalta en la búsqueda de invitado; lista y limpieza en **Caché**

## Páginas compatibles

| Sitio | Patrón de URL | Notas |
|------|-------------|-------|
| Tienda de Steam (aplicaciones) | `https://store.steampowered.com/app/{id}/…` | Omisión del error de región (uso principal) |
| Tienda de Steam (búsqueda) | Búsqueda de cabecera + `https://store.steampowered.com/search/?term=…` | **Sugerencias de búsqueda para invitados** y **página /search de invitado** opcional en Region Bypass → Búsqueda |

Las páginas de aplicaciones funcionan cuando Steam muestra **«This item is currently unavailable in your region»** (este artículo no está disponible en tu región) — por ejemplo, **Call of Duty: Modern Warfare 4** en regiones restringidas. Las **sugerencias de búsqueda para invitados** están activadas por defecto para la barra de búsqueda de la cabecera. La nueva petición de invitado para la página `/search` completa está **desactivada por defecto** (misma pila de peticiones anónimas de invitado: proxy / `cc` / caché); actívala en **Region Bypass → Búsqueda**. Los ID de aplicaciones bloqueadas guardados se pueden resaltar en los resultados de búsqueda.

## Cómo funciona

```
Se carga una página de aplicación de Steam
       │
       ▼
¿#error_box / Oops coincide con «unavailable in your region»?
       │
       ├── no ──► inactivo (el botón de ajustes sigue disponible)
       │
       └── sí ──► Construir URL de destino (?l= idioma, ?cc= opcional)
                │
                ▼
       ¿Acierto de caché (dentro del TTL)? ── sí ──► usar HTML de invitado guardado
                │ no
                ▼
       Opcional: reescribir la URL a través de la puerta de enlace proxy
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       Analizar HTML → extraer .game_page_background / #tabletGrid
                │
                ├── ¿sigue bloqueado? ──► mostrar error + sugerir proxy
                │
                ├── trasplantar al armazón activo
                │   ├── sincronizar title, clases, estilos, scripts
                │   ├── restaurar controles de cola de la sesión iniciada
                │   └── fallo → respaldo document.write(HTML de invitado)
                │
                └── banner + reinicio de funciones (HTML correcto guardado en caché)
```

### Búsqueda de invitado

En el panel de Region Bypass (**pestaña Búsqueda**):

1. **Sugerencias de búsqueda para invitados** (activadas por defecto) — al escribir en la búsqueda de la cabecera de la tienda se obtienen sugerencias anónimas de `/search/results` (hasta 25 juegos), enriquecidas con datos de `/api/storesearch/` cuando están disponibles (respaldo: `/search/suggest`).
2. **Página `/search` de invitado** (desactivada por defecto) — al enviar una búsqueda o abrir `/search/?term=…` se pueden volver a solicitar los resultados como invitado e inyectarlos en la página cuando este ajuste está activado.
3. El **registro de juegos bloqueados** opcional resalta las aplicaciones que abriste antes en una página con error de región.
4. **Detección automática de bloqueos en la búsqueda** (activada por defecto) sondea cada resultado con tus cookies de sesión de Steam y añade a la lista las aplicaciones con bloqueo regional (barra de progreso + indicadores de carga por elemento; alcance y concurrencia configurables).

Usa los mismos ajustes de proxy, `cc`, idioma y caché que la omisión de páginas de aplicaciones.

### Petición anónima

Steam a menudo restringe la página de la tienda por el **país de la cuenta**. Una petición privilegiada sin cookies de sesión puede devolver el diseño público de la tienda para esa IP. El script nunca usa tu sesión iniciada para la petición de omisión.

### Idioma de la tienda

La petición de invitado replica el idioma de tu tienda de Steam cuando es posible:

1. Cookie `Steam_Language` de la página actual
2. Si no, un idioma derivado de la configuración regional de la interfaz/navegador
3. Se aplica como `?l=…`, `Cookie: Steam_Language=…` y `Accept-Language`

### Puerta de enlace proxy

Los gestores de scripts de usuario **no pueden** adjuntar un proxy SOCKS/HTTP del sistema a `GM_xmlhttpRequest`. Cuando el bloqueo es por IP, apunta el panel a una **puerta de enlace HTTP** local o remota que obtenga la URL de Steam desde otra red.

| Modo | Petición de ejemplo |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

Este repositorio incluye una puerta de enlace Node opcional: [`proxy-gateway.mjs`](proxy-gateway.mjs).

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

Después, en el panel del userscript: Host `127.0.0.1`, Port `8765`, modo `host:port/https://…`, proxy **ACTIVADO**.

## Estructura del repositorio

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # idioma + bootDocument + manejador region:rewrote
│   ├── core/                   # ajustes, caché, apps bloqueadas, bus, constantes, depuración
│   ├── region/                 # detección, petición, trasplante, cola, correcciones, omisión
│   ├── features/search/        # API/parseo/renderizado de sugerencias, página /search, sondeo
│   ├── features/settings/      # panel, controles, confirmación, páginas
│   ├── i18n/                   # metadatos de idioma + diez archivos de idioma
│   ├── ui/                     # notificaciones toast
│   ├── utils/                  # dom, html, pool, navegación, bloqueo de desplazamiento
│   └── styles/                 # tokens, base, panel, region, search, cache, toast
├── tests/                      # Pruebas unitarias integradas de Node
├── scripts/                    # utilidades de compilación / verificación de artefactos
├── steam-region-block-bypass.user.js   # Userscript instalable (artefacto comprometido)
├── steam-region-block-bypass.meta.js   # Metadatos complementarios para comprobar actualizaciones
├── proxy-gateway.mjs           # Puerta de enlace HTTP local opcional (Node)
├── package.json                # Dependencias, versión, scripts
├── README.md                   # Documentación e instrucciones de instalación
├── CHANGELOG.md                # Historial de versiones
├── DESIGN.md                   # Lenguaje visual y reglas de tokens CSS
├── LICENSE                     # Licencia MIT
└── .gitattributes / .gitignore
```

| Archivo | Propósito |
|------|---------|
| `steam-region-block-bypass.user.js` | Script completo servido en `@downloadURL` / `@updateURL` |
| `steam-region-block-bypass.meta.js` | Espejo ligero de metadatos; los gestores pueden solicitarlo en lugar del script completo al buscar actualizaciones |
| `proxy-gateway.mjs` | Retransmisor local opcional para bloqueos regionales por IP |

## Metadatos del script

Campos clave de `// ==UserScript==` que usan los gestores:

| Campo | Valor |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | Versión semántica (debe incrementarse en cada publicación) |
| `@updateURL` / `@downloadURL` | URL directa de GitHub de `steam-region-block-bypass.user.js` |
| `@homepageURL` | Este repositorio |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*` (puertas de enlace proxy personalizadas) |

Se proporcionan etiquetas `@name` y `@description` localizadas para en, ru, zh-CN, es, pt-BR, de, fr, ja, ko y pl.

## Permisos necesarios

| Concesión | Propósito |
|-------|---------|
| `GM_xmlhttpRequest` | Obtener la página de la tienda sin cookies de página / límites CORS |
| `GM_getValue` / `GM_setValue` | Guardar los ajustes de proxy e interfaz |
| `GM_addStyle` | Inyectar el CSS del panel y el banner con estilo Steam |
| `GM_registerMenuCommand` | Abrir los ajustes desde el menú del gestor de scripts |

Se requiere `@connect *` para que el script pueda llamar al host de puerta de enlace proxy configurado por el usuario.

## Desarrollo

Creado con **Vite** + **vite-plugin-monkey**. Edita los módulos ESM en [`src/`](src/) y luego ejecuta `npm run build` para actualizar los artefactos de instalación comprometidos. Detalles: [DEVELOPMENT.md](DEVELOPMENT.md), [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm install
npm run dev      # userscript "dev:" en vivo mediante Vite
npm run build    # producción → dist/ + .user.js / .meta.js de la raíz
npm test         # pruebas unitarias integradas de Node
npm run ci       # pruebas + compilación + verificación de artefactos
npm run gateway  # puerta de enlace proxy local opcional
```

### Flujo de trabajo local (Violentmonkey)

1. Clona este repositorio y ejecuta `npm run build`.
2. En Violentmonkey, instala desde el `steam-region-block-bypass.user.js` local de la raíz.
3. Activa **Seguir archivo local** antes de cerrar el diálogo de instalación.
4. Edita `src/`, recompila, recarga la página de Steam, o usa `npm run dev` para HMR.

### Flujo de trabajo local (Tampermonkey)

Tampermonkey no sigue archivos locales de forma nativa. Opciones:

- Usa `npm run dev` e instala el userscript `dev:` servido, o
- Reinstala desde el archivo compilado / URL después de cada `npm run build`, o
- Apunta temporalmente `@updateURL` / `@downloadURL` a `http://localhost:...` durante el desarrollo (no confirmes URL locales).

### Configuración

Los ajustes se guardan en el almacenamiento del userscript (`srbb_settings_v2`; el objeto plano `srbb_settings` v1 se migra una vez y se deja intacto para poder revertir) a través del panel de ajustes:

| Ajuste | Predeterminado | Descripción |
|---------|---------|-------------|
| Idioma de la interfaz | Automático | Idioma del panel / mensajes; `Automático` sigue al navegador. La cookie de idioma de la tienda de Steam sigue teniendo prioridad en las peticiones de invitado |
| Activar omisión de región | activado | Controla la detección de páginas, el modo automático/manual, el banner, el botón en otros sitios y la restauración de la cola. La búsqueda de invitado tiene sus propios interruptores |
| Disparador de omisión | Automático | **Automático** se ejecuta en páginas con error de región; **Mostrar botón** espera una acción manual |
| Mostrar banner | activado | Muestra el aviso de región sobre una página omitida |
| País de la tienda (`cc`) | vacío | Código de país de Steam opcional para peticiones de invitado |
| Mostrar notificaciones toast | activado | Avisos flotantes estilo Steam al cambiar ajustes; se pueden desactivar |
| Posición del toast | Arriba a la derecha | Esquina de los toast: arriba/abajo × izquierda/derecha |
| Sugerencias de búsqueda para invitados | activado | Pestaña **Búsqueda**: sugerencias anónimas en la cabecera |
| Página `/search` de invitado | desactivado | Pestaña **Búsqueda**: sustituir los resultados activos por una petición anónima de invitado |
| Recordar juegos bloqueados | activado | Pestaña **Búsqueda**: guardar ID de aplicaciones cuando Steam muestra un error de región |
| Resaltar bloqueados en la búsqueda | activado | Pestaña **Búsqueda**: marcar los juegos guardados en los resultados de invitado |
| Detección automática de bloqueos en la búsqueda | activado | Pestaña **Búsqueda**: sondear páginas de resultados con la sesión iniciada; alcance y concurrencia configurables |
| Duración de la caché (minutos) | `60` | Pestaña **Caché**: reutilizar una página de invitado correcta durante ese tiempo; `0` desactiva la caché. **Recargar** en el banner siempre obtiene datos nuevos |
| Máximo de páginas en caché | `30` | Pestaña **Caché**: entradas de HTML de invitado más recientes que se conservan (presupuesto flexible del medidor de 10 MB) |
| Caché de páginas de aplicaciones / búsqueda | activado / activado | Pestaña **Caché**: qué tipos de HTML de invitado guardar; desactivarlo detiene las escrituras y elimina ese tipo |
| Usar puerta de enlace proxy | desactivado | Enrutar la petición anónima a través de una puerta de enlace |
| Modo de puerta de enlace | `gateway` | Cómo se añade la URL de destino a `host:port` |
| Host / Puerto | vacío | Dirección de la puerta de enlace (p. ej. `127.0.0.1` / `8765`) |
| Usuario / Contraseña | vacío | Autenticación HTTP Basic opcional para la puerta de enlace |

Los ajustes se escriben en `srbb_settings_v2`. La caché de páginas conserva la clave existente `srbb_page_cache` y el registro de bloqueados conserva `srbb_blocked_apps`.

## Aviso legal

Este proyecto **no está afiliado** con Valve ni Steam. Eludir restricciones geográficas puede infringir el [Acuerdo de suscriptor de Steam](https://store.steampowered.com/subscriber_agreement/). Úsalo bajo tu propio riesgo. El script está pensado para **ver** información de la tienda que Steam ya ofrece a los visitantes anónimos; no compra ni activa productos.

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
