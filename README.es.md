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

El script incluye metadatos `@updateURL` y `@downloadURL` que apuntan al archivo directo de GitHub, por lo que los gestores compatibles buscan actualizaciones automáticamente. Los pasos de publicación están en [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing).

## Funciones

- **Restaura las páginas de aplicaciones bloqueadas por región** — petición anónima de invitado y trasplante del diseño real de la tienda al documento activo (reescritura completa del documento solo como respaldo)
- **Mantiene tu sesión intacta** — los controles de lista de deseos, seguir e ignorar de la sesión iniciada siguen funcionando tras un trasplante
- **Omisión automática o propuesta manual** — se ejecuta al instante en páginas bloqueadas o muestra primero una propuesta
- **Sugerencias de búsqueda para invitados** — activadas por defecto: sugerencias anónimas en la cabecera de la tienda, con los juegos bloqueados guardados resaltados
- **Página `/search` de invitado** — opcional: nueva petición e inyección anónimas de resultados de búsqueda
- **Registro de juegos bloqueados** — recuerda los ID de aplicaciones bloqueadas por región y puede detectarlos automáticamente al sondear resultados de búsqueda
- **Controles de caché** — medidor de uso, TTL y límite de entradas, interruptores por origen y un navegador de páginas en caché
- **Puerta de enlace proxy** — retransmisión HTTP opcional para bloqueos basados en IP ([configuración](docs/ARCHITECTURE.md#proxy-gateway))
- **Panel de ajustes con estilo Steam** — páginas General / Búsqueda / Caché / Proxy / Acerca de, edición de borrador, Guardar y Guardar y recargar
- **10 idiomas de interfaz** — inglés, ruso, chino, español, portugués (Brasil), alemán, francés, japonés, coreano y polaco

## Páginas compatibles

| Sitio | Patrón de URL | Notas |
|------|-------------|-------|
| Tienda de Steam (aplicaciones) | `https://store.steampowered.com/app/{id}/…` | Omisión del error de región (uso principal) |
| Tienda de Steam (búsqueda) | Búsqueda de cabecera + `https://store.steampowered.com/search/?term=…` | **Sugerencias de búsqueda para invitados** y **página /search de invitado** opcional en Region Bypass → Búsqueda |

Las páginas de aplicaciones funcionan cuando Steam muestra **«This item is currently unavailable in your region»** (este artículo no está disponible en tu región) — por ejemplo, **Call of Duty: Modern Warfare 4** en regiones restringidas. Las **sugerencias de búsqueda para invitados** están activadas por defecto para la barra de búsqueda de la cabecera; la **página `/search` de invitado** se activa aparte en **Region Bypass → Búsqueda**. Ambas usan la misma pila de peticiones anónimas (proxy / `cc` / caché). Los ID de aplicaciones bloqueadas guardados se pueden resaltar en los resultados de búsqueda.

## Para desarrolladores

Esta sección se trasladó a guías dedicadas:

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — compilación, pruebas locales, publicación, puerta de enlace
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — cómo funciona la omisión, estructura del repositorio, metadatos, permisos, referencia de ajustes
- [CONTRIBUTING.md](CONTRIBUTING.md) — flujo de trabajo para contribuir y lista de comprobación de PR
- [AGENTS.md](AGENTS.md) — instrucciones para agentes de programación con IA
- [SECURITY.md](SECURITY.md) — política de seguridad y notificación privada
- [DESIGN.md](DESIGN.md) — lenguaje visual y reglas de tokens CSS

## Otros userscripts

Otros userscripts del mismo autor:

| Userscript | Qué hace |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Panel de ajustes completo y traducción en la página para contenido de Steam Store y Steam Community — descripciones de juegos, reseñas, comentarios de perfil, noticias y guías |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | Añade datos de [GameStatus.info](https://gamestatus.info) a Steam — protección, fechas de lanzamiento, puntuaciones y especificaciones de hardware en fichas y páginas de juegos |

## Aviso legal

Este proyecto **no está afiliado** con Valve ni Steam. Eludir restricciones geográficas puede infringir el [Acuerdo de suscriptor de Steam](https://store.steampowered.com/subscriber_agreement/). Úsalo bajo tu propio riesgo. El script está pensado para **ver** información de la tienda que Steam ya ofrece a los visitantes anónimos; no compra ni activa productos.

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
