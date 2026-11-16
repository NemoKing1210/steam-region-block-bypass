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

Skrypt dostarcza metadane `@updateURL` i `@downloadURL` wskazujące na surowy plik GitHub, więc obsługiwane menedżery automatycznie sprawdzają aktualizacje. Kroki wydania opisano w [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing).

## Funkcje

- **Przywraca zablokowane regionalnie strony aplikacji** — anonimowe ponowne pobranie gościa, a następnie przeniesienie prawdziwego układu sklepu do aktywnego dokumentu (pełne przepisanie dokumentu tylko jako rozwiązanie awaryjne)
- **Zachowuje sesję bez zmian** — kontrolki listy życzeń, obserwowania i ignorowania dla zalogowanych użytkowników nadal działają po przeniesieniu
- **Automatyczne obejście lub ręczna propozycja** — natychmiastowe uruchomienie na zablokowanych stronach albo najpierw wyświetlenie propozycji
- **Podpowiedzi wyszukiwania gościa** — domyślnie włączone: anonimowe podpowiedzi w nagłówku sklepu, z wyróżnionymi zapisanymi zablokowanymi grami
- **Strona gościa `/search`** — opcjonalne anonimowe ponowne pobranie i wstrzyknięcie wyników wyszukiwania
- **Rejestr zablokowanych gier** — zapamiętuje regionalnie zablokowane identyfikatory aplikacji i potrafi wykrywać je automatycznie podczas sondowania wyników wyszukiwania
- **Sterowanie cache** — wskaźnik użycia, TTL i limit wpisów, przełączniki dla poszczególnych źródeł oraz przeglądarka zbuforowanych stron
- **Bramka proxy** — opcjonalny przekaźnik HTTP dla blokad opartych na IP ([konfiguracja](docs/ARCHITECTURE.md#proxy-gateway))
- **Panel ustawień w stylu Steam** — zakładki Ogólne / Szukaj / Cache / Proxy / O skrypcie, edycja szkicu, Zapisz oraz Zapisz i przeładuj
- **10 języków interfejsu** — angielski, rosyjski, chiński, hiszpański, portugalski (Brazylia), niemiecki, francuski, japoński, koreański, polski

## Obsługiwane strony

| Witryna | Wzorzec URL | Uwagi |
|------|-------------|-------|
| Sklep Steam (aplikacje) | `https://store.steampowered.com/app/{id}/…` | Obejście błędu regionu (główne zastosowanie) |
| Sklep Steam (wyszukiwanie) | Wyszukiwanie w nagłówku + `https://store.steampowered.com/search/?term=…` | **Podpowiedzi wyszukiwania gościa** i opcjonalna **strona gościa /search** w Region Bypass → Szukaj |

Strony aplikacji działają, gdy Steam wyświetla **„This item is currently unavailable in your region”** (ten przedmiot nie jest obecnie dostępny w Twoim regionie) — na przykład **Call of Duty: Modern Warfare 4** w ograniczonych regionach. Podpowiedzi wyszukiwania gościa są domyślnie włączone dla paska wyszukiwania w nagłówku; strona gościa `/search` jest opcjonalna w **Region Bypass → Szukaj**. Oba rozwiązania korzystają z tego samego anonimowego stosu żądań (proxy / `cc` / cache). Zapisane identyfikatory zablokowanych aplikacji można wyróżniać w wynikach wyszukiwania.

## Dla deweloperów

Ta sekcja została przeniesiona do osobnych przewodników:

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — budowanie, testowanie lokalne, wydawanie, bramka
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — jak działa obejście, struktura repozytorium, metadane, uprawnienia, dokumentacja ustawień
- [CONTRIBUTING.md](CONTRIBUTING.md) — przepływ pracy współtwórcy i lista kontrolna PR
- [AGENTS.md](AGENTS.md) — instrukcje dla agentów kodowania AI
- [SECURITY.md](SECURITY.md) — polityka bezpieczeństwa i prywatne zgłaszanie
- [DESIGN.md](DESIGN.md) — język wizualny i reguły tokenów CSS

## Inne userskrypty

Inne userskrypty tego samego autora:

| Userscript | Co robi |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Pełny panel ustawień i tłumaczenie na stronie dla treści Steam Store i Steam Community — opisy gier, recenzje, komentarze profilu, aktualności i poradniki |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | Dodaje dane [GameStatus.info](https://gamestatus.info) do Steam — ochronę, daty wydania, oceny i specyfikację sprzętową na kartach i stronach gier |

## Zastrzeżenie

Ten projekt **nie jest powiązany** z Valve ani Steam. Obejście ograniczeń geograficznych może naruszać [Umowę subskrybenta Steam](https://store.steampowered.com/subscriber_agreement/). Używaj na własne ryzyko. Skrypt służy do **przeglądania** informacji o sklepie, które Steam już udostępnia anonimowym odwiedzającym; nie kupuje ani nie aktywuje produktów.

## Licencja

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
