# Steam Region Block Bypass

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · **Deutsch** · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Userscript installieren](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

Ein Userscript für den Steam Store, das **blockierte Produktseiten** wiederherstellt und eine optionale **Gastsuche** ergänzt – anonyme Suchvorschläge in der Kopfzeile sowie eine separat aktivierbare Gastseite `/search`, ohne Konto-Cookies.

Es ruft App-URLs **ohne Konto-Cookies** erneut ab (Gastansicht), überträgt das echte Store-Layout in das aktive Dokument und stellt nach der Übertragung die Wunschliste-, Folgen- und Ignorieren-Steuerelemente für angemeldete Nutzer wieder her. **Gast-Suchvorschläge** sind standardmäßig aktiv; der vollständige Gastmodus der **`/search`-Seite** ist standardmäßig deaktiviert (aktivierbar unter Region Bypass → Suche). Für IP-basierte Sperren kann ein optionales **Proxy-Gateway** im Einstellungsfenster im Steam-Stil konfiguriert werden (Kontomenü → Region-Bypass-Einstellungen).

Kompatibel mit [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat und anderen Managern, die den Metadatenblock `// ==UserScript==` unterstützen.

## Screenshots

Das echte Userscript auf einer Live-Store-Seite von Steam.

![Region-Bypass-Einstellungsfenster mit den Seiten Allgemein, Suche, Cache, Proxy und Info](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![Allgemein — Oberflächensprache, Bypass-Modus, Store-Land, Toast-Benachrichtigungen](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**Allgemein** — Oberflächensprache, automatischer/manueller Bypass, Banner, Store-Land, Toast-Benachrichtigungen | ![Suche — Gastvorschläge, optionale /search-Seite, Registry blockierter Spiele, Prüfung](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**Suche** — Gastvorschläge, optionale `/search`-Seite, Registry blockierter Spiele, Prüfung |
| ![Cache — Nutzungsanzeige, TTL, Eintragslimit, Caching pro Quelle, Blockiert-Liste](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**Cache** — Nutzungsanzeige, TTL, Eintragslimit, Caching pro Quelle, Blockiert-Liste | ![Proxy-Gateway — URL-Modus, Host/Port, optionale HTTP-Basic-Anmeldedaten](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**Proxy-Gateway** — URL-Modus, Host/Port, optionale HTTP-Basic-Anmeldedaten |

Gast-Suchvorschläge in der Store-Kopfzeile — **Call of Duty: Modern Warfare 4** ist als **regional blockiert** markiert, während die übrigen Ergebnisse verfügbar bleiben:

![Gast-Suchvorschläge für Call of Duty: Modern Warfare 4 mit dem Hinweis „Region blocked“](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## Schnellinstallation

1. Installiere einen Userscript-Manager (Tampermonkey oder Violentmonkey empfohlen).
2. Klicke auf den Installationslink unten – dein Manager sollte einen Installationsdialog öffnen.

**Installations-URL:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![Installieren](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### Installation per URL (Dashboard)

| Manager | Pfad |
|---------|------|
| Tampermonkey | Dashboard → **Dienstprogramme** → **Von URL installieren** |
| Violentmonkey | Dashboard → **+** → **Von URL installieren** |
| Greasemonkey | Add-on-Menü → **Neues Benutzerskript** → Raw-URL einfügen |

Füge die oben genannte [Installations-URL](#schnellinstallation) ein.

### Manuelle Installation

1. Öffne [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js) in diesem Repository.
2. Kopiere den gesamten Dateiinhalt.
3. Erstelle in deinem Userscript-Manager ein neues Skript und füge den Code ein.
4. Speichere und aktiviere das Skript.

## Updates

Das Skript enthält `@updateURL`- und `@downloadURL`-Metadaten, die auf die Raw-Datei bei GitHub verweisen. Unterstützte Manager prüfen automatisch auf Updates (Tampermonkey: Dashboard → Prüfintervall; Violentmonkey: ähnlich).

**So veröffentlichst du eine neue Version:**

1. Erhöhe `version` in `package.json` (SemVer).
2. Führe `npm run build` aus (aktualisiert die `.user.js` / `.meta.js` im Stammverzeichnis).
3. Füge einen Eintrag in [`CHANGELOG.md`](CHANGELOG.md) hinzu.
4. Push nach `main` (oder erstelle ein GitHub Release).

Manager vergleichen die installierte `@version` mit den Remote-Metadaten, um zu entscheiden, ob ein Update angeboten wird. Der vollständige Ablauf steht in [DEVELOPMENT.md](DEVELOPMENT.md).

## Funktionen

- **Injektion mit Übertragungspriorität** – tauscht das Gast-Spiellayout im aktiven `#responsive_page_template_content` aus und bewahrt die Kopfzeile der angemeldeten Sitzung, globale Sitzungsvariablen sowie geladene Styles und Skripte; `document.write` bleibt der Fallback für eine vollständige Neuschreibung
- **Wiederherstellung der Warteschlange für Angemeldete** – baut Wunschliste-, Folgen- und Ignorieren-Steuerelemente nach einer Übertragung neu auf und sendet Aktionen über die aktive Sitzung
- **Automatischer Bypass oder Button** – läuft sofort auf blockierten Seiten oder zeigt zuerst ein manuelles Angebot
- **Anonyme Anfrage** – verwendet `GM_xmlhttpRequest` mit `anonymous: true` (keine Login-Cookies)
- **Store-Sprache** – die Gastanfrage nutzt `Steam_Language`, `?l=` und `Accept-Language`, damit die Seite zur Sprache deiner Steam-Oberfläche passt
- **Altersprüfungs-Cookies** – sendet `birthtime`- / Mature-Content-Cookies, damit Gastseiten seltener an der Altersabfrage hängen bleiben
- **Optionales Store-Land (`cc`)** – überschreibt das Steam-Store-Land für die Gastanfrage
- **Proxy-Gateway-Fenster** – Ein/Aus, Host, Port, Benutzername, Passwort, URL-Modus
- **Regions-Hauptschalter + Bannersteuerung** – deaktiviert den Seiten-Bypass, ohne die Gastsuche zu beeinflussen; blendet das Regionsbanner bei Bedarf aus
- **Oberfläche im Steam-Stil** – Einstellungseintrag im Kontomenü (`#account_dropdown`, im SteamDB-Stil); Fallback-Button für Abgemeldete in `#global_actions`; Listenfenster auf der Startseite mit den Seiten Allgemein / Suche / Cache / Proxy / Info, Entwurfsbearbeitung, Zurücksetzen, Abbrechen, Speichern und Speichern & neu laden
- **Lokalisierte Oberfläche** – Fenster und Meldungen in en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl; Sprachauswahl mit automatischer Browsererkennung
- **Manuelle Steuerung** – injizierten Inhalt neu laden, Einstellungen über das Banner oder das Manager-Menü öffnen
- **Gast-Suchvorschläge** – standardmäßig aktiv: anonyme Vorschlagsliste über denselben Gast-Anfragestapel (Proxy / `cc` / Cache); deaktivierbar unter **Region Bypass → Suche**
- **Gastseite `/search`** – optional: anonymer Neuabruf und Injektion für `store.steampowered.com/search` (gleicher Stapel); separat aktivierbar unter **Region Bypass → Suche**
- **Cache-Tab** – Nutzungsanzeige, TTL und maximale Einträge, Auswahl der zu speichernden Gastseiten, durchsuchen/entfernen des zwischengespeicherten HTML, durchsuchen/leeren der Liste blockierter Spiele
- **Registry blockierter Spiele** – merkt sich regional blockierte App-IDs (Schalter im Tab „Suche“) und hebt sie in der Gastsuche hervor; Liste und Löschen unter **Cache**

## Unterstützte Seiten

| Website | URL-Muster | Hinweise |
|------|-------------|-------|
| Steam Store (Apps) | `https://store.steampowered.com/app/{id}/…` | Umgehung des Regionsfehlers (Hauptanwendungsfall) |
| Steam Store (Suche) | Kopfzeilen-Suche + `https://store.steampowered.com/search/?term=…` | **Gast-Suchvorschläge** und optionale **Gastseite /search** unter Region Bypass → Suche |

App-Seiten funktionieren, wenn Steam **„This item is currently unavailable in your region“** (Dieser Artikel ist in deiner Region nicht verfügbar) anzeigt — zum Beispiel **Call of Duty: Modern Warfare 4** in eingeschränkten Regionen. **Gast-Suchvorschläge** sind standardmäßig für die Suchleiste in der Kopfzeile aktiv. Der Gast-Neuabruf für die vollständige `/search`-Seite ist **standardmäßig deaktiviert** (gleicher anonymer Gast-Anfragestapel: Proxy / `cc` / Cache) – aktiviere ihn unter **Region Bypass → Suche**. Gespeicherte regional blockierte App-IDs können in den Suchergebnissen hervorgehoben werden.

## So funktioniert es

```
Steam-App-Seite wird geladen
       │
       ▼
#error_box / Oops entspricht „unavailable in your region“?
       │
       ├── nein ──► Leerlauf (Einstellungsbutton weiterhin verfügbar)
       │
       └── ja ──► Ziel-URL erstellen (?l= Sprache, optional ?cc=)
                │
                ▼
       Cache-Treffer (innerhalb der TTL)? ── ja ──► gespeichertes Gast-HTML verwenden
                │ nein
                ▼
       Optional: URL über das Proxy-Gateway umschreiben
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       HTML parsen → .game_page_background / #tabletGrid extrahieren
                │
                ├── weiterhin blockiert? ──► Fehler anzeigen + Proxy empfehlen
                │
                ├── in die aktive Hülle übertragen
                │   ├── title, Klassen, Styles, Skripte synchronisieren
                │   ├── Warteschlangen-Steuerelemente der Sitzung wiederherstellen
                │   └── Fehler → document.write(Gast-HTML)-Fallback
                │
                └── Banner + Neustart der Funktionen (erfolgreiches HTML im Cache gespeichert)
```

### Gastsuche

Im Region-Bypass-Fenster (**Tab „Suche“**):

1. **Gast-Suchvorschläge** (standardmäßig aktiv) – bei Eingabe in der Store-Kopfzeilensuche werden anonyme Vorschläge von `/search/results` abgerufen (bis zu 25 Spiele), angereichert mit `/api/storesearch/`-Daten, wenn verfügbar (Fallback: `/search/suggest`).
2. **Gastseite `/search`** (standardmäßig deaktiviert) – beim Absenden einer Suche oder Öffnen von `/search/?term=…` können Ergebnisse als Gast neu abgerufen und in die Seite injiziert werden, wenn diese Einstellung aktiviert ist.
3. Die optionale **Registry blockierter Spiele** hebt Apps hervor, die du zuvor auf einer Seite mit Regionsfehler geöffnet hast.
4. **Blockierte in der Suche automatisch erkennen** (standardmäßig aktiv) prüft jedes Ergebnis mit deinen angemeldeten Steam-Cookies und fügt regional gesperrte Apps zur Liste hinzu (Fortschrittsbalken + Ladeindikatoren pro Element; Umfang und Parallelität konfigurierbar).

Verwendet dieselben Proxy-, `cc`-, Sprach- und Cache-Einstellungen wie der App-Seiten-Bypass.

### Anonyme Anfrage

Steam beschränkt die Store-Seite häufig nach dem **Kontoland**. Eine privilegierte Anfrage ohne Sitzungs-Cookies kann das öffentliche Store-Layout für diese IP zurückgeben. Das Skript verwendet niemals deine angemeldete Sitzung für die Bypass-Anfrage.

### Store-Sprache

Die Gastanfrage übernimmt nach Möglichkeit die Sprache deines Steam-Stores:

1. `Steam_Language`-Cookie der aktuellen Seite
2. Andernfalls eine aus dem UI-/Browser-Locale abgeleitete Sprache
3. Angewendet als `?l=…`, `Cookie: Steam_Language=…` und `Accept-Language`

### Proxy-Gateway

Userscript-Manager **können** keinen System-SOCKS/HTTP-Proxy an `GM_xmlhttpRequest` anhängen. Wenn die Sperre IP-basiert ist, richte das Fenster auf ein lokales oder entferntes **HTTP-Gateway**, das die Steam-URL aus einem anderen Netzwerk abruft.

| Modus | Beispielanfrage |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

Dieses Repository enthält ein optionales Node-Gateway: [`proxy-gateway.mjs`](proxy-gateway.mjs).

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

Danach im Userscript-Fenster: Host `127.0.0.1`, Port `8765`, Modus `host:port/https://…`, Proxy **AN**.

## Repository-Struktur

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # Locale + bootDocument + region:rewrote-Handler
│   ├── core/                   # Einstellungen, Cache, blockierte Apps, Bus, Konstanten, Debug
│   ├── region/                 # Erkennung, Anfrage, Übertragung, Warteschlange, Fixups, Bypass
│   ├── features/search/        # Suggest-API/Parsing/Rendering/Kopfzeile, /search-Seite, Prüfung
│   ├── features/settings/      # Fenster, Steuerelemente, Bestätigung, Seiten
│   ├── i18n/                   # Locale-Metadaten + zehn Sprachdateien
│   ├── ui/                     # Toast-Benachrichtigungen
│   ├── utils/                  # dom, html, pool, Navigation, Scroll-Sperre
│   └── styles/                 # tokens, base, panel, region, search, cache, toast
├── tests/                      # In Node integrierte Unit-Tests
├── scripts/                    # Build- / Artefakt-Helfer
├── steam-region-block-bypass.user.js   # Installierbares Userscript (eingechecktes Artefakt)
├── steam-region-block-bypass.meta.js   # Metadaten für Update-Prüfungen
├── proxy-gateway.mjs           # Optionales lokales HTTP-Gateway (Node)
├── package.json                # Abhängigkeiten, Version, Skripte
├── README.md                   # Dokumentation und Installationshinweise
├── CHANGELOG.md                # Versionshistorie
├── DESIGN.md                   # Visuelle Sprache und CSS-Token-Regeln
├── LICENSE                     # MIT-Lizenz
└── .gitattributes / .gitignore
```

| Datei | Zweck |
|------|---------|
| `steam-region-block-bypass.user.js` | Vollständiges Skript, bereitgestellt unter `@downloadURL` / `@updateURL` |
| `steam-region-block-bypass.meta.js` | Leichtgewichtiger Metadaten-Spiegel; Manager können ihn bei Update-Prüfungen statt des vollständigen Skripts abrufen |
| `proxy-gateway.mjs` | Optionales lokales Relay für IP-basierte Regiosperren |

## Skript-Metadaten

Wichtige `// ==UserScript==`-Felder, die Manager verwenden:

| Feld | Wert |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | Semantische Version (muss bei jedem Release erhöht werden) |
| `@updateURL` / `@downloadURL` | Raw-GitHub-URL von `steam-region-block-bypass.user.js` |
| `@homepageURL` | Dieses Repository |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*` (benutzerdefinierte Proxy-Gateways) |

Lokalisierte `@name`- und `@description`-Tags sind für en, ru, zh-CN, es, pt-BR, de, fr, ja, ko und pl vorhanden.

## Erforderliche Berechtigungen

| Grant | Zweck |
|-------|---------|
| `GM_xmlhttpRequest` | Store-Seite ohne Seiten-Cookies / CORS-Beschränkungen abrufen |
| `GM_getValue` / `GM_setValue` | Proxy- und UI-Einstellungen speichern |
| `GM_addStyle` | CSS für Fenster und Banner im Steam-Stil injizieren |
| `GM_registerMenuCommand` | Einstellungen über das Userscript-Manager-Menü öffnen |

`@connect *` ist erforderlich, damit das Skript einen benutzerdefinierten Proxy-Gateway-Host aufrufen kann.

## Entwicklung

Erstellt mit **Vite** + **vite-plugin-monkey**. Bearbeite die ESM-Module unter [`src/`](src/) und führe dann `npm run build` aus, um die eingecheckten Installationsartefakte zu aktualisieren. Details: [DEVELOPMENT.md](DEVELOPMENT.md), [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm install
npm run dev      # Live-"dev:"-Userscript über Vite
npm run build    # Produktion → dist/ + .user.js / .meta.js im Stammverzeichnis
npm test         # In Node integrierte Unit-Tests
npm run ci       # Tests + Build + Artefaktprüfung
npm run gateway  # optionales lokales Proxy-Gateway
```

### Lokaler Workflow (Violentmonkey)

1. Klone dieses Repository und führe `npm run build` aus.
2. Installiere in Violentmonkey aus der lokalen `steam-region-block-bypass.user.js` im Stammverzeichnis.
3. Aktiviere **Lokale Datei verfolgen**, bevor du den Installationsdialog schließt.
4. Bearbeite `src/`, baue neu, lade die Steam-Seite neu – oder nutze `npm run dev` für HMR.

### Lokaler Workflow (Tampermonkey)

Tampermonkey verfolgt lokale Dateien nicht nativ. Optionen:

- `npm run dev` verwenden und das bereitgestellte `dev:`-Userscript installieren, oder
- nach jedem `npm run build` aus der gebauten Datei / URL neu installieren, oder
- `@updateURL` / `@downloadURL` während der Entwicklung vorübergehend auf `http://localhost:...` zeigen lassen (lokale URLs nicht committen).

### Konfiguration

Einstellungen werden im Userscript-Speicher (`srbb_settings_v2`; das flache `srbb_settings`-v1-Objekt wird einmalig migriert und für ein Downgrade unverändert gelassen) über das Einstellungsfenster gespeichert:

| Einstellung | Standard | Beschreibung |
|---------|---------|-------------|
| Oberflächensprache | Automatisch | Sprache von Fenster / Meldungen; `Automatisch` folgt dem Browser. Das Store-Sprach-Cookie von Steam hat bei Gastanfragen weiterhin Vorrang |
| Regions-Bypass aktivieren | an | Steuert Seitenerkennung, Auto-/Manuellmodus, Banner, Button auf anderen Seiten und Warteschlangen-Wiederherstellung. Die Gastsuche hat eigene Schalter |
| Bypass-Auslöser | Automatisch | **Automatisch** läuft auf Seiten mit Regionsfehler; **Button anzeigen** wartet auf eine manuelle Aktion |
| Banner anzeigen | an | Zeigt den Regionshinweis über einer umgangenen Seite |
| Store-Land (`cc`) | leer | Optionaler Steam-Ländercode für Gastanfragen |
| Toast-Benachrichtigungen anzeigen | an | Schwebende Hinweise im Steam-Stil bei Einstellungsänderungen; abschaltbar |
| Toast-Position | Oben rechts | Ecke für Toasts: oben/unten × links/rechts |
| Gast-Suchvorschläge | an | Tab **Suche**: anonyme Vorschläge in der Kopfzeile |
| Gastseite `/search` | aus | Tab **Suche**: aktive Ergebnisse durch einen anonymen Gastabruf ersetzen |
| Blockierte Spiele merken | an | Tab **Suche**: App-IDs speichern, wenn Steam einen Regionsfehler zeigt |
| Blockierte in der Suche hervorheben | an | Tab **Suche**: gespeicherte Spiele in Gastergebnissen markieren |
| Blockierte in der Suche automatisch erkennen | an | Tab **Suche**: Ergebnisseiten mit der angemeldeten Sitzung prüfen; Umfang und Parallelität konfigurierbar |
| Cache-Dauer (Minuten) | `60` | Tab **Cache**: eine erfolgreiche Gastseite so lange wiederverwenden; `0` deaktiviert den Cache. **Neu laden** im Banner ruft immer frische Daten ab |
| Max. zwischengespeicherte Seiten | `30` | Tab **Cache**: neueste Gast-HTML-Einträge, die behalten werden (weiches Budget der 10-MB-Anzeige) |
| App- / Suchseiten cachen | an / an | Tab **Cache**: welche Gast-HTML-Arten gespeichert werden; Ausschalten stoppt Schreibvorgänge und entfernt diese Art |
| Proxy-Gateway verwenden | aus | Anonyme Anfrage über ein Gateway leiten |
| Gateway-Modus | `gateway` | Wie die Ziel-URL an `host:port` angehängt wird |
| Host / Port | leer | Gateway-Adresse (z. B. `127.0.0.1` / `8765`) |
| Benutzername / Passwort | leer | Optionale HTTP-Basic-Authentifizierung für das Gateway |

Einstellungen werden in `srbb_settings_v2` geschrieben. Der Seiten-Cache behält den vorhandenen Schlüssel `srbb_page_cache`, die Blockiert-Registry behält `srbb_blocked_apps`.

## Haftungsausschluss

Dieses Projekt ist **nicht mit Valve oder Steam verbunden**. Die Umgehung geografischer Beschränkungen kann gegen die [Steam-Abonnentenvereinbarung](https://store.steampowered.com/subscriber_agreement/) verstoßen. Nutzung auf eigene Gefahr. Das Skript dient dem **Ansehen** von Store-Informationen, die Steam bereits anonymen Besuchern bereitstellt; es kauft oder aktiviert keine Produkte.

## Lizenz

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
