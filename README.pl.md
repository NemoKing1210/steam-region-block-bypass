# Steam Region Block Bypass

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Polski**

[![Zainstaluj userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

Skrypt użytkownika dla sklepu Steam, który przywraca **zablokowane strony produktów** i dodaje opcjonalne **wyszukiwanie gościa** — anonimowe podpowiedzi w nagłówku oraz włączaną osobno stronę gościa `/search`, bez ciasteczek konta.

Ponownie pobiera adresy URL aplikacji **bez ciasteczek konta** (widok gościa), przenosi prawdziwy układ sklepu do aktywnego dokumentu i przywraca kontrolki listy życzeń, obserwowania i ignorowania dla zalogowanych użytkowników po przeniesieniu. **Podpowiedzi wyszukiwania gościa** są domyślnie włączone; pełny tryb gościa **strony `/search`** jest domyślnie wyłączony (włącz w Region Bypass → Szukaj). Dla blokad opartych na IP można skonfigurować opcjonalną **bramkę proxy** w panelu ustawień w stylu Steam (menu konta → Ustawienia Region Bypass).

Kompatybilny z [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat i innymi menedżerami obsługującymi blok metadanych `// ==UserScript==`.

## Zrzuty ekranu

Prawdziwy userscript działający na żywej stronie sklepu Steam.

![Panel ustawień Region Bypass z zakładkami Ogólne, Szukaj, Cache, Proxy i O skrypcie](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![Ogólne — język interfejsu, tryb obejścia, kraj sklepu, powiadomienia toast](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**Ogólne** — język interfejsu, automatyczne/ręczne obejście, baner, kraj sklepu, powiadomienia toast | ![Szukaj — podpowiedzi gościa, opcjonalna strona /search, rejestr zablokowanych gier, sondowanie](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**Szukaj** — podpowiedzi gościa, opcjonalna strona `/search`, rejestr zablokowanych gier, sondowanie |
| ![Cache — wskaźnik użycia, TTL, limit wpisów, cache według źródła, lista zablokowanych](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**Cache** — wskaźnik użycia, TTL, limit wpisów, cache według źródła, lista zablokowanych | ![Bramka proxy — tryb URL, host/port, opcjonalne dane HTTP Basic](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**Bramka proxy** — tryb URL, host/port, opcjonalne dane HTTP Basic |

Podpowiedzi wyszukiwania gościa w nagłówku sklepu — **Call of Duty: Modern Warfare 4** jest oznaczony jako **zablokowany regionalnie**, a pozostałe wyniki pozostają dostępne:

![Podpowiedzi wyszukiwania gościa dla Call of Duty: Modern Warfare 4 z plakietką Region blocked](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## Szybka instalacja

1. Zainstaluj menedżer skryptów użytkownika (zalecane Tampermonkey lub Violentmonkey).
2. Kliknij link instalacyjny poniżej — menedżer powinien otworzyć okno instalacji.

**Adres URL instalacji:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![Zainstaluj](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### Instalacja z adresu URL (panel)

| Menedżer | Ścieżka |
|---------|------|
| Tampermonkey | Panel → **Narzędzia** → **Zainstaluj z adresu URL** |
| Violentmonkey | Panel → **+** → **Zainstaluj z adresu URL** |
| Greasemonkey | Menu dodatku → **Nowy skrypt użytkownika** → wklej surowy URL |

Wklej [adres URL instalacji](#szybka-instalacja) podany powyżej.

### Instalacja ręczna

1. Otwórz [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js) w tym repozytorium.
2. Skopiuj całą zawartość pliku.
3. W menedżerze skryptów użytkownika utwórz nowy skrypt i wklej kod.
4. Zapisz i włącz skrypt.

## Aktualizacje

Skrypt zawiera metadane `@updateURL` i `@downloadURL` wskazujące na surowy plik GitHub. Obsługiwane menedżery automatycznie sprawdzają aktualizacje (Tampermonkey: panel → interwał sprawdzania; Violentmonkey: podobnie).

**Aby wydać nową wersję:**

1. Zwiększ `version` w `package.json` (SemVer).
2. Uruchom `npm run build` (odświeża główne `.user.js` / `.meta.js`).
3. Dodaj wpis w [`CHANGELOG.md`](CHANGELOG.md).
4. Wypchnij do `main` (lub utwórz GitHub Release).

Menedżery porównują zainstalowaną `@version` z metadanymi zdalnymi, aby zdecydować, czy zaproponować aktualizację. Pełny proces opisano w [DEVELOPMENT.md](DEVELOPMENT.md).

## Funkcje

- **Wstrzykiwanie z priorytetem przenoszenia** — podmienia układ gry gościa w aktywnym `#responsive_page_template_content`, zachowując nagłówek zalogowanej sesji, globalne zmienne sesji oraz załadowane style i skrypty; `document.write` pozostaje awaryjnym trybem pełnego przepisania
- **Przywracanie kolejki dla zalogowanych** — odtwarza kontrolki listy życzeń, obserwowania i ignorowania po przeniesieniu oraz wysyła akcje przez aktywną sesję
- **Automatyczne obejście lub przycisk** — uruchamia się natychmiast na zablokowanych stronach albo najpierw pokazuje ręczną propozycję
- **Anonimowe żądanie** — używa `GM_xmlhttpRequest` z `anonymous: true` (bez ciasteczek logowania)
- **Język sklepu** — żądanie gościa używa `Steam_Language`, `?l=` i `Accept-Language`, aby strona odpowiadała językowi interfejsu Steam
- **Ciasteczka weryfikacji wieku** — wysyła ciasteczka `birthtime` / treści dla dorosłych, aby strony gościa rzadziej zatrzymywały się na weryfikacji wieku
- **Opcjonalny kraj sklepu (`cc`)** — nadpisuje kraj sklepu Steam dla żądania gościa
- **Panel bramki proxy** — włącz/wyłącz, host, port, nazwa użytkownika, hasło, tryb URL
- **Główny przełącznik regionu + sterowanie banerem** — wyłącza obejście stron bez wpływu na wyszukiwanie gościa; ukrywa baner regionu, gdy to potrzebne
- **Interfejs w stylu Steam** — pozycja ustawień w menu konta (`#account_dropdown`, styl SteamDB); przycisk awaryjny dla wylogowanych w `#global_actions`; panel listy na stronie głównej z zakładkami Ogólne / Szukaj / Cache / Proxy / O skrypcie, edycją szkicu, Resetuj, Anuluj, Zapisz i Zapisz i przeładuj
- **Zlokalizowany interfejs** — panel i komunikaty w en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl; selektor języka interfejsu z automatycznym wykrywaniem przeglądarki
- **Sterowanie ręczne** — ponowne wczytanie wstrzykniętej treści, otwieranie ustawień z banera lub menu menedżera skryptów
- **Podpowiedzi wyszukiwania gościa** — domyślnie włączone: anonimowa lista podpowiedzi przez ten sam stos żądań gościa (proxy / `cc` / cache); wyłącz w **Region Bypass → Szukaj**
- **Strona gościa `/search`** — opcjonalna: anonimowe ponowne pobranie i wstrzyknięcie dla `store.steampowered.com/search` (ten sam stos); włącz osobno w **Region Bypass → Szukaj**
- **Zakładka Cache** — wskaźnik użycia, TTL i maksymalna liczba wpisów, wybór typów stron gościa do przechowywania, przeglądanie/usuwanie zbuforowanego HTML, przeglądanie/czyszczenie listy zablokowanych gier
- **Rejestr zablokowanych gier** — zapamiętuje identyfikatory aplikacji zablokowanych regionalnie (przełączniki na zakładce Szukaj) i wyróżnia je w wyszukiwaniu gościa; lista i czyszczenie na zakładce **Cache**

## Obsługiwane strony

| Witryna | Wzorzec URL | Uwagi |
|------|-------------|-------|
| Sklep Steam (aplikacje) | `https://store.steampowered.com/app/{id}/…` | Obejście błędu regionu (główne zastosowanie) |
| Sklep Steam (wyszukiwanie) | Wyszukiwanie w nagłówku + `https://store.steampowered.com/search/?term=…` | **Podpowiedzi wyszukiwania gościa** i opcjonalna **strona gościa /search** w Region Bypass → Szukaj |

Strony aplikacji działają, gdy Steam wyświetla **„This item is currently unavailable in your region”** (ten przedmiot nie jest obecnie dostępny w Twoim regionie) — na przykład **Call of Duty: Modern Warfare 4** w ograniczonych regionach. **Podpowiedzi wyszukiwania gościa** są domyślnie włączone dla paska wyszukiwania w nagłówku. Ponowne pobranie gościa dla pełnej strony `/search` jest **domyślnie wyłączone** (ten sam anonimowy stos żądań gościa: proxy / `cc` / cache) — włącz je w **Region Bypass → Szukaj**. Zapisane identyfikatory zablokowanych aplikacji można wyróżniać w wynikach wyszukiwania.

## Jak to działa

```
Ładowanie strony aplikacji Steam
       │
       ▼
Czy #error_box / Oops pasuje do „unavailable in your region”?
       │
       ├── nie ──► bezczynność (przycisk ustawień nadal dostępny)
       │
       └── tak ──► Zbuduj docelowy URL (?l= język, opcjonalnie ?cc=)
                │
                ▼
       Trafienie w cache (w TTL)? ── tak ──► użyj zapisanego HTML gościa
                │ nie
                ▼
       Opcjonalnie: przepisz URL przez bramkę proxy
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       Parsuj HTML → wyodrębnij .game_page_background / #tabletGrid
                │
                ├── nadal zablokowane? ──► pokaż błąd + zaproponuj proxy
                │
                ├── przenieś do aktywnej powłoki
                │   ├── zsynchronizuj title, klasy, style, skrypty
                │   ├── przywróć kontrolki kolejki zalogowanego użytkownika
                │   └── błąd → awaryjny document.write(HTML gościa)
                │
                └── baner + ponowny start funkcji (udany HTML zapisany w cache)
```

### Wyszukiwanie gościa

W panelu Region Bypass (**zakładka Szukaj**):

1. **Podpowiedzi wyszukiwania gościa** (domyślnie włączone) — wpisywanie w wyszukiwarce nagłówka sklepu pobiera anonimowe podpowiedzi z `/search/results` (do 25 gier), wzbogacane danymi `/api/storesearch/`, gdy są dostępne (awaryjnie: `/search/suggest`).
2. **Strona gościa `/search`** (domyślnie wyłączona) — wysłanie wyszukiwania lub otwarcie `/search/?term=…` może ponownie pobrać wyniki jako gość i wstrzyknąć je do strony, gdy to ustawienie jest włączone.
3. Opcjonalny **rejestr zablokowanych gier** wyróżnia aplikacje, które wcześniej otworzyłeś na stronie z błędem regionu.
4. **Automatyczne wykrywanie blokad w wyszukiwaniu** (domyślnie włączone) sprawdza każdy wynik za pomocą ciasteczek zalogowanej sesji Steam i dodaje aplikacje z blokadą regionalną do listy (pasek postępu + wskaźniki ładowania dla każdego elementu; zakres i współbieżność konfigurowalne).

Używa tych samych ustawień proxy, `cc`, języka i cache co obejście stron aplikacji.

### Anonimowe żądanie

Steam często ogranicza stronę sklepu według **kraju konta**. Uprzywilejowane żądanie bez ciasteczek sesji może zwrócić publiczny układ sklepu dla danego IP. Skrypt nigdy nie używa Twojej zalogowanej sesji do żądania obejścia.

### Język sklepu

Żądanie gościa odzwierciedla język Twojego sklepu Steam, gdy to możliwe:

1. Ciasteczko `Steam_Language` z bieżącej strony
2. W przeciwnym razie język wywiedziony z ustawień regionalnych interfejsu/przeglądarki
3. Stosowane jako `?l=…`, `Cookie: Steam_Language=…` i `Accept-Language`

### Bramka proxy

Menedżery skryptów użytkownika **nie mogą** dołączyć systemowego proxy SOCKS/HTTP do `GM_xmlhttpRequest`. Gdy blokada jest oparta na IP, wskaż w panelu lokalną lub zdalną **bramkę HTTP**, która pobiera URL Steam z innej sieci.

| Tryb | Przykładowe żądanie |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

To repozytorium zawiera opcjonalną bramkę Node: [`proxy-gateway.mjs`](proxy-gateway.mjs).

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

Następnie w panelu userscriptu: Host `127.0.0.1`, Port `8765`, tryb `host:port/https://…`, proxy **WŁ**.

## Struktura repozytorium

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # lokalizacja + bootDocument + handler region:rewrote
│   ├── core/                   # ustawienia, cache, zablokowane aplikacje, bus, stałe, debug
│   ├── region/                 # wykrywanie, żądanie, przenoszenie, kolejka, poprawki, obejście
│   ├── features/search/        # API/parsowanie/render podpowiedzi, strona /search, sondowanie
│   ├── features/settings/      # panel, kontrolki, potwierdzenie, strony
│   ├── i18n/                   # metadane lokalizacji + dziesięć plików językowych
│   ├── ui/                     # powiadomienia toast
│   ├── utils/                  # dom, html, pool, nawigacja, blokada przewijania
│   └── styles/                 # tokens, base, panel, region, search, cache, toast
├── tests/                      # Wbudowane testy jednostkowe Node
├── scripts/                    # pomocniki budowania / weryfikacji artefaktów
├── steam-region-block-bypass.user.js   # Instalowalny userscript (artefakt w repozytorium)
├── steam-region-block-bypass.meta.js   # Metadane do sprawdzania aktualizacji
├── proxy-gateway.mjs           # Opcjonalna lokalna bramka HTTP (Node)
├── package.json                # Zależności, wersja, skrypty
├── README.md                   # Dokumentacja i instrukcje instalacji
├── CHANGELOG.md                # Historia wersji
├── DESIGN.md                   # Język wizualny i reguły tokenów CSS
├── LICENSE                     # Licencja MIT
└── .gitattributes / .gitignore
```

| Plik | Przeznaczenie |
|------|---------|
| `steam-region-block-bypass.user.js` | Pełny skrypt serwowany pod `@downloadURL` / `@updateURL` |
| `steam-region-block-bypass.meta.js` | Lekkie lustro metadanych; menedżery mogą pobierać je zamiast pełnego skryptu podczas sprawdzania aktualizacji |
| `proxy-gateway.mjs` | Opcjonalny lokalny przekaźnik dla blokad regionalnych opartych na IP |

## Metadane skryptu

Kluczowe pola `// ==UserScript==` używane przez menedżery:

| Pole | Wartość |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | Wersja semantyczna (musi być zwiększana przy każdym wydaniu) |
| `@updateURL` / `@downloadURL` | Surowy URL GitHub pliku `steam-region-block-bypass.user.js` |
| `@homepageURL` | To repozytorium |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*` (niestandardowe bramki proxy) |

Zlokalizowane znaczniki `@name` i `@description` są dostępne dla en, ru, zh-CN, es, pt-BR, de, fr, ja, ko i pl.

## Wymagane uprawnienia

| Uprawnienie | Przeznaczenie |
|-------|---------|
| `GM_xmlhttpRequest` | Pobieranie strony sklepu bez ciasteczek strony / limitów CORS |
| `GM_getValue` / `GM_setValue` | Zapisywanie ustawień proxy i interfejsu |
| `GM_addStyle` | Wstrzykiwanie CSS panelu i banera w stylu Steam |
| `GM_registerMenuCommand` | Otwieranie ustawień z menu menedżera skryptów |

`@connect *` jest wymagane, aby skrypt mógł wywołać skonfigurowany przez użytkownika host bramki proxy.

## Rozwój

Zbudowany z **Vite** + **vite-plugin-monkey**. Edytuj moduły ESM w [`src/`](src/), a następnie uruchom `npm run build`, aby odświeżyć zatwierdzone artefakty instalacyjne. Szczegóły: [DEVELOPMENT.md](DEVELOPMENT.md), [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm install
npm run dev      # działający userscript "dev:" przez Vite
npm run build    # produkcja → dist/ + główne .user.js / .meta.js
npm test         # wbudowane testy jednostkowe Node
npm run ci       # testy + build + weryfikacja artefaktów
npm run gateway  # opcjonalna lokalna bramka proxy
```

### Lokalny przepływ pracy (Violentmonkey)

1. Sklonuj to repozytorium i uruchom `npm run build`.
2. W Violentmonkey zainstaluj z lokalnego głównego `steam-region-block-bypass.user.js`.
3. Włącz **Śledź plik lokalny** przed zamknięciem okna instalacji.
4. Edytuj `src/`, przebuduj, odśwież stronę Steam — lub użyj `npm run dev` dla HMR.

### Lokalny przepływ pracy (Tampermonkey)

Tampermonkey nie śledzi plików lokalnych natywnie. Opcje:

- Użyj `npm run dev` i zainstaluj serwowany userscript `dev:`, albo
- Zainstaluj ponownie z zbudowanego pliku / URL po każdym `npm run build`, albo
- Tymczasowo ustaw `@updateURL` / `@downloadURL` na `http://localhost:...` podczas rozwoju (nie zatwierdzaj lokalnych URL).

### Konfiguracja

Ustawienia są przechowywane w magazynie userscriptu (`srbb_settings_v2`; płaski obiekt `srbb_settings` v1 jest jednorazowo migrowany i pozostawiany bez zmian na wypadek downgrade) przez panel ustawień:

| Ustawienie | Domyślnie | Opis |
|---------|---------|-------------|
| Język interfejsu | Auto | Język panelu / komunikatów; `Auto` podąża za przeglądarką. Ciasteczko języka sklepu Steam nadal ma priorytet w żądaniach gościa |
| Włącz obejście regionu | wł. | Steruje wykrywaniem stron, trybem auto/ręcznym, banerem, przyciskiem na innych stronach i przywracaniem kolejki. Wyszukiwanie gościa ma własne przełączniki |
| Wyzwalacz obejścia | Auto | **Auto** uruchamia się na stronach z błędem regionu; **Pokaż przycisk** czeka na ręczną akcję |
| Pokaż baner | wł. | Pokazuje powiadomienie o regionie nad obejściem strony |
| Kraj sklepu (`cc`) | puste | Opcjonalny kod kraju Steam dla żądań gościa |
| Pokazuj powiadomienia toast | wł. | Pływające powiadomienia w stylu Steam przy zmianie ustawień; można wyłączyć |
| Pozycja toast | Prawy górny róg | Róg powiadomień toast: góra/dół × lewo/prawo |
| Podpowiedzi wyszukiwania gościa | wł. | Zakładka **Szukaj**: anonimowe podpowiedzi w nagłówku |
| Strona gościa `/search` | wył. | Zakładka **Szukaj**: zastąp aktywne wyniki anonimowym żądaniem gościa |
| Pamiętaj zablokowane gry | wł. | Zakładka **Szukaj**: zapisuj identyfikatory aplikacji, gdy Steam pokazuje błąd regionu |
| Wyróżniaj zablokowane w wyszukiwaniu | wł. | Zakładka **Szukaj**: oznaczaj zapisane gry w wynikach gościa |
| Automatycznie wykrywaj blokady w wyszukiwaniu | wł. | Zakładka **Szukaj**: sprawdzaj strony wyników za pomocą zalogowanej sesji; zakres i współbieżność konfigurowalne |
| Czas trwania cache (minuty) | `60` | Zakładka **Cache**: używaj ponownie udanej strony gościa przez ten czas; `0` wyłącza cache. **Przeładuj** w banerze zawsze pobiera świeże dane |
| Maks. stron w cache | `30` | Zakładka **Cache**: najnowsze wpisy HTML gościa, które są zachowywane (miękki budżet wskaźnika 10 MB) |
| Cache stron aplikacji / wyszukiwania | wł. / wł. | Zakładka **Cache**: które rodzaje HTML gościa przechowywać; wyłączenie zatrzymuje zapisy i usuwa dany rodzaj |
| Używaj bramki proxy | wył. | Kieruj anonimowe żądanie przez bramkę |
| Tryb bramki | `gateway` | Jak docelowy URL jest dołączany do `host:port` |
| Host / Port | puste | Adres bramki (np. `127.0.0.1` / `8765`) |
| Nazwa użytkownika / Hasło | puste | Opcjonalne uwierzytelnianie HTTP Basic dla bramki |

Ustawienia są zapisywane w `srbb_settings_v2`. Cache stron zachowuje istniejący klucz `srbb_page_cache`, a rejestr zablokowanych — `srbb_blocked_apps`.

## Zastrzeżenie

Ten projekt **nie jest powiązany** z Valve ani Steam. Obejście ograniczeń geograficznych może naruszać [Umowę subskrybenta Steam](https://store.steampowered.com/subscriber_agreement/). Używaj na własne ryzyko. Skrypt służy do **przeglądania** informacji o sklepie, które Steam już udostępnia anonimowym odwiedzającym; nie kupuje ani nie aktywuje produktów.

## Licencja

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
