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

Das Skript enthält `@updateURL`- und `@downloadURL`-Metadaten, die auf die Raw-GitHub-Datei verweisen, sodass unterstützte Manager automatisch auf Updates prüfen. Die Schritte für ein Release stehen in [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing).

## Funktionen

- **Stellt regional blockierte App-Seiten wieder her** – anonymer Gast-Neuabruf, anschließend wird das echte Store-Layout in das aktive Dokument übertragen (vollständige Neuschreibung nur als Fallback)
- **Hält deine Sitzung intakt** – Wunschliste-, Folgen- und Ignorieren-Steuerelemente für Angemeldete funktionieren nach einer Übertragung weiter
- **Automatischer Bypass oder manuelles Angebot** – läuft sofort auf blockierten Seiten oder zeigt zuerst ein Angebot
- **Gast-Suchvorschläge** – standardmäßig aktiv: anonyme Vorschläge in der Store-Kopfzeile, gespeicherte blockierte Spiele werden hervorgehoben
- **Gastseite `/search`** – optionaler anonymer Neuabruf und Injektion der Suchergebnisse
- **Registry blockierter Spiele** – merkt sich regional blockierte App-IDs und kann sie beim Prüfen von Suchergebnissen automatisch erkennen
- **Cache-Steuerung** – Nutzungsanzeige, TTL und Eintragslimit, Schalter pro Quelle und ein Browser für zwischengespeicherte Seiten
- **Proxy-Gateway** – optionales HTTP-Relay für IP-basierte Sperren ([Einrichtung](docs/ARCHITECTURE.md#proxy-gateway))
- **Einstellungsfenster im Steam-Stil** – Seiten Allgemein / Suche / Cache / Proxy / Info, Entwurfsbearbeitung, Speichern und Speichern & neu laden
- **10 Oberflächensprachen** – Englisch, Russisch, Chinesisch, Spanisch, Portugiesisch (Brasilien), Deutsch, Französisch, Japanisch, Koreanisch, Polnisch

## Unterstützte Seiten

| Website | URL-Muster | Hinweise |
|------|-------------|-------|
| Steam Store (Apps) | `https://store.steampowered.com/app/{id}/…` | Umgehung des Regionsfehlers (Hauptanwendungsfall) |
| Steam Store (Suche) | Kopfzeilen-Suche + `https://store.steampowered.com/search/?term=…` | **Gast-Suchvorschläge** und optionale **Gastseite /search** unter Region Bypass → Suche |

App-Seiten funktionieren, wenn Steam **„This item is currently unavailable in your region“** (Dieser Artikel ist in deiner Region nicht verfügbar) anzeigt — zum Beispiel **Call of Duty: Modern Warfare 4** in eingeschränkten Regionen. **Gast-Suchvorschläge** sind standardmäßig für die Suchleiste in der Kopfzeile aktiv; die Gastseite `/search` ist optional und wird unter **Region Bypass → Suche** aktiviert. Beide nutzen denselben anonymen Anfragestapel (Proxy / `cc` / Cache). Gespeicherte regional blockierte App-IDs können in den Suchergebnissen hervorgehoben werden.

## Für Entwickler

Dieser Abschnitt wurde in eigene Anleitungen verschoben:

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) – Build, lokales Testen, Release, Gateway
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) – Funktionsweise des Bypass, Repository-Struktur, Metadaten, Berechtigungen, Einstellungsreferenz
- [CONTRIBUTING.md](CONTRIBUTING.md) – Workflow für Mitwirkende und PR-Checkliste
- [AGENTS.md](AGENTS.md) – Anweisungen für KI-Coding-Agenten
- [SECURITY.md](SECURITY.md) – Sicherheitsrichtlinie und vertrauliche Meldung
- [DESIGN.md](DESIGN.md) – Visuelle Sprache und CSS-Token-Regeln

## Weitere Userscripts

Weitere Userscripts desselben Autors:

| Userscript | Was es macht |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Vollständiges Einstellungsfenster und Übersetzung direkt auf der Seite für Inhalte von Steam Store und Steam Community – Spielbeschreibungen, Rezensionen, Profilkommentare, Neuigkeiten und Anleitungen |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | Ergänzt [GameStatus.info](https://gamestatus.info)-Daten in Steam – Schutz, Veröffentlichungsdaten, Bewertungen und Hardware-Spezifikationen auf Spielkarten und -seiten |

## Haftungsausschluss

Dieses Projekt ist **nicht mit Valve oder Steam verbunden**. Die Umgehung geografischer Beschränkungen kann gegen die [Steam-Abonnentenvereinbarung](https://store.steampowered.com/subscriber_agreement/) verstoßen. Nutzung auf eigene Gefahr. Das Skript dient dem **Ansehen** von Store-Informationen, die Steam bereits anonymen Besuchern bereitstellt; es kauft oder aktiviert keine Produkte.

## Lizenz

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
