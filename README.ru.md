# Steam Region Block Bypass

[English](README.md) · **Русский** · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Установить userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

Пользовательский скрипт для магазина Steam, который восстанавливает **заблокированные страницы товаров** и добавляет необязательный **гостевой поиск** — анонимные поисковые подсказки в шапке и включаемую отдельно гостевую страницу `/search`, без cookies аккаунта.

Скрипт повторно запрашивает URL приложений **без cookies аккаунта** (гостевой просмотр), переносит настоящую вёрстку магазина в текущий документ и восстанавливает элементы вишлиста, подписки и игнорирования для авторизованных пользователей после переноса. **Гостевые поисковые подсказки** включены по умолчанию; полный гостевой режим **страницы `/search`** выключен по умолчанию (включается в Region Bypass → Поиск). Для блокировок по IP необязательный **proxy gateway** можно настроить в панели в стиле Steam (меню аккаунта → Настройки Region Bypass).

Совместим с [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat и другими менеджерами, поддерживающими блок метаданных `// ==UserScript==`.

## Скриншоты

Настоящий userscript на живой странице магазина Steam.

![Панель настроек Region Bypass со страницами «Основные», «Поиск», «Кэш», «Прокси» и «О скрипте»](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![Основные — язык интерфейса, режим обхода, страна магазина, toast-уведомления](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**Основные** — язык интерфейса, авто/ручной обход, баннер, страна магазина, toast-уведомления | ![Поиск — гостевые подсказки, включаемая страница /search, реестр заблокированных игр, автопроверка](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**Поиск** — гостевые подсказки, включаемая страница `/search`, реестр заблокированных игр, автопроверка |
| ![Кэш — индикатор использования, TTL, лимит записей, кэширование по источникам, список заблокированных](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**Кэш** — индикатор использования, TTL, лимит записей, кэширование по источникам, список заблокированных | ![Proxy gateway — режим URL, хост/порт, опциональная HTTP Basic-аутентификация](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**Proxy gateway** — режим URL, хост/порт, опциональная HTTP Basic-аутентификация |

Гостевые поисковые подсказки в шапке магазина — **Call of Duty: Modern Warfare 4** помечена как **заблокированная в регионе**, остальные результаты доступны:

![Гостевые поисковые подсказки по запросу Call of Duty: Modern Warfare 4 в шапке Steam с меткой «Region blocked»](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## Быстрая установка

1. Установите менеджер пользовательских скриптов (рекомендуются Tampermonkey или Violentmonkey).
2. Нажмите ссылку установки ниже — менеджер должен открыть окно установки.

**URL установки:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![Установить](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### Установка по URL (панель управления)

| Менеджер | Путь |
|---------|------|
| Tampermonkey | Панель управления → **Утилиты** → **Установить по URL** |
| Violentmonkey | Панель управления → **+** → **Установить по URL** |
| Greasemonkey | Меню дополнения → **Новый пользовательский скрипт** → вставьте прямой URL |

Вставьте [URL установки](#быстрая-установка), указанный выше.

### Ручная установка

1. Откройте [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js) в этом репозитории.
2. Скопируйте всё содержимое файла.
3. В менеджере пользовательских скриптов создайте новый скрипт и вставьте код.
4. Сохраните и включите скрипт.

## Обновления

Скрипт содержит метаданные `@updateURL` и `@downloadURL`, указывающие на прямой файл GitHub, поэтому поддерживаемые менеджеры проверяют обновления автоматически. Процесс выпуска описан в [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing).

## Возможности

- **Восстанавливает страницы приложений, заблокированные по региону** — анонимный гостевой запрос, затем настоящая вёрстка магазина переносится в текущий документ (полная перезапись документа — только как резервный вариант)
- **Сохраняет сессию** — элементы вишлиста, подписки и игнорирования для авторизованных пользователей продолжают работать после переноса
- **Автообход или ручное предложение** — запуск сразу на заблокированных страницах или сначала показ предложения
- **Гостевые поисковые подсказки** — включены по умолчанию: анонимные подсказки в шапке магазина с подсветкой сохранённых заблокированных игр
- **Гостевая страница `/search`** — включаемые отдельно анонимный повторный запрос и внедрение результатов поиска
- **Реестр заблокированных игр** — запоминает ID приложений с региональной блокировкой и может автоматически определять их при проверке результатов поиска
- **Управление кэшем** — индикатор использования, TTL и лимит записей, переключатели по источникам и просмотр кэшированных страниц
- **Proxy gateway** — необязательный HTTP-релей для блокировок по IP ([настройка](docs/ARCHITECTURE.md#proxy-gateway))
- **Панель настроек в стиле Steam** — страницы «Основные» / «Поиск» / «Кэш» / «Прокси» / «О скрипте», редактирование черновика, «Сохранить» и «Сохранить и перезагрузить»
- **10 языков интерфейса** — английский, русский, китайский, испанский, португальский (Бразилия), немецкий, французский, японский, корейский, польский

## Поддерживаемые страницы

| Сайт | Шаблон URL | Примечания |
|------|-------------|-------|
| Магазин Steam (приложения) | `https://store.steampowered.com/app/{id}/…` | Обход региональной ошибки (основной сценарий) |
| Магазин Steam (поиск) | Поиск в шапке + `https://store.steampowered.com/search/?term=…` | **Гостевые поисковые подсказки** и необязательная **гостевая страница /search** в Region Bypass → Поиск |

Страницы приложений работают, когда Steam показывает **«This item is currently unavailable in your region»** (сообщение о недоступности в вашем регионе) — например, **Call of Duty: Modern Warfare 4** в ограниченных регионах. **Гостевые поисковые подсказки** включены по умолчанию для строки поиска в шапке. Гостевой повторный запрос для полной страницы `/search` **выключен по умолчанию** (тот же стек анонимных гостевых запросов: прокси / `cc` / кэш) — включите его в **Region Bypass → Поиск**. Сохранённые ID заблокированных приложений можно подсвечивать в результатах поиска.

## Для разработчиков

Этот раздел переехал в отдельные руководства:

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — сборка, локальное тестирование, выпуск релизов, шлюз
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — как работает обход, структура репозитория, метаданные, разрешения, справочник настроек
- [CONTRIBUTING.md](CONTRIBUTING.md) — процесс для контрибьюторов и чек-лист PR
- [AGENTS.md](AGENTS.md) — инструкции для ИИ-агентов по программированию
- [SECURITY.md](SECURITY.md) — политика безопасности и приватное сообщение об уязвимостях
- [DESIGN.md](DESIGN.md) — визуальный язык и правила CSS-токенов

## Другие юзерскрипты

Другие юзерскрипты того же автора:

| Юзерскрипт | Что делает |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Полная панель настроек и перевод на странице для контента Steam Store и Steam Community — описаний игр, обзоров, комментариев в профилях, новостей и руководств |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | Добавляет данные [GameStatus.info](https://gamestatus.info) в Steam — защита, даты выхода, оценки и системные требования на карточках игр и страницах |

## Отказ от ответственности

Этот проект **не связан** с Valve или Steam. Обход географических ограничений может нарушать [Соглашение подписчика Steam](https://store.steampowered.com/subscriber_agreement/). Используйте на свой риск. Скрипт предназначен для **просмотра** информации магазина, которую Steam уже отдаёт анонимным посетителям; он не покупает и не активирует продукты.

## Лицензия

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
