// ==UserScript==
// @name              Steam Region Block Bypass
// @name:ru           Steam Region Block Bypass — обход региональной блокировки
// @name:zh-CN        Steam Region Block Bypass — 区域限制绕过
// @name:es           Steam Region Block Bypass — bypass de región
// @name:pt-BR        Steam Region Block Bypass — bypass de região
// @name:de           Steam Region Block Bypass — Regionsperre umgehen
// @name:fr           Steam Region Block Bypass — contournement régional
// @name:ja           Steam Region Block Bypass — 地域制限バイパス
// @name:ko           Steam Region Block Bypass — 지역 제한 우회
// @name:pl           Steam Region Block Bypass — obejście blokady regionu
// @namespace         https://github.com/NemoKing1210/steam-region-block-bypass
// @version           1.16.3
// @description       View region-blocked Steam store pages and guest search via anonymous fetch (no account cookies); optional proxy gateway
// @description:ru    Просмотр заблокированных страниц и гостевой поиск Steam без cookies аккаунта; опциональный proxy gateway
// @description:zh-CN 通过无账号 Cookie 查看区域限制页面及访客搜索 Steam 商店；可选代理网关
// @description:es    Muestra páginas bloqueadas y búsqueda invitado en Steam sin cookies de cuenta; gateway proxy opcional
// @description:pt-BR  Mostra páginas bloqueadas e busca convidado na Steam sem cookies da conta; gateway proxy opcional
// @description:de     Zeigt gesperrte Store-Seiten und Gast-Suche ohne Account-Cookies; optionaler Proxy-Gateway
// @description:fr     Affiche les pages bloquées et la recherche invité Steam sans cookies de compte; gateway proxy optionnel
// @description:ja     地域制限ページとゲスト検索をアカウントCookieなしで表示。任意のプロキシゲートウェイ
// @description:ko     지역 제한 페이지와 게스트 검색을 계정 쿠키 없이 표시. 선택적 프록시 게이트웨이
// @description:pl     Pokazuje zablokowane strony i wyszukiwanie gościa w Sklepie Steam bez cookies konta; opcjonalny gateway proxy
// @author             NemoKing1210
// @tag                steam
// @tag                store
// @homepageURL        https://github.com/NemoKing1210/steam-region-block-bypass
// @supportURL         https://github.com/NemoKing1210/steam-region-block-bypass/issues
// @updateURL          https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
// @downloadURL        https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
// @license            MIT
// @icon               https://store.steampowered.com/favicon.ico
// @match              https://store.steampowered.com/*
// @grant              GM_xmlhttpRequest
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM_addStyle
// @grant              GM_registerMenuCommand
// @connect            store.steampowered.com
// @connect            *
// @run-at             document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'srbb_settings';
  const CACHE_STORAGE_KEY = 'srbb_page_cache';
  const BLOCKED_APPS_STORAGE_KEY = 'srbb_blocked_apps';
  /** One-time upgrade: guest search used to default off */
  const SEARCH_DEFAULT_ON_FLAG = 'srbb_migrated_search_default_on_v1';
  /** Soft cap so GM storage does not grow without bound */
  const CACHE_MAX_ENTRIES = 30;
  const BLOCKED_APPS_MAX_ENTRIES = 500;
  const PROBE_CONCURRENCY_MAX = 5;
  /** How many guest suggest rows to fetch/show from /search/results */
  const SUGGEST_RESULT_COUNT = 25;
  /** Upper bound for the settings field (7 days) */
  const CACHE_MINUTES_MAX = 10080;
  const DEFAULT_SETTINGS = {
    proxyEnabled: false,
    proxyHost: '',
    proxyPort: '',
    proxyUser: '',
    proxyPass: '',
    /** gateway | path | query */
    proxyMode: 'gateway',
    countryCode: '',
    autoBypass: true, // true = replace immediately; false = show button
    /** Guest HTML TTL in minutes; 0 disables caching */
    cacheMinutes: 60,
    /** Guest search: anonymous suggest dropdown in the header */
    searchUnblocked: true,
    /** Guest /search page: anonymous refetch + inject (opt-in; off by default) */
    searchPageUnblocked: false,
    /** Remember app IDs when Steam shows a region block */
    rememberBlockedApps: true,
    /** Highlight remembered blocked apps in guest search */
    markBlockedInSearch: true,
    /** Probe search results with account cookies to detect region locks */
    probeBlockedInSearch: true,
    /** suggest | search | both */
    probeBlockedScope: 'both',
    /** Parallel account probes (1–5) */
    probeBlockedConcurrency: 3,
  };

  const SUPPORTED_LOCALES = ['en', 'ru', 'zh-CN', 'es', 'pt-BR', 'de', 'fr', 'ja', 'ko', 'pl'];

  /** UI locale → Steam store language cookie / `?l=` value */
  const STEAM_LANG_BY_LOCALE = {
    en: 'english',
    ru: 'russian',
    'zh-CN': 'schinese',
    es: 'spanish',
    'pt-BR': 'brazilian',
    de: 'german',
    fr: 'french',
    ja: 'japanese',
    ko: 'koreana',
    pl: 'polish',
  };

  /** Steam_Language → Accept-Language header */
  const ACCEPT_LANG_BY_STEAM = {
    english: 'en-US,en;q=0.9',
    russian: 'ru-RU,ru;q=0.9,en;q=0.8',
    schinese: 'zh-CN,zh;q=0.9,en;q=0.8',
    tchinese: 'zh-TW,zh;q=0.9,en;q=0.8',
    spanish: 'es-ES,es;q=0.9,en;q=0.8',
    latam: 'es-419,es;q=0.9,en;q=0.8',
    brazilian: 'pt-BR,pt;q=0.9,en;q=0.8',
    portuguese: 'pt-PT,pt;q=0.9,en;q=0.8',
    german: 'de-DE,de;q=0.9,en;q=0.8',
    french: 'fr-FR,fr;q=0.9,en;q=0.8',
    japanese: 'ja-JP,ja;q=0.9,en;q=0.8',
    koreana: 'ko-KR,ko;q=0.9,en;q=0.8',
    polish: 'pl-PL,pl;q=0.9,en;q=0.8',
    italian: 'it-IT,it;q=0.9,en;q=0.8',
    dutch: 'nl-NL,nl;q=0.9,en;q=0.8',
    turkish: 'tr-TR,tr;q=0.9,en;q=0.8',
    thai: 'th-TH,th;q=0.9,en;q=0.8',
    ukrainian: 'uk-UA,uk;q=0.9,en;q=0.8',
    vietnamese: 'vi-VN,vi;q=0.9,en;q=0.8',
    indonesian: 'id-ID,id;q=0.9,en;q=0.8',
  };

  const MESSAGES = {
    en: {
      menuSettings: 'Steam Region Bypass — Settings',
      loading: 'Loading store page without account cookies…',
      stillBlockedProxy:
        'Still blocked. Proxy IP is likely in a restricted region — try another exit node.',
      stillBlockedNoProxy:
        'Still blocked by IP/region. Enable a proxy gateway in settings and point it to an unrestricted region.',
      ageGate:
        'Steam returned an age gate. Retry — birthtime cookies are sent automatically; if it persists, open the app once and confirm age.',
      noContent: 'Fetched page had no store content. Check proxy settings or try again.',
      failedLoad: 'Failed to load: {error}',
      networkError: 'Network error',
      requestTimeout: 'Request timed out',
      retry: 'Retry',
      settings: 'Settings',
      badge: 'Region Bypass',
      bannerBlockedBadge: 'Region blocked',
      bannerTitle: 'This game is unavailable in your region',
      bannerBody: 'Store page is shown via anonymous guest fetch (no account cookies)',
      viaProxy: 'via proxy gateway',
      viaCache: 'from cache',
      reload: 'Reload',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: 'Proxy gateway ON',
      proxyOff: 'Proxy gateway OFF',
      panelTitle: 'Region Bypass',
      panelSubtitle: 'Anonymous store fetch · optional proxy gateway',
      tabGeneral: 'General',
      tabSearch: 'Search',
      tabProxy: 'Proxy',
      close: 'Close',
      bypassTrigger: 'On blocked pages',
      bypassTriggerAuto: 'Replace page automatically',
      bypassTriggerButton: 'Show a button to replace',
      bypassTriggerHint:
        'Automatic mode replaces the Oops page immediately. Button mode keeps the error page and adds a control to start the bypass.',
      bypassOffer: 'This page is blocked in your region. Load the store page without account cookies?',
      bypassNow: 'Show store page',
      storeCountry: 'Store country (cc)',
      storeCountryHint: 'Optional Steam store country override for guest requests.',
      cacheMinutes: 'Cache duration (minutes)',
      cacheMinutesHint:
        'How long to reuse a successful guest page before refetching. 0 disables cache. Reload always fetches fresh.',
      searchUnblocked: 'Guest search suggestions',
      searchUnblockedHint:
        'Header search suggestions are fetched without account cookies (same guest stack as app bypass). On by default.',
      searchPageUnblocked: 'Guest /search page',
      searchPageUnblockedHint:
        'Replace Steam /search results with an anonymous guest fetch. Off by default — enable if you need region-blocked titles on the full search page.',
      suggestGuestNotice:
        'Region Bypass guest search is on — results load without account cookies and can show region-blocked titles.',
      suggestGuestSettings: 'Disable in Settings → Search',
      suggestEmpty: 'Type to search the store as a guest (no account cookies)',
      suggestLoading: 'Searching…',
      suggestFailed: 'Search suggestions failed: {error}',
      suggestNoResults: 'No results',
      suggestTypeGame: 'Game',
      suggestTypeApp: 'App',
      suggestTypeSoftware: 'Software',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: 'Bundle',
      suggestFree: 'Free',
      suggestControllerFull: 'Full controller',
      suggestControllerPartial: 'Partial controller',
      suggestAppId: 'App ID {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: 'Region blocked',
      rememberBlockedApps: 'Remember blocked games',
      rememberBlockedAppsHint:
        'When Steam shows a region error on an app page, save its ID locally for guest-search highlights.',
      markBlockedInSearch: 'Highlight blocked in search',
      markBlockedInSearchHint: 'Show a region-blocked badge on saved games in guest search results.',
      probeBlockedInSearch: 'Auto-detect blocked in search',
      probeBlockedInSearchHint:
        'After guest search renders, open each app page with your Steam cookies. Region-locked games are added to the blocked list. Requires being signed in.',
      probeBlockedScope: 'Check in',
      probeBlockedScopeBoth: 'Suggestions and search page',
      probeBlockedScopeSuggest: 'Suggestions only',
      probeBlockedScopeSearch: 'Search page only',
      probeBlockedConcurrency: 'Parallel checks',
      probeBlockedConcurrencyHint: 'How many app pages to probe at once (lower is gentler on Steam).',
      probeProgress: 'Checking region locks… {done}/{total}',
      probeFound: 'Added {count} blocked game(s)',
      probeNeedLogin: 'Sign in to Steam to auto-detect blocked games.',
      probeNeedRemember: 'Turn on “Remember blocked games” to save auto-detected apps.',
      blockedAppsCount: '{count} blocked games saved',
      viewBlockedApps: 'View list',
      hideBlockedApps: 'Hide list',
      blockedAppsEmpty: 'No blocked games saved yet.',
      blockedAppUntitled: 'App {id}',
      clearBlockedApps: 'Clear list',
      searchPageLoading: 'Loading search results without account cookies…',
      searchPageBanner: 'Guest search via Region Bypass (anonymous fetch)',
      searchPageBannerSettings: 'Settings',
      searchPageNoContent: 'No search results in guest response. Check proxy or try again.',
      useProxy: 'Use proxy gateway',
      on: 'ON',
      off: 'OFF',
      gatewayMode: 'Gateway mode',
      host: 'Host',
      port: 'Port',
      username: 'Username',
      password: 'Password',
      optional: 'optional',
      proxyHint:
        'Userscripts cannot set a system SOCKS/HTTP proxy. Point these fields at a local/remote HTTP gateway that fetches URLs from another region (for example a small CORS proxy behind your VPN).',
      cancel: 'Cancel',
      save: 'Save',
      saveReload: 'Save & Reload page',
    },
    ru: {
      menuSettings: 'Steam Region Bypass — Настройки',
      loading: 'Загрузка страницы магазина без cookies аккаунта…',
      stillBlockedProxy:
        'Всё ещё заблокировано. IP прокси, вероятно, в ограниченном регионе — попробуйте другой выходной узел.',
      stillBlockedNoProxy:
        'Всё ещё заблокировано по IP/региону. Включите proxy gateway в настройках и направьте его в неограниченный регион.',
      ageGate:
        'Steam вернул проверку возраста. Повторите — cookies birthtime отправляются автоматически; если не поможет, откройте приложение один раз и подтвердите возраст.',
      noContent:
        'В загруженной странице нет контента магазина. Проверьте настройки прокси или попробуйте снова.',
      failedLoad: 'Не удалось загрузить: {error}',
      networkError: 'Ошибка сети',
      requestTimeout: 'Время запроса истекло',
      retry: 'Повторить',
      settings: 'Настройки',
      badge: 'Region Bypass',
      bannerBlockedBadge: 'Регион заблокирован',
      bannerTitle: 'Эта игра недоступна в вашем регионе',
      bannerBody: 'Страница магазина показана через анонимный гостевой запрос (без cookies аккаунта)',
      viaProxy: 'через proxy gateway',
      viaCache: 'из кеша',
      reload: 'Обновить',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: 'Proxy gateway ВКЛ',
      proxyOff: 'Proxy gateway ВЫКЛ',
      panelTitle: 'Region Bypass',
      panelSubtitle: 'Анонимный запрос магазина · опциональный proxy gateway',
      tabGeneral: 'Основные',
      tabSearch: 'Поиск',
      tabProxy: 'Прокси',
      close: 'Закрыть',
      bypassTrigger: 'На заблокированных страницах',
      bypassTriggerAuto: 'Сразу заменять страницу',
      bypassTriggerButton: 'Показать кнопку для замены',
      bypassTriggerHint:
        'Автоматический режим сразу заменяет страницу Oops. Режим с кнопкой оставляет ошибку и добавляет кнопку запуска обхода.',
      bypassOffer: 'Страница недоступна в вашем регионе. Загрузить страницу магазина без cookies аккаунта?',
      bypassNow: 'Показать страницу магазина',
      storeCountry: 'Страна магазина (cc)',
      storeCountryHint: 'Необязательная подмена страны магазина Steam для гостевых запросов.',
      cacheMinutes: 'Время кеша (минуты)',
      cacheMinutesHint:
        'Как долго повторно использовать успешно загруженную гостевую страницу. 0 отключает кеш. «Обновить» всегда запрашивает заново.',
      searchUnblocked: 'Гостевые подсказки поиска',
      searchUnblockedHint:
        'Подсказки в шапке запрашиваются без cookies аккаунта (тот же гостевой стек, что и для страниц приложений). Включены по умолчанию.',
      searchPageUnblocked: 'Гостевая страница /search',
      searchPageUnblockedHint:
        'Подменяет результаты Steam /search анонимным гостевым запросом. Выключено по умолчанию — включите, если нужны регионально заблокированные игры на полной странице поиска.',
      suggestGuestNotice:
        'Включён гостевой поиск Region Bypass — результаты без cookies аккаунта, видны и регионально заблокированные игры.',
      suggestGuestSettings: 'Отключить: Настройки → Поиск',
      suggestEmpty: 'Введите запрос для гостевого поиска (без cookies аккаунта)',
      suggestLoading: 'Поиск…',
      suggestFailed: 'Не удалось загрузить подсказки: {error}',
      suggestNoResults: 'Ничего не найдено',
      suggestTypeGame: 'Игра',
      suggestTypeApp: 'Приложение',
      suggestTypeSoftware: 'Софт',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: 'Набор',
      suggestFree: 'Бесплатно',
      suggestControllerFull: 'Полная поддержка геймпада',
      suggestControllerPartial: 'Частичная поддержка геймпада',
      suggestAppId: 'ID приложения {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: 'Регион заблокирован',
      rememberBlockedApps: 'Запоминать заблокированные игры',
      rememberBlockedAppsHint:
        'При ошибке региона на странице приложения сохранять её ID локально для подсветки в гостевом поиске.',
      markBlockedInSearch: 'Подсвечивать в поиске',
      markBlockedInSearchHint: 'Показывать метку «регион заблокирован» у сохранённых игр в гостевом поиске.',
      probeBlockedInSearch: 'Автодетект блокировок в поиске',
      probeBlockedInSearchHint:
        'После отрисовки гостевого поиска открывает страницы приложений с вашими cookies Steam. Игры с региональной блокировкой добавляются в список. Нужен вход в аккаунт.',
      probeBlockedScope: 'Где проверять',
      probeBlockedScopeBoth: 'Подсказки и страница поиска',
      probeBlockedScopeSuggest: 'Только подсказки',
      probeBlockedScopeSearch: 'Только страница поиска',
      probeBlockedConcurrency: 'Параллельные проверки',
      probeBlockedConcurrencyHint: 'Сколько страниц приложений проверять одновременно (меньше — мягче для Steam).',
      probeProgress: 'Проверка региональных блокировок… {done}/{total}',
      probeFound: 'Добавлено заблокированных: {count}',
      probeNeedLogin: 'Войдите в Steam, чтобы автоматически находить заблокированные игры.',
      probeNeedRemember: 'Включите «Запоминать заблокированные игры», чтобы сохранять найденные.',
      blockedAppsCount: 'Сохранено заблокированных игр: {count}',
      viewBlockedApps: 'Посмотреть',
      hideBlockedApps: 'Скрыть',
      blockedAppsEmpty: 'Пока нет сохранённых заблокированных игр.',
      blockedAppUntitled: 'Приложение {id}',
      clearBlockedApps: 'Очистить список',
      searchPageLoading: 'Загрузка результатов поиска без cookies аккаунта…',
      searchPageBanner: 'Гостевой поиск Region Bypass (анонимный запрос)',
      searchPageBannerSettings: 'Настройки',
      searchPageNoContent: 'В гостевом ответе нет результатов. Проверьте прокси или попробуйте снова.',
      useProxy: 'Использовать proxy gateway',
      on: 'ВКЛ',
      off: 'ВЫКЛ',
      gatewayMode: 'Режим gateway',
      host: 'Хост',
      port: 'Порт',
      username: 'Имя пользователя',
      password: 'Пароль',
      optional: 'необязательно',
      proxyHint:
        'Userscripts не могут задать системный SOCKS/HTTP-прокси. Укажите локальный или удалённый HTTP-gateway, который загружает URL из другого региона (например, небольшой CORS-прокси за VPN).',
      cancel: 'Отмена',
      save: 'Сохранить',
      saveReload: 'Сохранить и перезагрузить',
    },
    'zh-CN': {
      menuSettings: 'Steam Region Bypass — 设置',
      loading: '正在以无账号 Cookie 的方式加载商店页面…',
      stillBlockedProxy: '仍然被封锁。代理 IP 可能位于受限地区 — 请尝试其他出口节点。',
      stillBlockedNoProxy: '仍被 IP/地区封锁。请在设置中启用代理网关，并将其指向不受限地区。',
      ageGate:
        'Steam 返回了年龄验证。请重试 — birthtime Cookie 会自动发送；若仍出现，请先打开一次应用并确认年龄。',
      noContent: '获取的页面没有商店内容。请检查代理设置或重试。',
      failedLoad: '加载失败：{error}',
      networkError: '网络错误',
      requestTimeout: '请求超时',
      retry: '重试',
      settings: '设置',
      badge: 'Region Bypass',
      bannerBlockedBadge: '地区限制',
      bannerTitle: '此游戏在您所在地区不可用',
      bannerBody: '商店页面通过匿名访客请求显示（无账号 Cookie）',
      viaProxy: '经由代理网关',
      viaCache: '来自缓存',
      reload: '重新加载',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: '代理网关 开',
      proxyOff: '代理网关 关',
      panelTitle: 'Region Bypass',
      panelSubtitle: '匿名商店请求 · 可选代理网关',
      tabGeneral: '常规',
      tabSearch: '搜索',
      tabProxy: '代理',
      close: '关闭',
      bypassTrigger: '在被封锁的页面上',
      bypassTriggerAuto: '自动替换页面',
      bypassTriggerButton: '显示替换按钮',
      bypassTriggerHint: '自动模式会立即替换 Oops 页面。按钮模式保留错误页，并添加用于启动绕过的控件。',
      bypassOffer: '此页面在您所在地区被封锁。是否以无账号 Cookie 的方式加载商店页面？',
      bypassNow: '显示商店页面',
      storeCountry: '商店国家/地区 (cc)',
      storeCountryHint: '可选：覆盖访客请求的 Steam 商店国家/地区。',
      cacheMinutes: '缓存时长（分钟）',
      cacheMinutesHint: '成功的访客页面在重新请求前可复用多久。0 禁用缓存。「重新加载」始终获取最新内容。',
      searchUnblocked: '访客搜索建议',
      searchUnblockedHint: '顶栏搜索建议以无账号 Cookie 的方式获取（与应用绕过相同的访客栈）。默认开启。',
      searchPageUnblocked: '访客 /search 页面',
      searchPageUnblockedHint: '用匿名访客请求替换 Steam /search 结果。默认关闭 — 若需要在完整搜索页看到地区受限游戏，请开启。',
      suggestGuestNotice: '已启用 Region Bypass 访客搜索 — 结果不带账号 Cookie，可显示地区受限游戏。',
      suggestGuestSettings: '在“设置 → 搜索”中关闭',
      suggestEmpty: '输入关键词以访客身份搜索商店（无账号 Cookie）',
      suggestLoading: '搜索中…',
      suggestFailed: '搜索建议加载失败：{error}',
      suggestNoResults: '无结果',
      suggestTypeGame: '游戏',
      suggestTypeApp: '应用',
      suggestTypeSoftware: '软件',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: '捆绑包',
      suggestFree: '免费',
      suggestControllerFull: '完整手柄支持',
      suggestControllerPartial: '部分手柄支持',
      suggestAppId: '应用 ID {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: '地区限制',
      rememberBlockedApps: '记住被封锁的游戏',
      rememberBlockedAppsHint: '当 Steam 在应用页显示区域错误时，本地保存其 ID，以便在访客搜索中高亮。',
      markBlockedInSearch: '在搜索中高亮',
      markBlockedInSearchHint: '在访客搜索结果中为已保存的游戏显示“地区限制”标记。',
      probeBlockedInSearch: '自动检测搜索中的封锁',
      probeBlockedInSearchHint:
        '访客搜索渲染后，用您的 Steam Cookie 打开各应用页。区域受限游戏会加入封锁列表。需要已登录。',
      probeBlockedScope: '检查范围',
      probeBlockedScopeBoth: '建议与搜索页',
      probeBlockedScopeSuggest: '仅建议',
      probeBlockedScopeSearch: '仅搜索页',
      probeBlockedConcurrency: '并行检查数',
      probeBlockedConcurrencyHint: '同时探测的应用页数量（越小对 Steam 越温和）。',
      probeProgress: '正在检查区域限制… {done}/{total}',
      probeFound: '已添加 {count} 个封锁游戏',
      probeNeedLogin: '请登录 Steam 以自动检测封锁游戏。',
      probeNeedRemember: '请开启“记住被封锁的游戏”以保存自动检测结果。',
      blockedAppsCount: '已保存 {count} 个被封锁游戏',
      viewBlockedApps: '查看列表',
      hideBlockedApps: '隐藏列表',
      blockedAppsEmpty: '尚未保存被封锁的游戏。',
      blockedAppUntitled: '应用 {id}',
      clearBlockedApps: '清空列表',
      searchPageLoading: '正在以无账号 Cookie 加载搜索结果…',
      searchPageBanner: '访客搜索（Region Bypass，匿名请求）',
      searchPageBannerSettings: '设置',
      searchPageNoContent: '访客响应中没有搜索结果。请检查代理或重试。',
      useProxy: '使用代理网关',
      on: '开',
      off: '关',
      gatewayMode: '网关模式',
      host: '主机',
      port: '端口',
      username: '用户名',
      password: '密码',
      optional: '可选',
      proxyHint:
        '用户脚本无法设置系统 SOCKS/HTTP 代理。请将这些字段指向可从其他地区获取 URL 的本地/远程 HTTP 网关（例如位于 VPN 后的小型 CORS 代理）。',
      cancel: '取消',
      save: '保存',
      saveReload: '保存并刷新页面',
    },
    es: {
      menuSettings: 'Steam Region Bypass — Ajustes',
      loading: 'Cargando la página de la tienda sin cookies de cuenta…',
      stillBlockedProxy:
        'Sigue bloqueado. La IP del proxy probablemente está en una región restringida — prueba otro nodo de salida.',
      stillBlockedNoProxy:
        'Sigue bloqueado por IP/región. Activa un proxy gateway en ajustes y apúntalo a una región sin restricciones.',
      ageGate:
        'Steam devolvió una verificación de edad. Reintenta — las cookies birthtime se envían automáticamente; si persiste, abre la app una vez y confirma la edad.',
      noContent:
        'La página obtenida no tenía contenido de la tienda. Revisa los ajustes del proxy o inténtalo de nuevo.',
      failedLoad: 'Error al cargar: {error}',
      networkError: 'Error de red',
      requestTimeout: 'Tiempo de espera agotado',
      retry: 'Reintentar',
      settings: 'Ajustes',
      badge: 'Region Bypass',
      bannerBlockedBadge: 'Región bloqueada',
      bannerTitle: 'Este juego no está disponible en tu región',
      bannerBody: 'La página de la tienda se muestra mediante una petición anónima de invitado (sin cookies de cuenta)',
      viaProxy: 'vía proxy gateway',
      viaCache: 'desde caché',
      reload: 'Recargar',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: 'Proxy gateway ON',
      proxyOff: 'Proxy gateway OFF',
      panelTitle: 'Region Bypass',
      panelSubtitle: 'Petición anónima a la tienda · proxy gateway opcional',
      tabGeneral: 'General',
      tabSearch: 'Búsqueda',
      tabProxy: 'Proxy',
      close: 'Cerrar',
      bypassTrigger: 'En páginas bloqueadas',
      bypassTriggerAuto: 'Reemplazar la página automáticamente',
      bypassTriggerButton: 'Mostrar un botón para reemplazar',
      bypassTriggerHint:
        'El modo automático reemplaza la página Oops de inmediato. El modo botón deja la página de error y añade un control para iniciar el bypass.',
      bypassOffer: 'Esta página está bloqueada en tu región. ¿Cargar la página de la tienda sin cookies de cuenta?',
      bypassNow: 'Mostrar página de la tienda',
      storeCountry: 'País de la tienda (cc)',
      storeCountryHint: 'Anulación opcional del país de la tienda Steam para peticiones de invitado.',
      cacheMinutes: 'Duración de caché (minutos)',
      cacheMinutesHint:
        'Cuánto tiempo reutilizar una página de invitado correcta antes de volver a pedirla. 0 desactiva la caché. Recargar siempre obtiene datos frescos.',
      searchUnblocked: 'Sugerencias de búsqueda invitado',
      searchUnblockedHint:
        'Las sugerencias de la barra se obtienen sin cookies de cuenta (mismo stack invitado que el bypass de apps). Activado por defecto.',
      searchPageUnblocked: 'Página /search invitado',
      searchPageUnblockedHint:
        'Sustituye los resultados de Steam /search por una petición anónima de invitado. Desactivado por defecto — actívalo si necesitas títulos bloqueados por región en la página de búsqueda completa.',
      suggestGuestNotice:
        'La búsqueda invitado de Region Bypass está activa — resultados sin cookies de cuenta; pueden verse títulos bloqueados por región.',
      suggestGuestSettings: 'Desactivar en Ajustes → Búsqueda',
      suggestEmpty: 'Escribe para buscar en la tienda como invitado (sin cookies de cuenta)',
      suggestLoading: 'Buscando…',
      suggestFailed: 'Error al cargar sugerencias: {error}',
      suggestNoResults: 'Sin resultados',
      suggestTypeGame: 'Juego',
      suggestTypeApp: 'App',
      suggestTypeSoftware: 'Software',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: 'Paquete',
      suggestFree: 'Gratis',
      suggestControllerFull: 'Mando completo',
      suggestControllerPartial: 'Mando parcial',
      suggestAppId: 'ID de app {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: 'Región bloqueada',
      rememberBlockedApps: 'Recordar juegos bloqueados',
      rememberBlockedAppsHint:
        'Si Steam muestra un error regional en una app, guarda su ID localmente para resaltarla en la búsqueda invitado.',
      markBlockedInSearch: 'Resaltar en búsqueda',
      markBlockedInSearchHint: 'Muestra una insignia de región bloqueada en juegos guardados en la búsqueda invitado.',
      probeBlockedInSearch: 'Detectar bloqueados en la búsqueda',
      probeBlockedInSearchHint:
        'Tras renderizar la búsqueda invitado, abre cada app con tus cookies de Steam. Las bloqueadas por región se añaden a la lista. Requiere iniciar sesión.',
      probeBlockedScope: 'Comprobar en',
      probeBlockedScopeBoth: 'Sugerencias y página de búsqueda',
      probeBlockedScopeSuggest: 'Solo sugerencias',
      probeBlockedScopeSearch: 'Solo página de búsqueda',
      probeBlockedConcurrency: 'Comprobaciones en paralelo',
      probeBlockedConcurrencyHint: 'Cuántas páginas de app sondear a la vez (menos es más suave con Steam).',
      probeProgress: 'Comprobando bloqueos regionales… {done}/{total}',
      probeFound: 'Añadidos {count} juego(s) bloqueado(s)',
      probeNeedLogin: 'Inicia sesión en Steam para detectar juegos bloqueados automáticamente.',
      probeNeedRemember: 'Activa «Recordar juegos bloqueados» para guardar los detectados.',
      blockedAppsCount: '{count} juegos bloqueados guardados',
      viewBlockedApps: 'Ver lista',
      hideBlockedApps: 'Ocultar lista',
      blockedAppsEmpty: 'Aún no hay juegos bloqueados guardados.',
      blockedAppUntitled: 'App {id}',
      clearBlockedApps: 'Borrar lista',
      searchPageLoading: 'Cargando resultados de búsqueda sin cookies de cuenta…',
      searchPageBanner: 'Búsqueda invitado de Region Bypass (petición anónima)',
      searchPageBannerSettings: 'Ajustes',
      searchPageNoContent: 'No hay resultados en la respuesta invitado. Revisa el proxy o inténtalo de nuevo.',
      useProxy: 'Usar proxy gateway',
      on: 'ON',
      off: 'OFF',
      gatewayMode: 'Modo gateway',
      host: 'Host',
      port: 'Puerto',
      username: 'Usuario',
      password: 'Contraseña',
      optional: 'opcional',
      proxyHint:
        'Los userscripts no pueden configurar un proxy SOCKS/HTTP del sistema. Apunta estos campos a un gateway HTTP local/remoto que obtenga URLs desde otra región (por ejemplo un pequeño proxy CORS detrás de tu VPN).',
      cancel: 'Cancelar',
      save: 'Guardar',
      saveReload: 'Guardar y recargar',
    },
    'pt-BR': {
      menuSettings: 'Steam Region Bypass — Configurações',
      loading: 'Carregando a página da loja sem cookies da conta…',
      stillBlockedProxy:
        'Ainda bloqueado. O IP do proxy provavelmente está em uma região restrita — tente outro nó de saída.',
      stillBlockedNoProxy:
        'Ainda bloqueado por IP/região. Ative um proxy gateway nas configurações e aponte para uma região sem restrições.',
      ageGate:
        'A Steam retornou uma verificação de idade. Tente de novo — cookies birthtime são enviados automaticamente; se persistir, abra o app uma vez e confirme a idade.',
      noContent:
        'A página obtida não tinha conteúdo da loja. Verifique as configurações do proxy ou tente novamente.',
      failedLoad: 'Falha ao carregar: {error}',
      networkError: 'Erro de rede',
      requestTimeout: 'Tempo esgotado',
      retry: 'Tentar de novo',
      settings: 'Configurações',
      badge: 'Region Bypass',
      bannerBlockedBadge: 'Região bloqueada',
      bannerTitle: 'Este jogo não está disponível na sua região',
      bannerBody: 'A página da loja é exibida via requisição anônima de convidado (sem cookies da conta)',
      viaProxy: 'via proxy gateway',
      viaCache: 'do cache',
      reload: 'Recarregar',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: 'Proxy gateway ON',
      proxyOff: 'Proxy gateway OFF',
      panelTitle: 'Region Bypass',
      panelSubtitle: 'Requisição anônima à loja · proxy gateway opcional',
      tabGeneral: 'Geral',
      tabSearch: 'Busca',
      tabProxy: 'Proxy',
      close: 'Fechar',
      bypassTrigger: 'Em páginas bloqueadas',
      bypassTriggerAuto: 'Substituir a página automaticamente',
      bypassTriggerButton: 'Mostrar um botão para substituir',
      bypassTriggerHint:
        'O modo automático substitui a página Oops imediatamente. O modo botão mantém a página de erro e adiciona um controle para iniciar o bypass.',
      bypassOffer: 'Esta página está bloqueada na sua região. Carregar a página da loja sem cookies da conta?',
      bypassNow: 'Mostrar página da loja',
      storeCountry: 'País da loja (cc)',
      storeCountryHint: 'Substituição opcional do país da loja Steam para requisições de convidado.',
      cacheMinutes: 'Duração do cache (minutos)',
      cacheMinutesHint:
        'Por quanto tempo reutilizar uma página de convidado bem-sucedida antes de buscar de novo. 0 desativa o cache. Recarregar sempre busca dados novos.',
      searchUnblocked: 'Sugestões de busca convidado',
      searchUnblockedHint:
        'Sugestões da barra são obtidas sem cookies da conta (mesmo stack convidado do bypass de apps). Ativado por padrão.',
      searchPageUnblocked: 'Página /search convidado',
      searchPageUnblockedHint:
        'Substitui os resultados do Steam /search por uma requisição anônima de convidado. Desativado por padrão — ative se precisar de títulos bloqueados por região na página de busca completa.',
      suggestGuestNotice:
        'Busca convidado do Region Bypass ativa — resultados sem cookies da conta; títulos bloqueados por região podem aparecer.',
      suggestGuestSettings: 'Desativar em Configurações → Busca',
      suggestEmpty: 'Digite para buscar na loja como convidado (sem cookies da conta)',
      suggestLoading: 'Buscando…',
      suggestFailed: 'Falha ao carregar sugestões: {error}',
      suggestNoResults: 'Sem resultados',
      suggestTypeGame: 'Jogo',
      suggestTypeApp: 'App',
      suggestTypeSoftware: 'Software',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: 'Pacote',
      suggestFree: 'Grátis',
      suggestControllerFull: 'Controle total',
      suggestControllerPartial: 'Controle parcial',
      suggestAppId: 'ID do app {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: 'Região bloqueada',
      rememberBlockedApps: 'Lembrar jogos bloqueados',
      rememberBlockedAppsHint:
        'Quando a Steam mostrar erro regional numa app, salva o ID localmente para destacar na busca convidado.',
      markBlockedInSearch: 'Destacar na busca',
      markBlockedInSearchHint: 'Mostra um selo de região bloqueada nos jogos salvos na busca convidado.',
      probeBlockedInSearch: 'Detectar bloqueados na busca',
      probeBlockedInSearchHint:
        'Após renderizar a busca convidado, abre cada app com seus cookies da Steam. Jogos bloqueados por região entram na lista. É preciso estar logado.',
      probeBlockedScope: 'Verificar em',
      probeBlockedScopeBoth: 'Sugestões e página de busca',
      probeBlockedScopeSuggest: 'Somente sugestões',
      probeBlockedScopeSearch: 'Somente página de busca',
      probeBlockedConcurrency: 'Verificações em paralelo',
      probeBlockedConcurrencyHint: 'Quantas páginas de app sondar ao mesmo tempo (menor = mais suave com a Steam).',
      probeProgress: 'Verificando bloqueios regionais… {done}/{total}',
      probeFound: 'Adicionado(s) {count} jogo(s) bloqueado(s)',
      probeNeedLogin: 'Entre na Steam para detectar jogos bloqueados automaticamente.',
      probeNeedRemember: 'Ative «Lembrar jogos bloqueados» para salvar os detectados.',
      blockedAppsCount: '{count} jogos bloqueados salvos',
      viewBlockedApps: 'Ver lista',
      hideBlockedApps: 'Ocultar lista',
      blockedAppsEmpty: 'Nenhum jogo bloqueado salvo ainda.',
      blockedAppUntitled: 'App {id}',
      clearBlockedApps: 'Limpar lista',
      searchPageLoading: 'Carregando resultados da busca sem cookies da conta…',
      searchPageBanner: 'Busca convidado do Region Bypass (requisição anônima)',
      searchPageBannerSettings: 'Configurações',
      searchPageNoContent: 'Sem resultados na resposta convidado. Verifique o proxy ou tente novamente.',
      useProxy: 'Usar proxy gateway',
      on: 'ON',
      off: 'OFF',
      gatewayMode: 'Modo gateway',
      host: 'Host',
      port: 'Porta',
      username: 'Usuário',
      password: 'Senha',
      optional: 'opcional',
      proxyHint:
        'Userscripts não podem definir um proxy SOCKS/HTTP do sistema. Aponte estes campos para um gateway HTTP local/remoto que busque URLs de outra região (por exemplo um pequeno proxy CORS atrás da sua VPN).',
      cancel: 'Cancelar',
      save: 'Salvar',
      saveReload: 'Salvar e recarregar',
    },
    de: {
      menuSettings: 'Steam Region Bypass — Einstellungen',
      loading: 'Store-Seite wird ohne Account-Cookies geladen…',
      stillBlockedProxy:
        'Immer noch gesperrt. Die Proxy-IP liegt wahrscheinlich in einer eingeschränkten Region — anderen Exit-Node versuchen.',
      stillBlockedNoProxy:
        'Immer noch per IP/Region gesperrt. Proxy-Gateway in den Einstellungen aktivieren und auf eine freie Region ausrichten.',
      ageGate:
        'Steam hat eine Altersfreigabe zurückgegeben. Erneut versuchen — birthtime-Cookies werden automatisch gesendet; falls es bleibt, App einmal öffnen und Alter bestätigen.',
      noContent:
        'Abgerufene Seite hatte keinen Store-Inhalt. Proxy-Einstellungen prüfen oder erneut versuchen.',
      failedLoad: 'Laden fehlgeschlagen: {error}',
      networkError: 'Netzwerkfehler',
      requestTimeout: 'Zeitüberschreitung',
      retry: 'Erneut',
      settings: 'Einstellungen',
      badge: 'Region Bypass',
      bannerBlockedBadge: 'Region gesperrt',
      bannerTitle: 'Dieses Spiel ist in deiner Region nicht verfügbar',
      bannerBody: 'Die Store-Seite wird über einen anonymen Gastabruf angezeigt (ohne Account-Cookies)',
      viaProxy: 'über Proxy-Gateway',
      viaCache: 'aus dem Cache',
      reload: 'Neu laden',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: 'Proxy-Gateway AN',
      proxyOff: 'Proxy-Gateway AUS',
      panelTitle: 'Region Bypass',
      panelSubtitle: 'Anonymer Store-Abruf · optionaler Proxy-Gateway',
      tabGeneral: 'Allgemein',
      tabSearch: 'Suche',
      tabProxy: 'Proxy',
      close: 'Schließen',
      bypassTrigger: 'Auf gesperrten Seiten',
      bypassTriggerAuto: 'Seite automatisch ersetzen',
      bypassTriggerButton: 'Schaltfläche zum Ersetzen anzeigen',
      bypassTriggerHint:
        'Der Automatikmodus ersetzt die Oops-Seite sofort. Der Schaltflächenmodus lässt die Fehlerseite und fügt eine Steuerung zum Starten des Bypasses hinzu.',
      bypassOffer: 'Diese Seite ist in deiner Region gesperrt. Store-Seite ohne Account-Cookies laden?',
      bypassNow: 'Store-Seite anzeigen',
      storeCountry: 'Store-Land (cc)',
      storeCountryHint: 'Optionale Überschreibung des Steam-Store-Lands für Gastanfragen.',
      cacheMinutes: 'Cache-Dauer (Minuten)',
      cacheMinutesHint:
        'Wie lange eine erfolgreiche Gastseite wiederverwendet wird, bevor neu geladen wird. 0 deaktiviert den Cache. Neu laden holt immer frische Daten.',
      searchUnblocked: 'Gast-Suchvorschläge',
      searchUnblockedHint:
        'Suchvorschläge in der Kopfzeile werden ohne Account-Cookies abgerufen (gleicher Gast-Stack wie App-Bypass). Standardmäßig aktiv.',
      searchPageUnblocked: 'Gast-/search-Seite',
      searchPageUnblockedHint:
        'Ersetzt Steam-/search-Ergebnisse durch einen anonymen Gastabruf. Standardmäßig aus — aktivieren, wenn regional gesperrte Titel auf der vollständigen Suchseite nötig sind.',
      suggestGuestNotice:
        'Region-Bypass-Gast-Suche ist aktiv — Ergebnisse ohne Account-Cookies; regional gesperrte Titel können erscheinen.',
      suggestGuestSettings: 'Deaktivieren unter Einstellungen → Suche',
      suggestEmpty: 'Tippen, um den Store als Gast zu durchsuchen (ohne Account-Cookies)',
      suggestLoading: 'Suche…',
      suggestFailed: 'Suchvorschläge fehlgeschlagen: {error}',
      suggestNoResults: 'Keine Ergebnisse',
      suggestTypeGame: 'Spiel',
      suggestTypeApp: 'App',
      suggestTypeSoftware: 'Software',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: 'Bundle',
      suggestFree: 'Kostenlos',
      suggestControllerFull: 'Volle Controller-Unterstützung',
      suggestControllerPartial: 'Teilweise Controller-Unterstützung',
      suggestAppId: 'App-ID {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: 'Region gesperrt',
      rememberBlockedApps: 'Gesperrte Spiele merken',
      rememberBlockedAppsHint:
        'Wenn Steam auf einer App-Seite einen Regionsfehler zeigt, ID lokal speichern für Hervorhebung in der Gast-Suche.',
      markBlockedInSearch: 'In Suche hervorheben',
      markBlockedInSearchHint: 'Zeigt ein Regions-gesperrt-Abzeichen für gespeicherte Spiele in der Gast-Suche.',
      probeBlockedInSearch: 'Gesperrte in Suche erkennen',
      probeBlockedInSearchHint:
        'Nach der Gast-Suche werden App-Seiten mit Ihren Steam-Cookies geladen. Regional gesperrte Spiele kommen auf die Liste. Anmeldung erforderlich.',
      probeBlockedScope: 'Prüfen in',
      probeBlockedScopeBoth: 'Vorschläge und Suchseite',
      probeBlockedScopeSuggest: 'Nur Vorschläge',
      probeBlockedScopeSearch: 'Nur Suchseite',
      probeBlockedConcurrency: 'Parallele Prüfungen',
      probeBlockedConcurrencyHint: 'Wie viele App-Seiten gleichzeitig geprüft werden (niedriger = schonender für Steam).',
      probeProgress: 'Regionsperren werden geprüft… {done}/{total}',
      probeFound: '{count} gesperrte(s) Spiel(e) hinzugefügt',
      probeNeedLogin: 'Melden Sie sich bei Steam an, um gesperrte Spiele automatisch zu erkennen.',
      probeNeedRemember: 'Aktivieren Sie „Gesperrte Spiele merken“, um erkannte Apps zu speichern.',
      blockedAppsCount: '{count} gesperrte Spiele gespeichert',
      viewBlockedApps: 'Liste anzeigen',
      hideBlockedApps: 'Liste ausblenden',
      blockedAppsEmpty: 'Noch keine gesperrten Spiele gespeichert.',
      blockedAppUntitled: 'App {id}',
      clearBlockedApps: 'Liste leeren',
      searchPageLoading: 'Suchergebnisse werden ohne Account-Cookies geladen…',
      searchPageBanner: 'Gast-Suche von Region Bypass (anonymer Abruf)',
      searchPageBannerSettings: 'Einstellungen',
      searchPageNoContent: 'Keine Suchergebnisse in der Gastantwort. Proxy prüfen oder erneut versuchen.',
      useProxy: 'Proxy-Gateway verwenden',
      on: 'AN',
      off: 'AUS',
      gatewayMode: 'Gateway-Modus',
      host: 'Host',
      port: 'Port',
      username: 'Benutzername',
      password: 'Passwort',
      optional: 'optional',
      proxyHint:
        'Userscripts können keinen System-SOCKS/HTTP-Proxy setzen. Richte diese Felder auf ein lokales/remotetes HTTP-Gateway, das URLs aus einer anderen Region abruft (z. B. kleiner CORS-Proxy hinter deinem VPN).',
      cancel: 'Abbrechen',
      save: 'Speichern',
      saveReload: 'Speichern & Seite neu laden',
    },
    fr: {
      menuSettings: 'Steam Region Bypass — Paramètres',
      loading: 'Chargement de la page boutique sans cookies de compte…',
      stillBlockedProxy:
        "Toujours bloqué. L'IP du proxy est probablement dans une région restreinte — essayez un autre nœud de sortie.",
      stillBlockedNoProxy:
        'Toujours bloqué par IP/région. Activez un proxy gateway dans les paramètres et pointez-le vers une région non restreinte.',
      ageGate:
        "Steam a renvoyé une vérification d'âge. Réessayez — les cookies birthtime sont envoyés automatiquement ; si cela persiste, ouvrez l'app une fois et confirmez l'âge.",
      noContent:
        "La page récupérée n'avait pas de contenu boutique. Vérifiez les paramètres du proxy ou réessayez.",
      failedLoad: 'Échec du chargement : {error}',
      networkError: 'Erreur réseau',
      requestTimeout: 'Délai dépassé',
      retry: 'Réessayer',
      settings: 'Paramètres',
      badge: 'Region Bypass',
      bannerBlockedBadge: 'Région bloquée',
      bannerTitle: "Ce jeu n'est pas disponible dans votre région",
      bannerBody: 'La page boutique est affichée via une requête anonyme invité (sans cookies de compte)',
      viaProxy: 'via proxy gateway',
      viaCache: 'depuis le cache',
      reload: 'Recharger',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: 'Proxy gateway ON',
      proxyOff: 'Proxy gateway OFF',
      panelTitle: 'Region Bypass',
      panelSubtitle: 'Requête boutique anonyme · proxy gateway optionnel',
      tabGeneral: 'Général',
      tabSearch: 'Recherche',
      tabProxy: 'Proxy',
      close: 'Fermer',
      bypassTrigger: 'Sur les pages bloquées',
      bypassTriggerAuto: 'Remplacer la page automatiquement',
      bypassTriggerButton: 'Afficher un bouton pour remplacer',
      bypassTriggerHint:
        'Le mode automatique remplace immédiatement la page Oops. Le mode bouton conserve la page d’erreur et ajoute un contrôle pour lancer le contournement.',
      bypassOffer: 'Cette page est bloquée dans votre région. Charger la page boutique sans cookies de compte ?',
      bypassNow: 'Afficher la page boutique',
      storeCountry: 'Pays de la boutique (cc)',
      storeCountryHint: 'Remplacement optionnel du pays de la boutique Steam pour les requêtes invité.',
      cacheMinutes: 'Durée du cache (minutes)',
      cacheMinutesHint:
        'Combien de temps réutiliser une page invité réussie avant de la redemander. 0 désactive le cache. Recharger récupère toujours des données fraîches.',
      searchUnblocked: 'Suggestions de recherche invité',
      searchUnblockedHint:
        'Les suggestions de la barre sont récupérées sans cookies de compte (même pile invité que le bypass d’apps). Activé par défaut.',
      searchPageUnblocked: 'Page /search invité',
      searchPageUnblockedHint:
        'Remplace les résultats Steam /search par une requête anonyme invité. Désactivé par défaut — activez si vous avez besoin des titres bloqués par région sur la page de recherche complète.',
      suggestGuestNotice:
        'Recherche invité Region Bypass active — résultats sans cookies de compte ; les titres bloqués par région peuvent apparaître.',
      suggestGuestSettings: 'Désactiver dans Paramètres → Recherche',
      suggestEmpty: 'Tapez pour chercher dans la boutique en invité (sans cookies de compte)',
      suggestLoading: 'Recherche…',
      suggestFailed: 'Échec des suggestions : {error}',
      suggestNoResults: 'Aucun résultat',
      suggestTypeGame: 'Jeu',
      suggestTypeApp: 'App',
      suggestTypeSoftware: 'Logiciel',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: 'Lot',
      suggestFree: 'Gratuit',
      suggestControllerFull: 'Manette complète',
      suggestControllerPartial: 'Manette partielle',
      suggestAppId: 'ID app {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: 'Région bloquée',
      rememberBlockedApps: 'Mémoriser les jeux bloqués',
      rememberBlockedAppsHint:
        'Quand Steam affiche une erreur régionale sur une app, enregistrer son ID localement pour la recherche invité.',
      markBlockedInSearch: 'Surligner dans la recherche',
      markBlockedInSearchHint: 'Affiche un badge région bloquée sur les jeux enregistrés dans la recherche invité.',
      probeBlockedInSearch: 'Détecter les bloqués dans la recherche',
      probeBlockedInSearchHint:
        'Après l’affichage de la recherche invité, ouvre chaque page d’app avec vos cookies Steam. Les jeux bloqués par région sont ajoutés à la liste. Connexion requise.',
      probeBlockedScope: 'Vérifier dans',
      probeBlockedScopeBoth: 'Suggestions et page de recherche',
      probeBlockedScopeSuggest: 'Suggestions uniquement',
      probeBlockedScopeSearch: 'Page de recherche uniquement',
      probeBlockedConcurrency: 'Vérifications parallèles',
      probeBlockedConcurrencyHint: 'Nombre de pages d’app sondées en même temps (plus bas = plus doux pour Steam).',
      probeProgress: 'Vérification des blocages régionaux… {done}/{total}',
      probeFound: '{count} jeu(x) bloqué(s) ajouté(s)',
      probeNeedLogin: 'Connectez-vous à Steam pour détecter automatiquement les jeux bloqués.',
      probeNeedRemember: 'Activez « Mémoriser les jeux bloqués » pour enregistrer les détections.',
      blockedAppsCount: '{count} jeux bloqués enregistrés',
      viewBlockedApps: 'Voir la liste',
      hideBlockedApps: 'Masquer la liste',
      blockedAppsEmpty: 'Aucun jeu bloqué enregistré pour le moment.',
      blockedAppUntitled: 'App {id}',
      clearBlockedApps: 'Vider la liste',
      searchPageLoading: 'Chargement des résultats sans cookies de compte…',
      searchPageBanner: 'Recherche invité Region Bypass (requête anonyme)',
      searchPageBannerSettings: 'Paramètres',
      searchPageNoContent: 'Aucun résultat dans la réponse invité. Vérifiez le proxy ou réessayez.',
      useProxy: 'Utiliser le proxy gateway',
      on: 'ON',
      off: 'OFF',
      gatewayMode: 'Mode gateway',
      host: 'Hôte',
      port: 'Port',
      username: "Nom d'utilisateur",
      password: 'Mot de passe',
      optional: 'facultatif',
      proxyHint:
        'Les userscripts ne peuvent pas définir un proxy SOCKS/HTTP système. Pointez ces champs vers une passerelle HTTP locale/distante qui récupère les URL depuis une autre région (par ex. un petit proxy CORS derrière votre VPN).',
      cancel: 'Annuler',
      save: 'Enregistrer',
      saveReload: 'Enregistrer et recharger',
    },
    ja: {
      menuSettings: 'Steam Region Bypass — 設定',
      loading: 'アカウントCookieなしでストアページを読み込み中…',
      stillBlockedProxy:
        'まだブロックされています。プロキシIPが制限地域にある可能性があります — 別の出口ノードを試してください。',
      stillBlockedNoProxy:
        'まだIP/地域でブロックされています。設定でプロキシゲートウェイを有効にし、制限のない地域に向けてください。',
      ageGate:
        'Steamが年齢確認を返しました。再試行してください — birthtime Cookieは自動送信されます。続く場合はアプリを一度開いて年齢を確認してください。',
      noContent: '取得したページにストア内容がありません。プロキシ設定を確認するか、再試行してください。',
      failedLoad: '読み込みに失敗: {error}',
      networkError: 'ネットワークエラー',
      requestTimeout: 'リクエストがタイムアウトしました',
      retry: '再試行',
      settings: '設定',
      badge: 'Region Bypass',
      bannerBlockedBadge: '地域制限',
      bannerTitle: 'このゲームはお住まいの地域では利用できません',
      bannerBody: 'ストアページは匿名ゲスト取得で表示されています（アカウントCookieなし）',
      viaProxy: 'プロキシゲートウェイ経由',
      viaCache: 'キャッシュから',
      reload: '再読み込み',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: 'プロキシゲートウェイ ON',
      proxyOff: 'プロキシゲートウェイ OFF',
      panelTitle: 'Region Bypass',
      panelSubtitle: '匿名ストアリクエスト · 任意のプロキシゲートウェイ',
      tabGeneral: '一般',
      tabSearch: '検索',
      tabProxy: 'プロキシ',
      close: '閉じる',
      bypassTrigger: 'ブロックされたページで',
      bypassTriggerAuto: 'ページを自動的に置き換える',
      bypassTriggerButton: '置き換えボタンを表示',
      bypassTriggerHint:
        '自動モードはOopsページをすぐに置き換えます。ボタンモードはエラーページを残し、バイパス開始用のコントロールを追加します。',
      bypassOffer: 'このページはお住まいの地域でブロックされています。アカウントCookieなしでストアページを読み込みますか？',
      bypassNow: 'ストアページを表示',
      storeCountry: 'ストアの国 (cc)',
      storeCountryHint: 'ゲストリクエスト用のSteamストア国の任意上書き。',
      cacheMinutes: 'キャッシュ時間（分）',
      cacheMinutesHint:
        '成功したゲストページを再取得するまでの保持時間。0でキャッシュ無効。「再読み込み」は常に最新を取得します。',
      searchUnblocked: 'ゲスト検索候補',
      searchUnblockedHint:
        'ヘッダーの検索候補をアカウントCookieなしで取得します（アプリバイパスと同じゲストスタック）。デフォルトでオン。',
      searchPageUnblocked: 'ゲスト /search ページ',
      searchPageUnblockedHint:
        'Steam の /search 結果を匿名ゲスト取得で置き換えます。デフォルトはオフ — 検索ページ全体で地域制限タイトルが必要な場合にオンにしてください。',
      suggestGuestNotice:
        'Region Bypass のゲスト検索が有効です — アカウントCookieなしで取得し、地域制限タイトルも表示できます。',
      suggestGuestSettings: '設定 → 検索 で無効化',
      suggestEmpty: 'ゲストとしてストアを検索するには入力してください（アカウントCookieなし）',
      suggestLoading: '検索中…',
      suggestFailed: '検索候補の取得に失敗: {error}',
      suggestNoResults: '結果なし',
      suggestTypeGame: 'ゲーム',
      suggestTypeApp: 'アプリ',
      suggestTypeSoftware: 'ソフトウェア',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: 'バンドル',
      suggestFree: '無料',
      suggestControllerFull: 'フルコントローラー対応',
      suggestControllerPartial: '一部コントローラー対応',
      suggestAppId: 'アプリ ID {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: '地域制限',
      rememberBlockedApps: 'ブロックされたゲームを記憶',
      rememberBlockedAppsHint: 'アプリページで地域エラーが出たとき、IDをローカル保存しゲスト検索で強調表示します。',
      markBlockedInSearch: '検索で強調',
      markBlockedInSearchHint: 'ゲスト検索で保存済みゲームに地域制限バッジを表示します。',
      probeBlockedInSearch: '検索でブロックを自動検出',
      probeBlockedInSearchHint:
        'ゲスト検索の描画後、Steam Cookie で各アプリページを開きます。地域制限のゲームをリストに追加します。ログインが必要です。',
      probeBlockedScope: 'チェック対象',
      probeBlockedScopeBoth: '候補と検索ページ',
      probeBlockedScopeSuggest: '候補のみ',
      probeBlockedScopeSearch: '検索ページのみ',
      probeBlockedConcurrency: '並列チェック数',
      probeBlockedConcurrencyHint: '同時に調べるアプリページ数（小さいほど Steam に優しい）。',
      probeProgress: '地域制限を確認中… {done}/{total}',
      probeFound: 'ブロックゲームを {count} 件追加',
      probeNeedLogin: 'ブロックゲームを自動検出するには Steam にログインしてください。',
      probeNeedRemember: '検出結果を保存するには「ブロックされたゲームを記憶」をオンにしてください。',
      blockedAppsCount: '保存済みブロックゲーム: {count}',
      viewBlockedApps: '一覧を表示',
      hideBlockedApps: '一覧を隠す',
      blockedAppsEmpty: '保存されたブロックゲームはまだありません。',
      blockedAppUntitled: 'アプリ {id}',
      clearBlockedApps: 'リストを消去',
      searchPageLoading: 'アカウントCookieなしで検索結果を読み込み中…',
      searchPageBanner: 'Region Bypass ゲスト検索（匿名取得）',
      searchPageBannerSettings: '設定',
      searchPageNoContent: 'ゲスト応答に検索結果がありません。プロキシを確認するか再試行してください。',
      useProxy: 'プロキシゲートウェイを使用',
      on: 'ON',
      off: 'OFF',
      gatewayMode: 'ゲートウェイモード',
      host: 'ホスト',
      port: 'ポート',
      username: 'ユーザー名',
      password: 'パスワード',
      optional: '任意',
      proxyHint:
        'ユーザースクリプトはシステムのSOCKS/HTTPプロキシを設定できません。別地域からURLを取得するローカル/リモートHTTPゲートウェイを指定してください（例: VPN背後の小さなCORSプロキシ）。',
      cancel: 'キャンセル',
      save: '保存',
      saveReload: '保存して再読み込み',
    },
    ko: {
      menuSettings: 'Steam Region Bypass — 설정',
      loading: '계정 쿠키 없이 스토어 페이지를 불러오는 중…',
      stillBlockedProxy:
        '여전히 차단됨. 프록시 IP가 제한 지역에 있을 수 있습니다 — 다른 출구 노드를 시도하세요.',
      stillBlockedNoProxy:
        '여전히 IP/지역으로 차단됨. 설정에서 프록시 게이트웨이를 켜고 제한 없는 지역으로 연결하세요.',
      ageGate:
        'Steam이 연령 확인을 반환했습니다. 다시 시도하세요 — birthtime 쿠키는 자동으로 전송됩니다. 계속되면 앱을 한 번 열고 나이를 확인하세요.',
      noContent: '가져온 페이지에 스토어 콘텐츠가 없습니다. 프록시 설정을 확인하거나 다시 시도하세요.',
      failedLoad: '불러오기 실패: {error}',
      networkError: '네트워크 오류',
      requestTimeout: '요청 시간 초과',
      retry: '다시 시도',
      settings: '설정',
      badge: 'Region Bypass',
      bannerBlockedBadge: '지역 제한',
      bannerTitle: '이 게임은 해당 지역에서 이용할 수 없습니다',
      bannerBody: '스토어 페이지는 익명 게스트 요청으로 표시됩니다 (계정 쿠키 없음)',
      viaProxy: '프록시 게이트웨이 경유',
      viaCache: '캐시에서',
      reload: '다시 불러오기',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: '프록시 게이트웨이 ON',
      proxyOff: '프록시 게이트웨이 OFF',
      panelTitle: 'Region Bypass',
      panelSubtitle: '익명 스토어 요청 · 선택적 프록시 게이트웨이',
      tabGeneral: '일반',
      tabSearch: '검색',
      tabProxy: '프록시',
      close: '닫기',
      bypassTrigger: '차단된 페이지에서',
      bypassTriggerAuto: '페이지 자동 교체',
      bypassTriggerButton: '교체 버튼 표시',
      bypassTriggerHint:
        '자동 모드는 Oops 페이지를 즉시 교체합니다. 버튼 모드는 오류 페이지를 유지하고 우회를 시작할 컨트롤을 추가합니다.',
      bypassOffer: '이 페이지는 해당 지역에서 차단되어 있습니다. 계정 쿠키 없이 스토어 페이지를 불러올까요?',
      bypassNow: '스토어 페이지 표시',
      storeCountry: '스토어 국가 (cc)',
      storeCountryHint: '게스트 요청용 Steam 스토어 국가 선택적 재정의.',
      cacheMinutes: '캐시 유지 시간(분)',
      cacheMinutesHint:
        '성공한 게스트 페이지를 다시 요청하기 전까지 얼마나 재사용할지. 0이면 캐시 비활성. 「다시 불러오기」는 항상 새로 가져옵니다.',
      searchUnblocked: '게스트 검색 제안',
      searchUnblockedHint:
        '헤더 검색 제안을 계정 쿠키 없이 가져옵니다(앱 우회와 동일한 게스트 스택). 기본으로 켜짐.',
      searchPageUnblocked: '게스트 /search 페이지',
      searchPageUnblockedHint:
        'Steam /search 결과를 익명 게스트 요청으로 바꿉니다. 기본은 꺼짐 — 전체 검색 페이지에서 지역 제한 타이틀이 필요하면 켜세요.',
      suggestGuestNotice:
        'Region Bypass 게스트 검색이 켜져 있습니다 — 계정 쿠키 없이 결과를 가져오며 지역 제한 타이틀도 보일 수 있습니다.',
      suggestGuestSettings: '설정 → 검색에서 끄기',
      suggestEmpty: '게스트로 스토어를 검색하려면 입력하세요(계정 쿠키 없음)',
      suggestLoading: '검색 중…',
      suggestFailed: '검색 제안을 불러오지 못했습니다: {error}',
      suggestNoResults: '결과 없음',
      suggestTypeGame: '게임',
      suggestTypeApp: '앱',
      suggestTypeSoftware: '소프트웨어',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: '번들',
      suggestFree: '무료',
      suggestControllerFull: '전체 컨트롤러 지원',
      suggestControllerPartial: '부분 컨트롤러 지원',
      suggestAppId: '앱 ID {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: '지역 제한',
      rememberBlockedApps: '차단된 게임 기억',
      rememberBlockedAppsHint: '앱 페이지에서 지역 오류가 나오면 ID를 로컬에 저장해 게스트 검색에서 강조합니다.',
      markBlockedInSearch: '검색에서 강조',
      markBlockedInSearchHint: '게스트 검색에서 저장된 게임에 지역 제한 배지를 표시합니다.',
      probeBlockedInSearch: '검색에서 차단 자동 감지',
      probeBlockedInSearchHint:
        '게스트 검색 렌더 후 Steam 쿠키로 각 앱 페이지를 엽니다. 지역 제한 게임을 목록에 추가합니다. 로그인이 필요합니다.',
      probeBlockedScope: '확인 범위',
      probeBlockedScopeBoth: '제안 및 검색 페이지',
      probeBlockedScopeSuggest: '제안만',
      probeBlockedScopeSearch: '검색 페이지만',
      probeBlockedConcurrency: '병렬 확인 수',
      probeBlockedConcurrencyHint: '동시에 검사할 앱 페이지 수(낮을수록 Steam에 부담이 적음).',
      probeProgress: '지역 제한 확인 중… {done}/{total}',
      probeFound: '차단 게임 {count}개 추가됨',
      probeNeedLogin: '차단 게임을 자동 감지하려면 Steam에 로그인하세요.',
      probeNeedRemember: '감지 결과를 저장하려면 «차단된 게임 기억»을 켜세요.',
      blockedAppsCount: '저장된 차단 게임 {count}개',
      viewBlockedApps: '목록 보기',
      hideBlockedApps: '목록 숨기기',
      blockedAppsEmpty: '저장된 차단 게임이 아직 없습니다.',
      blockedAppUntitled: '앱 {id}',
      clearBlockedApps: '목록 지우기',
      searchPageLoading: '계정 쿠키 없이 검색 결과를 불러오는 중…',
      searchPageBanner: 'Region Bypass 게스트 검색(익명 요청)',
      searchPageBannerSettings: '설정',
      searchPageNoContent: '게스트 응답에 검색 결과가 없습니다. 프록시를 확인하거나 다시 시도하세요.',
      useProxy: '프록시 게이트웨이 사용',
      on: 'ON',
      off: 'OFF',
      gatewayMode: '게이트웨이 모드',
      host: '호스트',
      port: '포트',
      username: '사용자 이름',
      password: '비밀번호',
      optional: '선택',
      proxyHint:
        '유저스크립트는 시스템 SOCKS/HTTP 프록시를 설정할 수 없습니다. 다른 지역에서 URL을 가져오는 로컬/원격 HTTP 게이트웨이를 지정하세요 (예: VPN 뒤의 작은 CORS 프록시).',
      cancel: '취소',
      save: '저장',
      saveReload: '저장 후 새로고침',
    },
    pl: {
      menuSettings: 'Steam Region Bypass — Ustawienia',
      loading: 'Ładowanie strony sklepu bez cookies konta…',
      stillBlockedProxy:
        'Nadal zablokowane. IP proxy prawdopodobnie jest w ograniczonym regionie — spróbuj innego węzła wyjściowego.',
      stillBlockedNoProxy:
        'Nadal zablokowane przez IP/region. Włącz proxy gateway w ustawieniach i skieruj go na region bez ograniczeń.',
      ageGate:
        'Steam zwrócił weryfikację wieku. Spróbuj ponownie — cookies birthtime są wysyłane automatycznie; jeśli nadal się pojawia, otwórz aplikację raz i potwierdź wiek.',
      noContent:
        'Pobrana strona nie zawierała treści sklepu. Sprawdź ustawienia proxy lub spróbuj ponownie.',
      failedLoad: 'Nie udało się załadować: {error}',
      networkError: 'Błąd sieci',
      requestTimeout: 'Przekroczono limit czasu',
      retry: 'Ponów',
      settings: 'Ustawienia',
      badge: 'Region Bypass',
      bannerBlockedBadge: 'Region zablokowany',
      bannerTitle: 'Ta gra jest niedostępna w Twoim regionie',
      bannerBody: 'Strona sklepu jest wyświetlana przez anonimowe pobranie gościa (bez cookies konta)',
      viaProxy: 'przez proxy gateway',
      viaCache: 'z pamięci podręcznej',
      reload: 'Odśwież',
      btnTitle: 'Steam Region Bypass',
      btnText: 'Region Bypass',
      proxyOn: 'Proxy gateway WŁ',
      proxyOff: 'Proxy gateway WYŁ',
      panelTitle: 'Region Bypass',
      panelSubtitle: 'Anonimowe pobieranie sklepu · opcjonalny proxy gateway',
      tabGeneral: 'Ogólne',
      tabSearch: 'Szukaj',
      tabProxy: 'Proxy',
      close: 'Zamknij',
      bypassTrigger: 'Na zablokowanych stronach',
      bypassTriggerAuto: 'Zastępuj stronę automatycznie',
      bypassTriggerButton: 'Pokaż przycisk do zastąpienia',
      bypassTriggerHint:
        'Tryb automatyczny od razu zastępuje stronę Oops. Tryb z przyciskiem zostawia stronę błędu i dodaje kontrolkę do uruchomienia obejścia.',
      bypassOffer: 'Ta strona jest zablokowana w Twoim regionie. Załadować stronę sklepu bez cookies konta?',
      bypassNow: 'Pokaż stronę sklepu',
      storeCountry: 'Kraj sklepu (cc)',
      storeCountryHint: 'Opcjonalne nadpisanie kraju sklepu Steam dla zapytań gościa.',
      cacheMinutes: 'Czas pamięci podręcznej (minuty)',
      cacheMinutesHint:
        'Jak długo ponownie używać udanej strony gościa przed ponownym pobraniem. 0 wyłącza cache. Odśwież zawsze pobiera świeże dane.',
      searchUnblocked: 'Podpowiedzi wyszukiwania gościa',
      searchUnblockedHint:
        'Podpowiedzi w nagłówku są pobierane bez cookies konta (ten sam stos gościa co przy omijaniu stron aplikacji). Domyślnie włączone.',
      searchPageUnblocked: 'Strona /search gościa',
      searchPageUnblockedHint:
        'Zastępuje wyniki Steam /search anonimowym pobraniem gościa. Domyślnie wyłączone — włącz, jeśli potrzebujesz tytułów zablokowanych regionalnie na pełnej stronie wyszukiwania.',
      suggestGuestNotice:
        'Wyszukiwanie gościa Region Bypass jest włączone — wyniki bez cookies konta; mogą być widoczne tytuły zablokowane regionalnie.',
      suggestGuestSettings: 'Wyłącz w Ustawienia → Wyszukiwanie',
      suggestEmpty: 'Wpisz, aby przeszukać sklep jako gość (bez cookies konta)',
      suggestLoading: 'Wyszukiwanie…',
      suggestFailed: 'Nie udało się załadować podpowiedzi: {error}',
      suggestNoResults: 'Brak wyników',
      suggestTypeGame: 'Gra',
      suggestTypeApp: 'Aplikacja',
      suggestTypeSoftware: 'Oprogramowanie',
      suggestTypeDlc: 'DLC',
      suggestTypeBundle: 'Pakiet',
      suggestFree: 'Darmowe',
      suggestControllerFull: 'Pełne wsparcie pada',
      suggestControllerPartial: 'Częściowe wsparcie pada',
      suggestAppId: 'ID aplikacji {id}',
      suggestMetascore: 'Metascore {score}',
      suggestReviews: '{summary} · {percent}%',
      suggestRegionBlocked: 'Region zablokowany',
      rememberBlockedApps: 'Zapamiętuj zablokowane gry',
      rememberBlockedAppsHint:
        'Gdy Steam pokaże błąd regionu na stronie aplikacji, zapisz ID lokalnie do podświetlenia w wyszukiwaniu gościa.',
      markBlockedInSearch: 'Podświetlaj w wyszukiwaniu',
      markBlockedInSearchHint: 'Pokazuj odznakę zablokowanego regionu dla zapisanych gier w wyszukiwaniu gościa.',
      probeBlockedInSearch: 'Wykrywaj zablokowane w wyszukiwaniu',
      probeBlockedInSearchHint:
        'Po wyrenderowaniu wyszukiwania gościa otwiera strony aplikacji z cookies Steam. Gry z blokadą regionu trafiają na listę. Wymagane logowanie.',
      probeBlockedScope: 'Sprawdzaj w',
      probeBlockedScopeBoth: 'Podpowiedzi i strona wyszukiwania',
      probeBlockedScopeSuggest: 'Tylko podpowiedzi',
      probeBlockedScopeSearch: 'Tylko strona wyszukiwania',
      probeBlockedConcurrency: 'Równoległe sprawdzenia',
      probeBlockedConcurrencyHint: 'Ile stron aplikacji sprawdzać naraz (mniej = łagodniej dla Steam).',
      probeProgress: 'Sprawdzanie blokad regionu… {done}/{total}',
      probeFound: 'Dodano zablokowanych gier: {count}',
      probeNeedLogin: 'Zaloguj się do Steam, aby automatycznie wykrywać zablokowane gry.',
      probeNeedRemember: 'Włącz «Zapamiętuj zablokowane gry», aby zapisywać wykryte pozycje.',
      blockedAppsCount: 'Zapisane zablokowane gry: {count}',
      viewBlockedApps: 'Pokaż listę',
      hideBlockedApps: 'Ukryj listę',
      blockedAppsEmpty: 'Brak zapisanych zablokowanych gier.',
      blockedAppUntitled: 'Aplikacja {id}',
      clearBlockedApps: 'Wyczyść listę',
      searchPageLoading: 'Ładowanie wyników wyszukiwania bez cookies konta…',
      searchPageBanner: 'Wyszukiwanie gościa Region Bypass (anonimowe pobranie)',
      searchPageBannerSettings: 'Ustawienia',
      searchPageNoContent: 'Brak wyników w odpowiedzi gościa. Sprawdź proxy lub spróbuj ponownie.',
      useProxy: 'Użyj proxy gateway',
      on: 'WŁ',
      off: 'WYŁ',
      gatewayMode: 'Tryb gateway',
      host: 'Host',
      port: 'Port',
      username: 'Nazwa użytkownika',
      password: 'Hasło',
      optional: 'opcjonalne',
      proxyHint:
        'Userscripts nie mogą ustawić systemowego proxy SOCKS/HTTP. Wskaż te pola na lokalny/zdalny gateway HTTP, który pobiera URL z innego regionu (np. mały proxy CORS za VPN).',
      cancel: 'Anuluj',
      save: 'Zapisz',
      saveReload: 'Zapisz i odśwież stronę',
    },
  };

  const LOCALE = detectLocale();

  /**
   * @param {string} key
   * @param {Record<string, string | number>} [vars]
   */
  function t(key, vars) {
    const dict = MESSAGES[LOCALE] || MESSAGES.en;
    let str = dict[key] ?? MESSAGES.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        str = str.replaceAll('{' + name + '}', String(value));
      }
    }
    return str;
  }

  function detectLocale() {
    const candidates = [...(navigator.languages || []), navigator.language || 'en'].filter(Boolean);
    for (const raw of candidates) {
      const tag = String(raw).replace(/_/g, '-');
      const lower = tag.toLowerCase();
      const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === lower);
      if (exact) return exact;
      if (lower.startsWith('zh')) return 'zh-CN';
      if (lower.startsWith('pt')) return 'pt-BR';
      const primary = lower.split('-')[0];
      const byPrimary = SUPPORTED_LOCALES.find((l) => l.toLowerCase().split('-')[0] === primary);
      if (byPrimary) return byPrimary;
    }
    return 'en';
  }

  function getCookie(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1].trim()) : '';
  }

  /**
   * Store page language for guest fetch: Steam_Language cookie, else UI/browser fallback.
   * @returns {string}
   */
  function getSteamStoreLanguage() {
    const fromCookie = getCookie('Steam_Language');
    if (fromCookie) return fromCookie;
    return STEAM_LANG_BY_LOCALE[LOCALE] || 'english';
  }

  /** Settings override, else steamCountry cookie / page hints, else US. */
  function getStoreCountryCode() {
    if (settings.countryCode) {
      return settings.countryCode.trim().toUpperCase();
    }

    const fromCookie = getCookie('steamCountry');
    if (fromCookie) {
      const cc = decodeURIComponent(fromCookie).split('|')[0]?.trim();
      if (/^[A-Za-z]{2}$/.test(cc)) return cc.toUpperCase();
    }

    const ccMatch = document.documentElement.innerHTML.match(/[?&]cc=([A-Za-z]{2})\b/);
    if (ccMatch) return ccMatch[1].toUpperCase();

    return 'US';
  }

  const REGION_PATTERNS = [
    /unavailable in your region/i,
    /not available in your (?:country|region)/i,
    /недоступн[аоы].*(?:регион|стране|вашем регионе)/i,
    /в вашем регионе недоступн/i,
    /este artículo no está disponible en tu región/i,
    /cet article n'est pas disponible dans votre région/i,
  ];

  /** @type {ReturnType<typeof loadSettings>} */
  let settings = loadSettings();
  let panelOpen = false;

  /** Guest search state */
  let suggestToken = 0;
  let suggestDebounceTimer = null;
  let activeSuggestIndex = -1;
  let searchPageToken = 0;
  let searchPageDebounceTimer = null;
  /** href last successfully loaded by guest /search inject (avoids MutationObserver reload loops) */
  let searchPageLoadedHref = '';
  let historyHooked = false;
  /** @type {Set<string> | null} */
  let blockedAppsIndex = null;
  /** Session cache of probed app IDs that were not region-blocked: id → status */
  const probeSessionCache = new Map();
  /** @type {Array<object>} */
  let lastSuggestItems = [];

  init();

  function init() {
    GM_addStyle(getStyles());
    try {
      GM_setValue('srbb_search_term', '');
    } catch {
      /* ignore */
    }
    GM_registerMenuCommand(t('menuSettings'), () => {
      ensureSettingsButton().then(() => togglePanel(true));
    });

    ensureSettingsButton();
    observeHeader();
    initSearchUnblocked();

    if (isRegionBlockedPage()) {
      rememberBlockedAppFromPage();
      if (settings.autoBypass) {
        bypassRegionBlock();
      } else {
        showBypassOffer();
      }
      return;
    }
  }

  function loadSettings() {
    let raw = GM_getValue(STORAGE_KEY, null);
    raw = migrateSearchDefaultOn(raw);
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
    const merged = { ...DEFAULT_SETTINGS, ...raw };
    delete merged.rememberSearchTerm;
    merged.cacheMinutes = normalizeCacheMinutes(merged.cacheMinutes);
    merged.probeBlockedScope = normalizeProbeScope(merged.probeBlockedScope);
    merged.probeBlockedConcurrency = normalizeProbeConcurrency(merged.probeBlockedConcurrency);
    return merged;
  }

  function migrateSearchDefaultOn(raw) {
    if (GM_getValue(SEARCH_DEFAULT_ON_FLAG, false)) return raw;
    GM_setValue(SEARCH_DEFAULT_ON_FLAG, true);
    if (!raw || typeof raw !== 'object') return raw;
    if (raw.searchUnblocked === true) return raw;
    const next = { ...raw, searchUnblocked: true };
    GM_setValue(STORAGE_KEY, next);
    return next;
  }

  function saveSettings(next) {
    const prevSearch = settings.searchUnblocked;
    const prevSearchPage = settings.searchPageUnblocked;
    settings = { ...settings, ...next };
    settings.cacheMinutes = normalizeCacheMinutes(settings.cacheMinutes);
    settings.probeBlockedScope = normalizeProbeScope(settings.probeBlockedScope);
    settings.probeBlockedConcurrency = normalizeProbeConcurrency(settings.probeBlockedConcurrency);
    GM_setValue(STORAGE_KEY, settings);
    updateButtonState();
    const searchChanged =
      ('searchUnblocked' in next && prevSearch !== settings.searchUnblocked) ||
      ('searchPageUnblocked' in next && prevSearchPage !== settings.searchPageUnblocked);
    if (searchChanged) {
      syncSearchGuestMode();
      syncSearchPanelToggle();
      if (settings.searchPageUnblocked && isSearchPage()) {
        searchPageLoadedHref = '';
        scheduleGuestSearchReload({ immediate: true });
      }
    }
  }

  function normalizeCacheMinutes(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n) || n < 0) return DEFAULT_SETTINGS.cacheMinutes;
    return Math.min(n, CACHE_MINUTES_MAX);
  }

  function normalizeProbeScope(value) {
    return value === 'suggest' || value === 'search' || value === 'both'
      ? value
      : DEFAULT_SETTINGS.probeBlockedScope;
  }

  function normalizeProbeConcurrency(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return DEFAULT_SETTINGS.probeBlockedConcurrency;
    return Math.min(PROBE_CONCURRENCY_MAX, Math.max(1, n));
  }

  function getCacheTtlMs() {
    const minutes = normalizeCacheMinutes(settings.cacheMinutes);
    return minutes > 0 ? minutes * 60 * 1000 : 0;
  }

  function buildCacheKey(targetUrl) {
    const proxySig = settings.proxyEnabled
      ? [settings.proxyMode || 'gateway', settings.proxyHost.trim(), String(settings.proxyPort || '').trim()].join('|')
      : 'direct';
    return `${targetUrl}\n${proxySig}`;
  }

  function loadCacheStore() {
    const raw = GM_getValue(CACHE_STORAGE_KEY, null);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw;
  }

  function pruneCacheStore(store, ttlMs) {
    const now = Date.now();
    const entries = Object.entries(store).filter(([, entry]) => {
      return (
        entry &&
        typeof entry === 'object' &&
        typeof entry.html === 'string' &&
        entry.html.length > 0 &&
        typeof entry.savedAt === 'number' &&
        (ttlMs <= 0 || now - entry.savedAt < ttlMs)
      );
    });
    entries.sort((a, b) => b[1].savedAt - a[1].savedAt);
    const next = {};
    for (const [key, entry] of entries.slice(0, CACHE_MAX_ENTRIES)) {
      next[key] = entry;
    }
    return next;
  }

  function readPageCache(targetUrl) {
    const ttlMs = getCacheTtlMs();
    if (ttlMs <= 0) return null;

    const key = buildCacheKey(targetUrl);
    let store = loadCacheStore();
    const entry = store[key];
    if (!entry || typeof entry.html !== 'string' || !entry.html) return null;

    if (Date.now() - entry.savedAt >= ttlMs) {
      delete store[key];
      GM_setValue(CACHE_STORAGE_KEY, pruneCacheStore(store, ttlMs));
      return null;
    }
    return entry.html;
  }

  function writePageCache(targetUrl, html) {
    const ttlMs = getCacheTtlMs();
    if (ttlMs <= 0 || !html) return;

    const key = buildCacheKey(targetUrl);
    const store = loadCacheStore();
    store[key] = { html, savedAt: Date.now() };
    GM_setValue(CACHE_STORAGE_KEY, pruneCacheStore(store, ttlMs));
  }

  function invalidatePageCache(targetUrl) {
    const key = buildCacheKey(targetUrl);
    const store = loadCacheStore();
    if (!(key in store)) return;
    delete store[key];
    GM_setValue(CACHE_STORAGE_KEY, store);
  }

  function loadBlockedAppsStore() {
    const raw = GM_getValue(BLOCKED_APPS_STORAGE_KEY, null);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw;
  }

  function pruneBlockedAppsStore(store) {
    const entries = Object.entries(store).filter(([id, entry]) => {
      return /^[0-9]+$/.test(id) && entry && typeof entry === 'object' && typeof entry.at === 'number';
    });
    entries.sort((a, b) => b[1].at - a[1].at);
    const next = {};
    for (const [id, entry] of entries.slice(0, BLOCKED_APPS_MAX_ENTRIES)) {
      next[id] = entry;
    }
    return next;
  }

  function saveBlockedAppsStore(store) {
    GM_setValue(BLOCKED_APPS_STORAGE_KEY, pruneBlockedAppsStore(store));
    invalidateBlockedAppsIndex();
  }

  function invalidateBlockedAppsIndex() {
    blockedAppsIndex = null;
  }

  function getBlockedAppIds() {
    if (!blockedAppsIndex) {
      blockedAppsIndex = new Set(Object.keys(loadBlockedAppsStore()));
    }
    return blockedAppsIndex;
  }

  function getBlockedAppsCount() {
    return getBlockedAppIds().size;
  }

  /** @returns {Array<{id:string,name:string,at:number}>} newest first */
  function listBlockedAppsEntries() {
    const store = pruneBlockedAppsStore(loadBlockedAppsStore());
    return Object.entries(store)
      .map(([id, entry]) => ({
        id,
        name: String(entry?.name || '').trim(),
        at: typeof entry?.at === 'number' ? entry.at : 0,
      }))
      .sort((a, b) => b.at - a.at);
  }

  function isBlockedApp(appId) {
    if (!appId) return false;
    return getBlockedAppIds().has(String(appId));
  }

  function rememberBlockedApp(appId, name = '') {
    if (!settings.rememberBlockedApps || !appId) return;
    const id = String(appId);
    const store = loadBlockedAppsStore();
    const prev = store[id] && typeof store[id] === 'object' ? store[id] : {};
    const cleanName = String(name || prev.name || '').trim();
    store[id] = {
      name: cleanName,
      at: Date.now(),
    };
    saveBlockedAppsStore(store);
    syncBlockedAppsPanel();
  }

  function touchBlockedAppName(appId, name = '') {
    if (!settings.rememberBlockedApps || !appId) return;
    const id = String(appId);
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    const store = loadBlockedAppsStore();
    if (!store[id]) return;
    if (store[id].name === cleanName) return;
    store[id] = { ...store[id], name: cleanName, at: Date.now() };
    saveBlockedAppsStore(store);
  }

  function clearBlockedApps() {
    GM_setValue(BLOCKED_APPS_STORAGE_KEY, {});
    invalidateBlockedAppsIndex();
    const listEl = document.getElementById('srbb-blocked-list');
    if (listEl) {
      listEl.hidden = true;
      listEl.innerHTML = '';
    }
    syncBlockedAppsPanel();
  }

  function getAppNameFromUrl(url = location.href) {
    const match = String(url).match(/\/app\/\d+\/([^/?#]+)/i);
    if (!match) return '';
    try {
      return decodeURIComponent(match[1]).replace(/_/g, ' ').trim();
    } catch {
      return match[1].replace(/_/g, ' ').trim();
    }
  }

  function rememberBlockedAppFromPage() {
    const appId = getAppIdFromUrl();
    if (!appId) return;
    const name =
      getAppNameFromUrl() ||
      document.querySelector('.apphub_AppName, #appHubAppName')?.textContent?.trim() ||
      '';
    rememberBlockedApp(appId, name);
  }

  function isRegionBlockedPage(root = document) {
    const errorEl = root.querySelector('#error_box .error, #error_box');
    if (errorEl) {
      const text = errorEl.textContent || '';
      if (REGION_PATTERNS.some((re) => re.test(text))) return true;
    }
    // Error landing without #error_box (localized Oops shell)
    const oops = root.querySelector('.pageheader');
    if (oops && /oops/i.test(oops.textContent || '')) {
      const bodyText = root.querySelector('.page_header_ctn, #error_box, .page_content')?.textContent || '';
      if (REGION_PATTERNS.some((re) => re.test(bodyText))) return true;
    }
    return false;
  }

  function getAppIdFromUrl(url = location.href) {
    const match = String(url).match(/\/app\/(\d+)/i);
    return match ? match[1] : null;
  }

  function prepareSuggestItems(items) {
    if (!settings.markBlockedInSearch) return items;
    return items.map((item) => ({
      ...item,
      regionBlocked: isBlockedApp(item.id),
    }));
  }

  function buildSuggestBlockedBadgeHtml(item) {
    if (!item.regionBlocked) return '';
    return `<span class="srbb-suggest__blocked-badge">${escapeHtml(t('suggestRegionBlocked'))}</span>`;
  }

  function buildTargetUrl(sourceUrl = location.href) {
    const url = new URL(sourceUrl);
    url.searchParams.delete('snr');
    url.searchParams.set('l', getSteamStoreLanguage());
    const cc = getStoreCountryCode();
    if (cc) {
      url.searchParams.set('cc', cc.toLowerCase());
    }
    if (/\/search\/?/i.test(url.pathname)) {
      url.searchParams.set('ignore_preferences', '1');
    }
    return url.toString();
  }

  /**
   * Builds the request URL. When proxy is on, routes through a local/remote HTTP gateway
   * (Violentmonkey cannot attach a system SOCKS/HTTP proxy to GM_xmlhttpRequest).
   */
  function buildRequestUrl(targetUrl) {
    if (!settings.proxyEnabled || !settings.proxyHost.trim()) {
      return targetUrl;
    }

    const base = buildProxyBase();
    const mode = settings.proxyMode || 'gateway';

    if (mode === 'path') {
      // e.g. http://127.0.0.1:8080/store.steampowered.com/app/412020/
      return `${base}/${targetUrl.replace(/^https?:\/\//, '')}`;
    }
    if (mode === 'query') {
      return `${base}/?url=${encodeURIComponent(targetUrl)}`;
    }
    // gateway: http://127.0.0.1:8080/https://store.steampowered.com/...
    return `${base}/${targetUrl}`;
  }

  function buildProxyBase() {
    let host = settings.proxyHost.trim().replace(/\/+$/, '');
    const port = String(settings.proxyPort || '').trim();

    if (/^https?:\/\//i.test(host)) {
      if (port && !/:\d+$/.test(host.replace(/^https?:\/\//i, '').split('/')[0])) {
        return `${host}:${port}`;
      }
      return host;
    }

    return port ? `http://${host}:${port}` : `http://${host}`;
  }

  function buildRequestHeaders() {
    const steamLang = getSteamStoreLanguage();
    const headers = {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language':
        ACCEPT_LANG_BY_STEAM[steamLang] || navigator.language || 'en-US,en;q=0.9',
    };

    // Age gate + store language + optional country without sending login session
    const cookies = [
      'birthtime=-3338496000',
      'mature_content=1',
      'wants_mature_content=1',
      'lastagecheckage=1-0-1980',
      `Steam_Language=${steamLang}`,
    ];
    if (settings.countryCode) {
      const cc = settings.countryCode.trim().toUpperCase();
      cookies.push(`steamCountry=${encodeURIComponent(cc + '|0')}`);
    } else {
      const cc = getStoreCountryCode();
      if (cc) cookies.push(`steamCountry=${encodeURIComponent(cc + '|0')}`);
    }
    headers.Cookie = cookies.join('; ');

    return headers;
  }

  function gmRequest(url) {
    return new Promise((resolve, reject) => {
      const opts = {
        method: 'GET',
        url,
        anonymous: true,
        timeout: 45000,
        headers: buildRequestHeaders(),
        onload: (res) => resolve(res),
        onerror: (res) => reject(new Error(res && res.statusText ? res.statusText : t('networkError'))),
        ontimeout: () => reject(new Error(t('requestTimeout'))),
      };

      if (settings.proxyEnabled && settings.proxyUser) {
        opts.user = settings.proxyUser;
        opts.password = settings.proxyPass || '';
      }

      GM_xmlhttpRequest(opts);
    });
  }

  /**
   * Account-session request (browser cookies). Never use proxy / guest Cookie override —
   * we need the logged-in store region view to detect locks.
   */
  function gmSessionRequest(url) {
    return new Promise((resolve, reject) => {
      const steamLang = getSteamStoreLanguage();
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        anonymous: false,
        timeout: 25000,
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language':
            ACCEPT_LANG_BY_STEAM[steamLang] || navigator.language || 'en-US,en;q=0.9',
        },
        onload: (res) => resolve(res),
        onerror: (res) =>
          reject(new Error(res && res.statusText ? res.statusText : t('networkError'))),
        ontimeout: () => reject(new Error(t('requestTimeout'))),
      });
    });
  }

  function shouldProbeBlockedScope(scope) {
    if (!settings.probeBlockedInSearch) return false;
    if (!settings.rememberBlockedApps) return false;
    if (!isHostLoggedIn()) return false;
    const s = normalizeProbeScope(settings.probeBlockedScope);
    return s === 'both' || s === scope;
  }

  async function mapPool(items, limit, fn) {
    const results = new Array(items.length);
    let nextIndex = 0;
    const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length || 1)) }, async () => {
      while (nextIndex < items.length) {
        const idx = nextIndex++;
        results[idx] = await fn(items[idx], idx);
      }
    });
    await Promise.all(workers);
    return results;
  }

  async function probeAppRegionStatus(appId) {
    const targetUrl = buildTargetUrl(`https://store.steampowered.com/app/${appId}/`);
    const response = await gmSessionRequest(targetUrl);
    if (response.status < 200 || response.status >= 400) return 'unknown';
    const doc = new DOMParser().parseFromString(response.responseText || '', 'text/html');
    if (isRegionBlockedPage(doc)) return 'blocked';
    if (doc.querySelector('#agecheck_form, .agegate_birthday_desc, #app_agegate')) {
      return 'agegate';
    }
    if (extractGamePageRoot(doc)) return 'ok';
    return 'unknown';
  }

  function dedupeProbeApps(apps) {
    const seen = new Set();
    const out = [];
    for (const app of apps) {
      const id = app && app.id != null ? String(app.id) : '';
      if (!/^\d+$/.test(id) || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, name: String(app.name || '').trim(), row: app.row || null });
    }
    return out;
  }

  /**
   * @param {Array<{id:string,name?:string,row?:Element|null}>} apps
   * @param {{ isCancelled?: () => boolean, onProgress?: Function, onBlocked?: Function, onItemStart?: Function, onItemDone?: Function }} hooks
   */
  async function runBlockedProbe(apps, hooks = {}) {
    const queue = dedupeProbeApps(apps).filter((app) => {
      if (isBlockedApp(app.id)) return false;
      if (probeSessionCache.has(app.id)) return false;
      return true;
    });

    const total = queue.length;
    let done = 0;
    let found = 0;

    if (!total) {
      hooks.onProgress?.({ done: 0, total: 0, found: 0 });
      return { found: 0, checked: 0 };
    }

    hooks.onProgress?.({ done: 0, total, found: 0 });

    await mapPool(queue, normalizeProbeConcurrency(settings.probeBlockedConcurrency), async (app) => {
      if (hooks.isCancelled?.()) return;
      hooks.onItemStart?.(app);
      try {
        const status = await probeAppRegionStatus(app.id);
        if (hooks.isCancelled?.()) return;
        if (status === 'blocked') {
          rememberBlockedApp(app.id, app.name);
          found += 1;
          hooks.onBlocked?.(app);
        } else {
          probeSessionCache.set(app.id, status);
        }
      } catch {
        /* leave uncached for a later retry */
      } finally {
        done += 1;
        hooks.onItemDone?.(app);
        hooks.onProgress?.({ done, total, found });
      }
    });

    return { found, checked: done };
  }

  async function bypassRegionBlock(options = {}) {
    const forceRefresh = !!options.forceRefresh;
    const mount = getContentMount();
    if (!mount) return;

    showLoaderOverlay(t('loading'));

    try {
      const targetUrl = buildTargetUrl();
      let html = null;
      let fromCache = false;

      if (!forceRefresh) {
        html = readPageCache(targetUrl);
        fromCache = !!html;
      } else {
        invalidatePageCache(targetUrl);
      }

      if (!html) {
        const requestUrl = buildRequestUrl(targetUrl);
        const response = await gmRequest(requestUrl);

        if (response.status < 200 || response.status >= 400) {
          throw new Error(`HTTP ${response.status}`);
        }

        html = response.responseText || '';
      }

      const doc = new DOMParser().parseFromString(html, 'text/html');

      if (isRegionBlockedPage(doc)) {
        if (fromCache) invalidatePageCache(targetUrl);
        showStatus(
          mount,
          'error',
          settings.proxyEnabled ? t('stillBlockedProxy') : t('stillBlockedNoProxy')
        );
        return;
      }

      if (doc.querySelector('#agecheck_form, .agegate_birthday_desc, #app_agegate')) {
        if (fromCache) invalidatePageCache(targetUrl);
        showStatus(mount, 'error', t('ageGate'));
        return;
      }

      const remoteGame = extractGamePageRoot(doc);
      if (!remoteGame) {
        if (fromCache) invalidatePageCache(targetUrl);
        showStatus(mount, 'error', t('noContent'));
        return;
      }

      if (!fromCache) {
        writePageCache(targetUrl, html);
      }

      await injectDirect(remoteGame, doc, targetUrl, { fromCache });
      hideLoaderOverlay();
    } catch (err) {
      showStatus(
        mount,
        'error',
        t('failedLoad', { error: err && err.message ? err.message : String(err) })
      );
    }
  }

  /**
   * Game pages use `.game_page_background > #tabletGrid > .page_content_ctn`.
   * Region-error pages use `.page_header_ctn` (“Oops”) + a bare error box — never nest into that.
   */
  function extractGamePageRoot(doc) {
    return (
      doc.querySelector('.game_page_background') ||
      doc.querySelector('#tabletGrid') ||
      doc.querySelector('.page_content_ctn[itemscope]') ||
      doc.querySelector('#game_highlights')?.closest('.page_content_ctn') ||
      null
    );
  }

  function getContentMount() {
    return (
      document.querySelector('#responsive_page_template_content') ||
      document.querySelector('.responsive_page_content') ||
      document.querySelector('#error_box')?.closest('.page_content')?.parentElement ||
      document.body
    );
  }

  function clearErrorPageContent(template) {
    template
      .querySelectorAll(
        [
          '.page_header_ctn',
          '#error_box',
          '.srbb-shell',
          '.srbb-status',
          '.srbb-banner',
          '.srbb-injected',
          '.srbb-iframe-wrap',
          '.game_page_background',
          '#tabletGrid',
          '.page_content_ctn',
        ].join(', ')
      )
      .forEach((el) => el.remove());

    // Tag modal lives outside .game_page_background; drop leftovers from a prior inject
    document.querySelectorAll('#app_tagging_modal').forEach((el) => el.remove());

    // Leftover “Oops” blocks that are not inside page_header_ctn
    template.querySelectorAll('.pageheader').forEach((h2) => {
      if (/oops/i.test(h2.textContent || '')) {
        const block = h2.closest('.page_content') || h2.parentElement;
        block?.remove();
      }
    });
  }

  function applyAppBodyClasses() {
    const body = document.body;
    body.classList.remove('redeemwalletcode');
    for (const cls of ['app', 'game_bg', 'menu_background_overlap', 'application']) {
      body.classList.add(cls);
    }
  }

  function createBanner(options = {}) {
    const banner = document.createElement('div');
    banner.className = 'srbb-banner';
    const details = [
      escapeHtml(t('bannerBody')),
      settings.proxyEnabled ? escapeHtml(t('viaProxy')) : '',
      options.fromCache ? escapeHtml(t('viaCache')) : '',
      settings.countryCode ? `cc=${settings.countryCode.toUpperCase()}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    banner.innerHTML = `
      <div class="srbb-banner__main">
        <span class="srbb-banner__icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3.2 21.5 20H2.5L12 3.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M12 10v5.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="12" cy="17.6" r="1.1" fill="currentColor"/>
          </svg>
        </span>
        <div class="srbb-banner__copy">
          <div class="srbb-banner__title-row">
            <span class="srbb-banner__badge">${escapeHtml(t('bannerBlockedBadge'))}</span>
            <strong class="srbb-banner__title">${escapeHtml(t('bannerTitle'))}</strong>
          </div>
          <div class="srbb-banner__text">${details}</div>
        </div>
      </div>
      <div class="srbb-banner__actions">
        <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="reload">${escapeHtml(t('reload'))}</button>
      </div>
    `;
    banner.querySelector('[data-srbb="reload"]')?.addEventListener('click', () =>
      bypassRegionBlock({ forceRefresh: true })
    );
    return banner;
  }

  function absolutizeUrls(root) {
    root.querySelectorAll('[src], [href], source[srcset]').forEach((el) => {
      for (const attr of ['src', 'href']) {
        const val = el.getAttribute(attr);
        if (!val || val.startsWith('#') || val.startsWith('javascript:') || val.startsWith('data:') || val.startsWith('blob:')) {
          continue;
        }
        try {
          el.setAttribute(attr, new URL(val, 'https://store.steampowered.com/').href);
        } catch {
          /* ignore */
        }
      }
      const srcset = el.getAttribute('srcset');
      if (srcset) {
        try {
          el.setAttribute(
            'srcset',
            srcset
              .split(',')
              .map((part) => {
                const bits = part.trim().split(/\s+/);
                bits[0] = new URL(bits[0], 'https://store.steampowered.com/').href;
                return bits.join(' ');
              })
              .join(', ')
          );
        } catch {
          /* ignore */
        }
      }
    });

    root.querySelectorAll('img[data-src]').forEach((img) => {
      if (!img.getAttribute('src')) {
        try {
          img.setAttribute('src', new URL(img.getAttribute('data-src'), 'https://store.steampowered.com/').href);
        } catch {
          img.setAttribute('src', img.getAttribute('data-src'));
        }
      }
    });
  }

  /**
   * Error pages only load store.css + error.css.
   * App pages also need game.css, store_game_shared.css, apphub.css, etc.
   * Without those, purchase blocks and columns render as a raw vertical stack.
   */
  function ensureAppPageStylesheets(remoteDoc) {
    const head = document.head || document.documentElement;
    const existing = new Set(
      [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => stylesheetKey(link.href))
    );

    const baseFromPage = detectSteamCssBase();
    const toAdd = [];

    remoteDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const raw = link.getAttribute('href');
      if (!raw || /^(chrome-extension|moz-extension|blob):/i.test(raw)) return;
      if (/error\.css/i.test(raw)) return;

      let href;
      try {
        href = new URL(raw, 'https://store.steampowered.com/').href;
      } catch {
        return;
      }

      // Saved/local relative names → map onto Steam CDN using store.css location
      if (!/steamstatic\.com|steampowered\.com/i.test(href) || href.includes('Steam_files')) {
        const name = raw.split('/').pop().split('?')[0];
        if (!name || !/\.css$/i.test(name)) return;
        href = resolveSteamStylesheet(name, baseFromPage);
      }

      const key = stylesheetKey(href);
      if (!key || existing.has(key)) return;
      existing.add(key);
      toAdd.push(href);
    });

    // Guaranteed fallbacks if the guest HTML somehow omits them
    for (const name of [
      'store_game_shared.css',
      'game.css',
      'store_background_shared.css',
      'apphub.css',
      'user_reviews.css',
      'recommended.css',
      'user_reviews_rewards.css',
      'game_mob.css',
    ]) {
      const href = resolveSteamStylesheet(name, baseFromPage);
      const key = stylesheetKey(href);
      if (existing.has(key)) continue;
      existing.add(key);
      toAdd.push(href);
    }

    toAdd.forEach((href) => {
      const el = document.createElement('link');
      el.rel = 'stylesheet';
      el.type = 'text/css';
      el.href = href;
      el.dataset.srbbStyle = '1';
      head.appendChild(el);
    });

    return toAdd.length;
  }

  function stylesheetKey(href) {
    try {
      const u = new URL(href, location.href);
      const file = (u.pathname.split('/').pop() || '').toLowerCase();
      return file || u.href;
    } catch {
      return String(href || '').toLowerCase();
    }
  }

  function detectSteamCssBase() {
    const storeLink = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map((l) => l.href)
      .find((h) => /\/css\/v6\/store\.css/i.test(h) || /\/store\.css(\?|$)/i.test(h));
    if (storeLink) {
      return storeLink.replace(/store\.css(\?.*)?$/i, '');
    }
    return 'https://store.fastly.steamstatic.com/public/css/v6/';
  }

  function resolveSteamStylesheet(fileName, cssV6Base) {
    const shared = [
      'motiva_sans.css',
      'shared_global.css',
      'buttons.css',
      'shared_responsive.css',
      'jquery-ui-1.7.2.custom.css',
    ];
    if (shared.includes(fileName)) {
      return `https://store.fastly.steamstatic.com/public/shared/css/${fileName}`;
    }
    if (fileName === 'apphub.css') {
      return 'https://community.fastly.steamstatic.com/public/css/skin_1/apphub.css';
    }
    return `${cssV6Base}${fileName}`;
  }

  function isExecutableScriptTag(script) {
    const type = (script.getAttribute('type') || 'text/javascript').trim().toLowerCase();
    if (!type || type === 'text/javascript' || type === 'application/javascript' || type === 'text/jscript') {
      return true;
    }
    return false;
  }

  function isBlockedScriptSrc(src) {
    return /^(chrome-extension|moz-extension|blob):/i.test(src || '') || /alikeguardian|steamdb\.info\/ext/i.test(src || '');
  }

  function isBlockedScriptCode(code) {
    return /alikeguardian|ag_changes|chrome-extension:\/\//i.test(code || '');
  }

  function scriptKey(href) {
    try {
      const u = new URL(href, location.href);
      const parts = u.pathname.split('/').filter(Boolean);
      return (parts.slice(-3).join('/') || u.href).toLowerCase();
    } catch {
      return String(href || '').toLowerCase();
    }
  }

  function loadExternalScript(href) {
    return new Promise((resolve) => {
      const el = document.createElement('script');
      el.src = href;
      el.async = false;
      el.dataset.srbbScript = '1';
      el.onload = () => resolve();
      el.onerror = () => {
        console.warn('[SRBB] failed to load script', href);
        resolve();
      };
      (document.head || document.documentElement).appendChild(el);
    });
  }

  function runInlineScript(code) {
    const el = document.createElement('script');
    el.dataset.srbbScript = '1';
    el.textContent = code;
    (document.body || document.documentElement).appendChild(el);
  }

  function waitForPaint() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  /**
   * Newly injected app CSS must be applied before Steam widgets measure layout.
   * AdjustVisibleAppTags hides every .app_tag when the container width is still 0.
   */
  async function waitForSrbbStylesheets() {
    const links = [...document.querySelectorAll('link[data-srbb-style="1"]')];
    await Promise.all(
      links.map(
        (link) =>
          new Promise((resolve) => {
            if (link.sheet) {
              resolve();
              return;
            }
            const done = () => resolve();
            link.addEventListener('load', done, { once: true });
            link.addEventListener('error', done, { once: true });
            // Sheet may appear between the check and the listeners
            if (link.sheet) done();
          })
      )
    );
    await waitForPaint();
  }

  /**
   * Re-run Steam tag fitting (and a visible fallback) after layout settles.
   * Tags ship as display:none; InitAppTagModal → AdjustVisibleAppTags reveals them by width.
   */
  function fixupSteamWidgets() {
    runInlineScript(`
(function () {
  if (typeof $J === 'undefined') return;

  function fitTags() {
    if (typeof AdjustVisibleAppTags === 'function') {
      $J('.glance_tags.popular_tags, .popular_tags[data-appid], .your_tags[data-appid]').each(function () {
        AdjustVisibleAppTags($J(this));
      });
    }
    $J(window).trigger('resize');

    $J('.glance_tags.popular_tags').each(function () {
      var $tags = $J(this).children('.app_tag:not(.add_button)');
      if ($tags.length && $tags.filter(':visible').length === 0) {
        $tags.show();
      }
    });
  }

  fitTags();
  setTimeout(fitTags, 100);
  setTimeout(fitTags, 400);
})();
`);
  }

  /** Host store session (header), not the anonymous guest HTML we inject. */
  function isHostLoggedIn() {
    if (
      document.querySelector(
        '#account_pulldown, #account_dropdown, #header_notification_area, #global_actions .user_avatar, #global_actions .playerAvatar'
      )
    ) {
      return true;
    }
    if (document.querySelector('#global_actions a[href*="steamcommunity.com/profiles/"], #global_actions a[href*="steamcommunity.com/id/"]')) {
      return true;
    }
    return false;
  }

  /**
   * Guest app HTML assumes an anonymous viewer (“Sign in to add…”, “You're not signed in!”).
   * Drop that chrome when the host store session is already logged in.
   */
  function stripGuestSignedOutChrome(root) {
    if (!isHostLoggedIn()) return;

    const actions = root.querySelector('#queueActionsCtn') || root.querySelector('.queue_actions_ctn');
    if (actions) {
      actions.querySelectorAll(':scope > p').forEach((p) => {
        if (p.querySelector('a[href*="/login"]')) p.remove();
      });
    }

    root.querySelectorAll('.banner_open_in_steam').forEach((el) => el.remove());
  }

  /**
   * Error / Oops shells omit app libs (game.js, gamehighlightplayer.js, …).
   * Load any Steam CDN scripts from the guest document that are not already present.
   * Skips the React store application bundles — those are already booted on the host page.
   */
  async function ensureAppPageScripts(remoteDoc) {
    const existing = new Set(
      [...document.querySelectorAll('script[src]')].map((s) => scriptKey(s.src)).filter(Boolean)
    );
    const toLoad = [];

    remoteDoc.querySelectorAll('script[src]').forEach((script) => {
      if (!isExecutableScriptTag(script)) return;
      const raw = script.getAttribute('src');
      if (!raw || isBlockedScriptSrc(raw)) return;

      let href;
      try {
        href = new URL(raw, 'https://store.steampowered.com/').href;
      } catch {
        return;
      }

      if (!/steamstatic\.com|steampowered\.com/i.test(href)) return;
      if (/\/javascript\/applications\//i.test(href)) return;

      const key = scriptKey(href);
      if (!key || existing.has(key)) return;
      existing.add(key);
      toLoad.push(href);
    });

    for (const href of toLoad) {
      await loadExternalScript(href);
    }
    return toLoad.length;
  }

  /**
   * #app_tagging_modal + InitAppTagModal sit near the footer, outside
   * .game_page_background. ShowAppTagModal is only assigned inside InitAppTagModal.
   * Guest HTML only ships a Sign In panel on the right; restore the tagging form when
   * the host session is already logged in so InitAppTagModal can wire it up.
   */
  function upgradeGuestAppTagModalForHostSession(modal) {
    if (!isHostLoggedIn()) return;
    const right = modal.querySelector('.app_tag_modal_right');
    if (!right || right.querySelector('#app_tag_form')) return;
    if (!right.querySelector('a[href*="/login"]')) return;

    // Steam requires new tags in English; match the logged-in store markup.
    right.innerHTML = `
      <h2>Tags you've applied to this product:<span class="app_tag_modal_tooltip" data-store-tooltip="These are tags you've applied to this product.">(?)</span></h2>
      <div class="app_tags your_tags"></div>
      <p>Enter a new tag in English:</p>
      <p class="small">Suitable tags should be terms that other users would find useful to browse by.</p>
      <form id="app_tag_form" name="app_tag_form">
        <div class="app_tag_form_ctn">
          <div class="gray_bevel for_text_input fullwidth">
            <input type="text" name="tag" value="" autocomplete="off" placeholder="Enter a tag">
          </div>
          <button class="btnv6_blue_hoverfade btn_medium" type="submit"><span>Add</span></button>
        </div>
      </form>
      <div class="previous_tags_ctn">
        <p>Apply a tag you've used on other products:</p>
        <div class="app_tags previous_tags"></div>
      </div>
    `;
  }

  function injectGuestAppTaggingModal(remoteDoc) {
    document.querySelectorAll('#app_tagging_modal').forEach((el) => el.remove());
    const modal = remoteDoc.querySelector('#app_tagging_modal');
    if (!modal) return false;
    const node = document.importNode(modal, true);
    node.querySelectorAll('script').forEach((el) => el.remove());
    absolutizeUrls(node);
    upgradeGuestAppTagModalForHostSession(node);
    (document.body || document.documentElement).appendChild(node);
    return true;
  }

  /**
   * Page-level bootstraps (GStoreItemData, …) sit in <head>/early <body>, outside
   * .game_page_background. Widget inits live inside the extracted game tree.
   * importNode copies <script> nodes but does not execute them — re-create + append.
   */
  function collectGuestInlineScripts(remoteDoc, wrapper) {
    const codes = [];
    const seen = new Set();

    const push = (code) => {
      const trimmed = (code || '').trim();
      if (!trimmed || seen.has(trimmed) || isBlockedScriptCode(trimmed)) return;
      seen.add(trimmed);
      codes.push(trimmed);
    };

    remoteDoc.querySelectorAll('script:not([src])').forEach((script) => {
      if (!isExecutableScriptTag(script)) return;
      const code = script.textContent || '';
      const isStoreBoot =
        /GStoreItemData|g_bUseOldReviewDisplay|g_rgAppKeywords|g_rgAppData/i.test(code) &&
        !/home_tab_section|InitTopSellersControls|g_rgDelayedLoadImages/i.test(code);
      // Defines window.ShowAppTagModal; lives next to #app_tagging_modal (outside game root)
      const isAppTagInit = /InitAppTagModal\s*\(/i.test(code);
      if (isStoreBoot || isAppTagInit) {
        push(code);
      }
    });

    wrapper.querySelectorAll('script').forEach((script) => {
      if (!isExecutableScriptTag(script)) return;
      if (script.getAttribute('src')) return;
      push(script.textContent || '');
    });

    return codes;
  }

  async function injectDirect(remoteGame, remoteDoc, sourceUrl, options = {}) {
    const template = getContentMount();
    clearErrorPageContent(template);
    applyAppBodyClasses();
    ensureAppPageStylesheets(remoteDoc);

    const shell = document.createElement('div');
    shell.className = 'srbb-shell srbb-shell--direct';

    const wrapper = document.createElement('div');
    wrapper.className = 'srbb-injected';

    // Preserve the real Steam wrappers so layout CSS still applies
    if (remoteGame.classList.contains('game_page_background')) {
      wrapper.appendChild(document.importNode(remoteGame, true));
    } else if (remoteGame.id === 'tabletGrid' || remoteGame.classList.contains('tablet_grid')) {
      const bg = document.createElement('div');
      bg.className = 'game_page_background game';
      bg.appendChild(document.importNode(remoteGame, true));
      wrapper.appendChild(bg);
    } else {
      const bg = document.createElement('div');
      bg.className = 'game_page_background game';
      const grid = document.createElement('div');
      grid.id = 'tabletGrid';
      grid.className = 'tablet_grid';
      grid.appendChild(document.importNode(remoteGame, true));
      bg.appendChild(grid);
      wrapper.appendChild(bg);
    }

    const inlineScripts = collectGuestInlineScripts(remoteDoc, wrapper);

    // Drop inert copied scripts + extension junk; Steam JS is re-run below
    wrapper.querySelectorAll('script, .alike_sub, #ag_changes_button, .ag_changes').forEach((el) => el.remove());
    absolutizeUrls(wrapper);
    stripGuestSignedOutChrome(wrapper);
    insertBannerIntoTabletGrid(wrapper, createBanner({ fromCache: !!options.fromCache }));

    shell.appendChild(wrapper);
    template.appendChild(shell);
    injectGuestAppTaggingModal(remoteDoc);

    const title = docTitle(wrapper);
    if (title) document.title = title;
    else if (getAppIdFromUrl(sourceUrl)) {
      /* keep existing title */
    }

    await waitForSrbbStylesheets();
    await ensureAppPageScripts(remoteDoc);
    await waitForPaint();
    // Avoid stacking VisibleAppTags handlers when InitAppTagModal re-runs on Reload
    runInlineScript(`
(function () {
  if (typeof $J !== 'undefined') $J(window).off('resize.VisibleAppTags');
})();
`);
    for (const code of inlineScripts) {
      try {
        runInlineScript(code);
      } catch (err) {
        console.warn('[SRBB] injected script error', err);
      }
    }
    fixupSteamWidgets();
  }

  function insertBannerIntoTabletGrid(root, banner) {
    const grid =
      root.querySelector?.('#tabletGrid') ||
      root.querySelector?.('.tablet_grid') ||
      (root.id === 'tabletGrid' || root.classList?.contains('tablet_grid') ? root : null);
    if (grid) {
      grid.insertBefore(banner, grid.firstChild);
      return;
    }
    const mount =
      root.querySelector?.('.page_content_ctn') ||
      root.querySelector?.('.game_page_background') ||
      root.body ||
      root;
    mount.insertBefore(banner, mount.firstChild);
  }

  function docTitle(root) {
    const name =
      root.querySelector?.('.apphub_AppName')?.textContent ||
      root.querySelector?.('#appHubAppName')?.textContent ||
      root.querySelector?.('.apphub_AppName')?.textContent;
    return name ? `${name.trim()} on Steam` : null;
  }

  function showBypassOffer() {
    const mount = getContentMount();
    if (!mount) return;
    showStatus(mount, 'offer', t('bypassOffer'));
  }

  function showLoaderOverlay(message) {
    document.getElementById('srbb-loader')?.remove();
    document.querySelectorAll('.srbb-status').forEach((el) => el.remove());

    const overlay = document.createElement('div');
    overlay.id = 'srbb-loader';
    overlay.className = 'srbb-loader';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-busy', 'true');
    overlay.innerHTML = `
      <div class="srbb-loader__veil" aria-hidden="true"></div>
      <div class="srbb-loader__card">
        <div class="srbb-loader__badge">${escapeHtml(t('badge'))}</div>
        <div class="srbb-loader__spinner" aria-hidden="true"></div>
        <div class="srbb-loader__title">${escapeHtml(message)}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
  }

  function hideLoaderOverlay() {
    const overlay = document.getElementById('srbb-loader');
    if (!overlay || overlay.dataset.leaving === '1') return;
    overlay.dataset.leaving = '1';
    overlay.classList.remove('is-visible');
    overlay.classList.add('is-leaving');
    const remove = () => overlay.remove();
    overlay.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 320);
  }

  function showStatus(mount, kind, message) {
    hideLoaderOverlay();
    let box = mount.querySelector(':scope > .srbb-status, .srbb-status');
    if (!box || !mount.contains(box)) {
      box = document.createElement('div');
      box.className = 'srbb-status';
      const errorBox = mount.querySelector('#error_box');
      if (errorBox) errorBox.insertAdjacentElement('afterend', box);
      else {
        const header = mount.querySelector('.page_header_ctn');
        if (header) header.insertAdjacentElement('afterend', box);
        else mount.prepend(box);
      }
    }
    box.dataset.kind = kind;
    const primaryAction =
      kind === 'offer'
        ? `<button type="button" class="srbb-btn srbb-btn--green" data-srbb="bypass">${escapeHtml(t('bypassNow'))}</button>`
        : kind === 'error'
          ? `<button type="button" class="srbb-btn" data-srbb="retry">${escapeHtml(t('retry'))}</button>`
          : '';
    box.innerHTML = `
      <div class="srbb-status__row">
        <span class="srbb-status__msg">${escapeHtml(message)}</span>
        <div class="srbb-status__actions">
          ${primaryAction}
          <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="open-settings">${escapeHtml(t('settings'))}</button>
        </div>
      </div>
    `;
    box.querySelector('[data-srbb="bypass"]')?.addEventListener('click', () => bypassRegionBlock());
    box.querySelector('[data-srbb="retry"]')?.addEventListener('click', () => bypassRegionBlock());
    box.querySelector('[data-srbb="open-settings"]')?.addEventListener('click', () => togglePanel(true));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── Guest search (header suggest + /search page) ─── */

  function initSearchUnblocked() {
    observeSearchHeader();
    hookHistoryForSearch();
    syncSearchGuestMode();
    if (settings.searchPageUnblocked && isSearchPage()) {
      scheduleGuestSearchReload();
    }
  }

  function isSearchPage(url = location.href) {
    try {
      const path = new URL(url, location.origin).pathname.replace(/\/+$/, '') || '/';
      return path === '/search';
    } catch {
      return false;
    }
  }

  function observeSearchHeader() {
    const observer = new MutationObserver(() => {
      mountSearchControls();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    mountSearchControls();
  }

  function getSearchForm() {
    return document.querySelector('form[role="search"][action*="/search"]');
  }

  function getSearchInput(form = getSearchForm()) {
    return form?.querySelector('input[name="term"]') || null;
  }

  function getSearchMount(form = getSearchForm()) {
    if (!form) return null;
    return (
      form.closest('div')?.parentElement ||
      form.parentElement ||
      null
    );
  }

  function mountSearchControls() {
    const form = getSearchForm();
    if (!form) return;

    const mount = getSearchMount(form);
    if (mount) mount.classList.add('srbb-search-mount');

    ensureSuggestDropdown(mount);
    bindSearchInput(form);
    syncSearchGuestMode();
  }

  function ensureSuggestDropdown(mount) {
    if (!mount || document.getElementById('srbb-suggest')) return;

    const panel = document.createElement('div');
    panel.id = 'srbb-suggest';
    panel.className = 'srbb-suggest';
    panel.hidden = true;
    panel.setAttribute('role', 'listbox');
    panel.innerHTML = `
      <div class="srbb-suggest__notice" id="srbb-suggest-notice">
        <div class="srbb-suggest__notice-text">${escapeHtml(t('suggestGuestNotice'))}</div>
        <button type="button" class="srbb-suggest__notice-btn" data-srbb="suggest-settings">${escapeHtml(t('suggestGuestSettings'))}</button>
      </div>
      <div class="srbb-suggest__inner"></div>
      <div class="srbb-suggest__probe" id="srbb-suggest-probe" hidden>
        <div class="srbb-suggest__probe-track"><div class="srbb-suggest__probe-fill" id="srbb-suggest-probe-fill"></div></div>
        <div class="srbb-suggest__probe-label" id="srbb-suggest-probe-label"></div>
      </div>
    `;
    mount.appendChild(panel);

    panel.querySelector('[data-srbb="suggest-settings"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSearchSettings();
    });

    panel.addEventListener('mousedown', (e) => {
      // Keep focus in the search field, but allow the settings control to work
      if (e.target.closest('[data-srbb="suggest-settings"]')) return;
      e.preventDefault();
    });
  }

  function openSearchSettings() {
    hideSuggestDropdown();
    void ensureSettingsButton().then(() => {
      togglePanel(true);
      switchPanelTab('search');
    });
  }

  function updateSuggestProbeProgress(progress) {
    const bar = document.getElementById('srbb-suggest-probe');
    const fill = document.getElementById('srbb-suggest-probe-fill');
    const label = document.getElementById('srbb-suggest-probe-label');
    if (!bar || !fill || !label) return;

    if (!progress || !progress.total) {
      bar.hidden = true;
      return;
    }

    bar.hidden = false;
    const pct = Math.round((progress.done / progress.total) * 100);
    fill.style.width = `${pct}%`;
    label.textContent = t('probeProgress', { done: progress.done, total: progress.total });
  }

  function finishSuggestProbe(found) {
    const bar = document.getElementById('srbb-suggest-probe');
    const fill = document.getElementById('srbb-suggest-probe-fill');
    const label = document.getElementById('srbb-suggest-probe-label');
    if (!bar || !fill || !label) return;
    if (found > 0) {
      bar.hidden = false;
      fill.style.width = '100%';
      label.textContent = t('probeFound', { count: found });
      window.setTimeout(() => {
        if (label.textContent === t('probeFound', { count: found })) {
          bar.hidden = true;
        }
      }, 2200);
    } else {
      bar.hidden = true;
    }
  }

  function findSuggestItemByAppId(appId) {
    const panel = document.getElementById('srbb-suggest');
    if (!panel) return null;
    const id = String(appId);
    return (
      [...panel.querySelectorAll('.srbb-suggest__item[data-srbb-app-id]')].find(
        (el) => el.getAttribute('data-srbb-app-id') === id
      ) || null
    );
  }

  function setSuggestItemProbing(appId, probing) {
    const el = findSuggestItemByAppId(appId);
    if (!el) return;
    el.classList.toggle('srbb-suggest__item--probing', !!probing);
    const spin = el.querySelector('.srbb-suggest__probe-spin');
    if (spin) spin.hidden = !probing;
  }

  function markSuggestItemBlockedLive(appId) {
    const el = findSuggestItemByAppId(appId);
    if (!el) return;
    el.classList.add('srbb-suggest__item--blocked');
    const titleRow = el.querySelector('.srbb-suggest__title-row');
    if (titleRow && !titleRow.querySelector('.srbb-suggest__blocked-badge')) {
      const badge = document.createElement('span');
      badge.className = 'srbb-suggest__blocked-badge';
      badge.textContent = t('suggestRegionBlocked');
      titleRow.appendChild(badge);
    }
  }

  async function probeSuggestBlocked(items, token) {
    if (!shouldProbeBlockedScope('suggest')) {
      updateSuggestProbeProgress(null);
      return;
    }

    const apps = items
      .filter((item) => item && item.id && String(item.type || '').toLowerCase() !== 'bundle')
      .map((item) => ({ id: item.id, name: item.name }));

    const result = await runBlockedProbe(apps, {
      isCancelled: () => token !== suggestToken,
      onProgress: (p) => {
        if (token !== suggestToken) return;
        updateSuggestProbeProgress(p);
      },
      onItemStart: (app) => {
        if (token !== suggestToken) return;
        setSuggestItemProbing(app.id, true);
      },
      onItemDone: (app) => {
        if (token !== suggestToken) return;
        setSuggestItemProbing(app.id, false);
      },
      onBlocked: (app) => {
        if (token !== suggestToken) return;
        markSuggestItemBlockedLive(app.id);
      },
    });

    if (token !== suggestToken) return;
    finishSuggestProbe(result.found);
    if (result.found > 0 && lastSuggestItems.length) {
      lastSuggestItems = lastSuggestItems.map((item) => ({
        ...item,
        regionBlocked: isBlockedApp(item.id),
      }));
    }
  }

  function clearSearchInput(input) {
    if (!input) return;
    input.value = '';
    if (suggestDebounceTimer) {
      window.clearTimeout(suggestDebounceTimer);
      suggestDebounceTimer = null;
    }
    suggestToken += 1;
    hideSuggestDropdown();
  }

  function bindSearchInput(form) {
    if (!form || form.dataset.srbbBound === '1') return;
    const input = getSearchInput(form);
    if (!input) return;
    form.dataset.srbbBound = '1';

    input.addEventListener('input', () => {
      handleSuggestInput(input);
    });
    input.addEventListener('focus', () => {
      if (settings.searchUnblocked) handleSuggestInput(input, { fromFocus: true });
    });
    input.addEventListener('blur', () => {
      window.setTimeout(() => hideSuggestDropdown(), 150);
    });
    input.addEventListener('keydown', (e) => handleSearchKeydown(e, input));

    form.addEventListener('submit', (e) => {
      if (!settings.searchUnblocked) return;
      e.preventDefault();
      e.stopPropagation();
      const term = input.value.trim();
      const url = new URL('https://store.steampowered.com/search/');
      if (term) url.searchParams.set('term', term);
      url.searchParams.set('l', getSteamStoreLanguage());
      url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
      url.searchParams.set('ignore_preferences', '1');
      hideSuggestDropdown();
      location.href = url.toString();
    });
  }

  function syncSearchGuestMode() {
    const suggestOn = !!settings.searchUnblocked;
    const pageOn = !!settings.searchPageUnblocked;
    document.documentElement.classList.toggle('srbb-search-guest', suggestOn);
    document.documentElement.classList.toggle('srbb-search-page-guest', pageOn);
    document.getElementById('srbb-search-toggle')?.remove();

    if (!suggestOn) {
      hideSuggestDropdown();
    }

    if (!pageOn) {
      const hadGuestPage =
        !!searchPageLoadedHref ||
        !!searchPageDebounceTimer ||
        !!document.getElementById('srbb-search-banner') ||
        !!document.getElementById('srbb-search-skel') ||
        !!document.getElementById('srbb-search-probe');
      if (hadGuestPage) {
        searchPageToken += 1;
        searchPageLoadedHref = '';
        if (searchPageDebounceTimer) {
          window.clearTimeout(searchPageDebounceTimer);
          searchPageDebounceTimer = null;
        }
      }
      document.getElementById('srbb-search-banner')?.remove();
      document.getElementById('srbb-search-skel')?.remove();
      document.getElementById('srbb-search-status')?.remove();
      document.getElementById('srbb-search-probe')?.remove();
      const liveRoot = findLiveSearchResultsRoot();
      if (liveRoot) liveRoot.hidden = false;
    }
  }

  function syncSearchPanelToggle() {
    const panel = document.getElementById('srbb-panel');
    if (!panel) return;
    const cb = panel.querySelector('#srbb-search-unblocked');
    const pill = panel.querySelector('#srbb-search-pill');
    if (cb) cb.checked = !!settings.searchUnblocked;
    if (pill) {
      pill.textContent = settings.searchUnblocked ? t('on') : t('off');
      pill.classList.toggle('is-on', !!settings.searchUnblocked);
    }
    const pageCb = panel.querySelector('#srbb-search-page-unblocked');
    const pagePill = panel.querySelector('#srbb-search-page-pill');
    if (pageCb) pageCb.checked = !!settings.searchPageUnblocked;
    if (pagePill) {
      pagePill.textContent = settings.searchPageUnblocked ? t('on') : t('off');
      pagePill.classList.toggle('is-on', !!settings.searchPageUnblocked);
    }
    syncProbePanelState();
  }

  function syncProbePanelState() {
    const panel = document.getElementById('srbb-panel');
    if (!panel) return;
    const enabled = panel.querySelector('#srbb-probe-blocked');
    const fields = panel.querySelector('#srbb-probe-fields');
    const note = panel.querySelector('#srbb-probe-note');
    const scope = panel.querySelector('#srbb-probe-scope');
    const concurrency = panel.querySelector('#srbb-probe-concurrency');
    const on = !!settings.probeBlockedInSearch;
    if (enabled) enabled.checked = on;
    if (fields) fields.classList.toggle('is-disabled', !on);
    if (scope) scope.value = normalizeProbeScope(settings.probeBlockedScope);
    if (concurrency) {
      concurrency.value = String(normalizeProbeConcurrency(settings.probeBlockedConcurrency));
    }
    if (note) {
      let msg = '';
      if (on && !isHostLoggedIn()) msg = t('probeNeedLogin');
      else if (on && !settings.rememberBlockedApps) msg = t('probeNeedRemember');
      note.textContent = msg;
      note.hidden = !msg;
    }
  }

  function buildSuggestUrl(term) {
    const url = new URL('https://store.steampowered.com/search/suggest');
    url.searchParams.set('f', 'jsonfull');
    url.searchParams.set('term', term);
    url.searchParams.set('realm', '1');
    url.searchParams.set('require_type', 'game,software');
    url.searchParams.set('l', getSteamStoreLanguage());
    url.searchParams.set('origin', 'https://store.steampowered.com');
    url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
    return url.toString();
  }

  function buildStoreSearchUrl(term) {
    const url = new URL('https://store.steampowered.com/api/storesearch/');
    url.searchParams.set('term', term);
    url.searchParams.set('l', getSteamStoreLanguage());
    url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
    return url.toString();
  }

  function buildSearchResultsMetaUrl(term, count = SUGGEST_RESULT_COUNT) {
    const url = new URL('https://store.steampowered.com/search/results/');
    url.searchParams.set('term', term);
    url.searchParams.set('count', String(count));
    url.searchParams.set('start', '0');
    url.searchParams.set('infinite', '1');
    url.searchParams.set('ignore_preferences', '1');
    url.searchParams.set('l', getSteamStoreLanguage());
    url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
    return url.toString();
  }

  function parseReviewTooltip(tooltipHtml) {
    const text = String(tooltipHtml || '')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"');
    const parts = text
      .split(/<br\s*\/?>/i)
      .map((part) => part.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);
    const summary = parts[0] || '';
    const detail = parts[1] || '';
    const percentMatch = detail.match(/(\d+)\s*%/);
    return {
      summary,
      percent: percentMatch ? percentMatch[1] : '',
      detail: detail || summary,
    };
  }

  function emptySuggestItemFields() {
    return {
      priceLabel: '',
      priceOriginal: '',
      discountPct: 0,
      isFree: false,
      platforms: null,
      metascore: '',
      controllerSupport: '',
      releaseDate: '',
      reviewSummary: '',
      reviewPercent: '',
      reviewTone: '',
      reviewDetail: '',
    };
  }

  function parseSearchResultRowType(row) {
    const href = String(row.getAttribute('href') || '');
    if (/\/bundle\//i.test(href) || row.hasAttribute('data-ds-bundleid')) return 'bundle';
    if (/\/sub\//i.test(href) || row.hasAttribute('data-ds-packageid')) return 'bundle';
    if (row.hasAttribute('data-ds-appid')) return 'game';
    return 'app';
  }

  function parseSearchResultRowPrice(row) {
    let priceLabel = '';
    let priceOriginal = '';
    let discountPct = 0;
    let isFree = false;

    const discountBlock = row.querySelector('.discount_block, .search_discount_block');
    const finalEl = row.querySelector('.discount_final_price, .search_price');
    const originalEl = row.querySelector('.discount_original_price');
    priceLabel = (finalEl?.textContent || '').replace(/\s+/g, ' ').trim();
    priceOriginal = (originalEl?.textContent || '').replace(/\s+/g, ' ').trim();

    if (discountBlock) {
      const rawDiscount = discountBlock.getAttribute('data-discount');
      const parsedDiscount = Number(rawDiscount);
      if (Number.isFinite(parsedDiscount) && parsedDiscount > 0) {
        discountPct = parsedDiscount;
      }
      const priceFinal = Number(discountBlock.getAttribute('data-price-final'));
      if (Number.isFinite(priceFinal) && priceFinal === 0) {
        isFree = true;
      }
    }

    if (!priceLabel) {
      const freeEl = row.querySelector('.search_price.free, .discount_final_price.free');
      if (freeEl) {
        priceLabel = (freeEl.textContent || '').replace(/\s+/g, ' ').trim() || t('suggestFree');
        isFree = true;
      }
    }

    if (priceLabel && /free/i.test(priceLabel)) {
      isFree = true;
      priceLabel = t('suggestFree');
    }

    return { priceLabel, priceOriginal, discountPct, isFree };
  }

  function parseSearchResultRowPlatforms(row) {
    const platRoot = row.querySelector('.search_platforms');
    if (!platRoot) return null;
    const platforms = {
      windows: !!platRoot.querySelector('.platform_img.win, .win'),
      mac: !!platRoot.querySelector('.platform_img.mac, .mac'),
      linux: !!platRoot.querySelector('.platform_img.linux, .linux'),
    };
    if (!platforms.windows && !platforms.mac && !platforms.linux) return null;
    return platforms;
  }

  function parseSearchResultRowReviews(row) {
    const reviewEl = row.querySelector('.search_review_summary');
    if (!reviewEl) {
      return {
        reviewSummary: '',
        reviewPercent: '',
        reviewTone: '',
        reviewDetail: '',
      };
    }

    let reviewTone = '';
    if (reviewEl.classList.contains('positive')) reviewTone = 'positive';
    else if (reviewEl.classList.contains('mixed')) reviewTone = 'mixed';
    else if (reviewEl.classList.contains('negative')) reviewTone = 'negative';

    const parsed = parseReviewTooltip(reviewEl.getAttribute('data-tooltip-html') || '');
    return {
      reviewSummary: parsed.summary,
      reviewPercent: parsed.percent,
      reviewTone,
      reviewDetail: parsed.detail,
    };
  }

  function parseSearchResultItems(html) {
    if (!html) return [];
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const items = [];
    const seen = Object.create(null);

    doc.querySelectorAll('a.search_result_row[data-ds-appid]').forEach((row) => {
      const rawId = String(row.getAttribute('data-ds-appid') || '')
        .split(',')[0]
        .trim();
      if (!rawId || seen[rawId]) return;
      seen[rawId] = true;

      const name = (row.querySelector('.title')?.textContent || '').trim();
      if (!name) return;

      const img = row.querySelector('.search_capsule img, img')?.getAttribute('src') || '';
      const price = parseSearchResultRowPrice(row);
      const reviews = parseSearchResultRowReviews(row);

      items.push({
        id: rawId,
        name,
        type: parseSearchResultRowType(row),
        img,
        ...emptySuggestItemFields(),
        ...price,
        platforms: parseSearchResultRowPlatforms(row),
        releaseDate: (row.querySelector('.search_released')?.textContent || '').trim(),
        ...reviews,
      });
    });

    return items;
  }

  async function fetchSearchResultItems(term) {
    const requestUrl = buildRequestUrl(buildSearchResultsMetaUrl(term, SUGGEST_RESULT_COUNT));
    const response = await gmRequest(requestUrl);
    if (response.status < 200 || response.status >= 400) {
      throw new Error(`HTTP ${response.status}`);
    }
    const parsed = parseJsonResponse(response.responseText || '');
    const html =
      parsed && typeof parsed === 'object' && typeof parsed.results_html === 'string'
        ? parsed.results_html
        : response.responseText || '';
    return parseSearchResultItems(html);
  }

  function mergeSuggestStoreExtras(items, storeItems) {
    if (!storeItems?.length || !items.length) return items;
    const byId = Object.create(null);
    storeItems.forEach((item) => {
      byId[item.id] = item;
    });
    return items.map((item) => {
      const extra = byId[item.id];
      if (!extra) return item;
      return {
        ...item,
        type: item.type || extra.type,
        img: item.img || extra.img,
        priceLabel: extra.priceLabel || item.priceLabel,
        priceOriginal: extra.priceOriginal || item.priceOriginal,
        discountPct: extra.discountPct || item.discountPct,
        isFree: extra.isFree || item.isFree,
        platforms: extra.platforms || item.platforms,
        metascore: extra.metascore || item.metascore,
        controllerSupport: extra.controllerSupport || item.controllerSupport,
      };
    });
  }

  function mergeSuggestSearchFields(items, searchItems) {
    if (!searchItems?.length || !items.length) return items;
    const byId = Object.create(null);
    searchItems.forEach((item) => {
      byId[item.id] = item;
    });
    return items.map((item) => {
      const extra = byId[item.id];
      if (!extra) return item;
      return {
        ...item,
        type: extra.type || item.type,
        img: item.img || extra.img,
        priceLabel: item.priceLabel || extra.priceLabel,
        priceOriginal: item.priceOriginal || extra.priceOriginal,
        discountPct: item.discountPct || extra.discountPct,
        isFree: item.isFree || extra.isFree,
        platforms: item.platforms || extra.platforms,
        releaseDate: extra.releaseDate || item.releaseDate || '',
        reviewSummary: extra.reviewSummary || item.reviewSummary || '',
        reviewPercent: extra.reviewPercent || item.reviewPercent || '',
        reviewTone: extra.reviewTone || item.reviewTone || '',
        reviewDetail: extra.reviewDetail || item.reviewDetail || '',
      };
    });
  }

  function unionSuggestItems(...lists) {
    const seen = Object.create(null);
    const out = [];
    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (!item?.id || seen[item.id]) continue;
        seen[item.id] = true;
        out.push(item);
      }
    }
    return out;
  }

  function buildBlockedAppCapsule(appId) {
    return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_231x87.jpg`;
  }

  function collectBlockedSuggestMatches(term) {
    if (!settings.markBlockedInSearch && !settings.rememberBlockedApps) return [];
    const q = String(term || '')
      .trim()
      .toLowerCase();
    if (q.length < 2) return [];

    const store = loadBlockedAppsStore();
    const matches = [];
    for (const [id, entry] of Object.entries(store)) {
      const name = String(entry && entry.name ? entry.name : '').trim();
      const hay = `${name} ${id}`.toLowerCase();
      if (!hay.includes(q)) continue;
      matches.push({
        id: String(id),
        name: name || `App ${id}`,
        type: 'game',
        img: buildBlockedAppCapsule(id),
        ...emptySuggestItemFields(),
      });
    }
    return matches;
  }

  function trimSuggestItems(items, mustKeepIds) {
    if (items.length <= SUGGEST_RESULT_COUNT) return items;
    const mustKeep = mustKeepIds instanceof Set ? mustKeepIds : new Set(mustKeepIds || []);
    const kept = items.slice(0, SUGGEST_RESULT_COUNT);
    const keptIds = new Set(kept.map((item) => item.id));
    for (const item of items.slice(SUGGEST_RESULT_COUNT)) {
      if (!mustKeep.has(item.id) || keptIds.has(item.id)) continue;
      kept.push(item);
      keptIds.add(item.id);
    }
    return kept;
  }

  function parseJsonResponse(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return null;
    const jsonStart = trimmed.search(/[\[{]/);
    if (jsonStart < 0) return null;
    try {
      return JSON.parse(trimmed.slice(jsonStart));
    } catch {
      return null;
    }
  }

  function formatMoneyAmount(amount, currency) {
    if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
    const value = amount / 100;
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${value} ${currency || ''}`.trim();
    }
  }

  function getSuggestTypeLabel(type) {
    const key = {
      game: 'suggestTypeGame',
      app: 'suggestTypeApp',
      software: 'suggestTypeSoftware',
      dlc: 'suggestTypeDlc',
      bundle: 'suggestTypeBundle',
    }[String(type || '').toLowerCase()];
    return key ? t(key) : String(type || '');
  }

  function normalizeSuggestItem(item) {
    if (!item || typeof item !== 'object') return null;
    const id = item.id ?? item.appid;
    const name = item.name || '';
    if (!id || !name) return null;

    const type = String(item.type || 'game').toLowerCase();
    const img = item.small_cap || item.img || item.tiny_image || '';

    const platforms =
      item.platforms && typeof item.platforms === 'object'
        ? {
            windows: !!item.platforms.windows,
            mac: !!item.platforms.mac,
            linux: !!item.platforms.linux,
          }
        : null;

    const metascore = String(item.metascore || '').trim();
    const controllerSupport = String(item.controller_support || '').toLowerCase();

    let priceLabel = '';
    let priceOriginal = '';
    let discountPct = 0;
    let isFree = false;

    const price = item.price;
    if (price && typeof price === 'object') {
      const currency = price.currency || '';
      const final = price.final;
      const initial = price.initial;
      if (typeof final === 'number') {
        if (final === 0 && (!initial || initial === 0)) {
          isFree = true;
          priceLabel = t('suggestFree');
        } else {
          priceLabel = formatMoneyAmount(final, currency);
          if (typeof initial === 'number' && initial > final && initial > 0) {
            priceOriginal = formatMoneyAmount(initial, currency);
            discountPct = Math.round((1 - final / initial) * 100);
          }
        }
      }
    } else if (typeof price === 'string' && price.trim()) {
      priceLabel = price.trim();
      if (/free/i.test(priceLabel)) isFree = true;
    }

    return {
      id: String(id),
      name,
      type,
      img,
      priceLabel,
      priceOriginal,
      discountPct,
      isFree,
      platforms,
      metascore,
      controllerSupport,
      releaseDate: '',
      reviewSummary: '',
      reviewPercent: '',
      reviewTone: '',
      reviewDetail: '',
    };
  }

  function normalizeSuggestItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizeSuggestItem).filter(Boolean);
  }

  async function requestGuestJson(targetUrl) {
    const requestUrl = buildRequestUrl(targetUrl);
    const response = await gmRequest(requestUrl);
    if (response.status < 200 || response.status >= 400) {
      throw new Error(`HTTP ${response.status}`);
    }
    const parsed = parseJsonResponse(response.responseText || '');
    if (parsed === null) {
      throw new Error(t('noContent'));
    }
    return parsed;
  }

  function buildAppHref(appId, name = '') {
    const slug =
      String(name)
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_') || 'app';
    return `https://store.steampowered.com/app/${appId}/${slug}/`;
  }

  function handleSuggestInput(input, options = {}) {
    if (!settings.searchUnblocked) return;
    const term = input.value.trim();
    if (!term) {
      if (suggestDebounceTimer) {
        window.clearTimeout(suggestDebounceTimer);
        suggestDebounceTimer = null;
      }
      suggestToken += 1;
      if (options.fromFocus) {
        showSuggestMessage(t('suggestEmpty'));
        showSuggestDropdown();
      } else {
        hideSuggestDropdown();
      }
      return;
    }

    if (suggestDebounceTimer) window.clearTimeout(suggestDebounceTimer);
    suggestDebounceTimer = window.setTimeout(() => {
      fetchGuestSuggestions(term);
    }, 550);
  }

  async function fetchGuestSuggestions(term) {
    const token = ++suggestToken;
    updateSuggestProbeProgress(null);
    showSuggestSkeleton(Math.min(8, SUGGEST_RESULT_COUNT));

    try {
      let items = [];
      let storeItems = [];
      let searchItems = [];
      const blockedMatches = collectBlockedSuggestMatches(term);

      const [storeParsed, searchParsed] = await Promise.all([
        requestGuestJson(buildStoreSearchUrl(term)).catch(() => null),
        fetchSearchResultItems(term).catch(() => null),
      ]);
      if (token !== suggestToken) return;

      if (storeParsed) {
        storeItems = normalizeSuggestItems(storeParsed.items || []);
      }
      if (Array.isArray(searchParsed)) {
        searchItems = searchParsed;
      }

      // storesearch ranking keeps region-restricted titles in natural relevance order;
      // /search/results fills the rest (Steam often hides unavailable apps from that HTML)
      items = unionSuggestItems(storeItems, searchItems, blockedMatches);

      if (!items.length) {
        const suggestParsed = await requestGuestJson(buildSuggestUrl(term));
        if (token !== suggestToken) return;
        items = normalizeSuggestItems(
          Array.isArray(suggestParsed) ? suggestParsed : suggestParsed.items
        );
        items = unionSuggestItems(items, blockedMatches);
      }

      if (!items.length) {
        showSuggestMessage(t('suggestNoResults'));
        return;
      }

      items = mergeSuggestSearchFields(items, searchItems);
      items = mergeSuggestStoreExtras(items, storeItems);
      items = trimSuggestItems(
        items,
        blockedMatches.map((item) => item.id).concat(storeItems.map((item) => item.id))
      );

      items.forEach((item) => {
        if (isBlockedApp(item.id)) touchBlockedAppName(item.id, item.name);
      });
      lastSuggestItems = items;
      renderSuggestItems(prepareSuggestItems(items));
      void probeSuggestBlocked(items, token);
    } catch (err) {
      if (token !== suggestToken) return;
      showSuggestMessage(
        t('suggestFailed', { error: err && err.message ? err.message : String(err) })
      );
    }
  }

  function buildSuggestPriceHtml(item) {
    if (!item.priceLabel && !item.isFree) return '';
    const parts = [];
    if (item.discountPct > 0) {
      parts.push(`<span class="srbb-suggest__discount">-${item.discountPct}%</span>`);
    }
    if (item.priceOriginal) {
      parts.push(`<span class="srbb-suggest__price-old">${escapeHtml(item.priceOriginal)}</span>`);
    }
    if (item.priceLabel) {
      parts.push(
        `<span class="srbb-suggest__price${item.isFree ? ' srbb-suggest__price--free' : ''}">${escapeHtml(item.priceLabel)}</span>`
      );
    }
    return `<div class="srbb-suggest__prices">${parts.join('')}</div>`;
  }

  function buildSuggestPlatformsHtml(item) {
    if (!item.platforms) return '';
    const chips = [];
    if (item.platforms.windows) {
      chips.push('<span class="srbb-suggest__plat" title="Windows">Win</span>');
    }
    if (item.platforms.mac) {
      chips.push('<span class="srbb-suggest__plat" title="macOS">Mac</span>');
    }
    if (item.platforms.linux) {
      chips.push('<span class="srbb-suggest__plat" title="Linux">Linux</span>');
    }
    if (!chips.length) return '';
    return `<div class="srbb-suggest__platforms">${chips.join('')}</div>`;
  }

  function buildSuggestFactsHtml(item) {
    const parts = [];
    if (item.releaseDate) {
      parts.push(`<span class="srbb-suggest__release">${escapeHtml(item.releaseDate)}</span>`);
    }
    if (item.reviewSummary) {
      const toneClass = item.reviewTone ? ` srbb-suggest__review--${item.reviewTone}` : '';
      const label =
        item.reviewPercent
          ? t('suggestReviews', { summary: item.reviewSummary, percent: item.reviewPercent })
          : item.reviewSummary;
      const title = item.reviewDetail || item.reviewSummary;
      parts.push(
        `<span class="srbb-suggest__review${toneClass}" title="${escapeHtml(title)}">${escapeHtml(label)}</span>`
      );
    }
    if (!parts.length) return '';
    return `<div class="srbb-suggest__facts">${parts.join('<span class="srbb-suggest__facts-sep" aria-hidden="true">·</span>')}</div>`;
  }

  function buildSuggestExtrasHtml(item) {
    const chips = [];
    const typeLabel = getSuggestTypeLabel(item.type);
    if (typeLabel) {
      chips.push(`<span class="srbb-suggest__chip">${escapeHtml(typeLabel)}</span>`);
    }
    if (item.metascore) {
      chips.push(
        `<span class="srbb-suggest__chip srbb-suggest__chip--score">${escapeHtml(t('suggestMetascore', { score: item.metascore }))}</span>`
      );
    }
    if (item.controllerSupport === 'full') {
      chips.push(
        `<span class="srbb-suggest__chip">${escapeHtml(t('suggestControllerFull'))}</span>`
      );
    } else if (item.controllerSupport === 'partial') {
      chips.push(
        `<span class="srbb-suggest__chip">${escapeHtml(t('suggestControllerPartial'))}</span>`
      );
    }
    if (!chips.length) return '';
    return `<div class="srbb-suggest__chips">${chips.join('')}</div>`;
  }

  function renderSuggestItemHtml(item, index) {
    const href = buildAppHref(item.id, item.name);
    const img = item.img || '';
    const blockedClass = item.regionBlocked ? ' srbb-suggest__item--blocked' : '';
    return `
      <a class="srbb-suggest__item${blockedClass}" role="option" data-srbb-suggest-index="${index}" data-srbb-app-id="${escapeHtml(String(item.id))}" href="${escapeHtml(href)}">
        ${img ? `<img class="srbb-suggest__img" alt="" src="${escapeHtml(img)}" loading="lazy" />` : ''}
        <div class="srbb-suggest__meta">
          <div class="srbb-suggest__title-row">
            <div class="srbb-suggest__name">${escapeHtml(item.name)}</div>
            <span class="srbb-suggest__probe-spin" hidden aria-hidden="true"></span>
            ${buildSuggestBlockedBadgeHtml(item)}
          </div>
          <div class="srbb-suggest__details">
            ${buildSuggestPriceHtml(item)}
            ${buildSuggestPlatformsHtml(item)}
          </div>
          ${buildSuggestFactsHtml(item)}
          <div class="srbb-suggest__footer">
            ${buildSuggestExtrasHtml(item)}
            <span class="srbb-suggest__id">${escapeHtml(t('suggestAppId', { id: item.id }))}</span>
          </div>
        </div>
      </a>
    `;
  }

  function renderSuggestItems(items) {
    const panel = document.getElementById('srbb-suggest');
    if (!panel) return;

    activeSuggestIndex = -1;
    const inner = panel.querySelector('.srbb-suggest__inner');
    if (!inner) return;

    panel.removeAttribute('aria-busy');
    panel.removeAttribute('aria-label');
    inner.innerHTML = items.map((item, index) => renderSuggestItemHtml(item, index)).join('');

    inner.querySelectorAll('.srbb-suggest__item').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        setActiveSuggestItem(Number(el.dataset.srbbSuggestIndex));
      });
    });

    showSuggestDropdown();
  }

  function showSuggestSkeleton(count = 5) {
    const panel = document.getElementById('srbb-suggest');
    if (!panel) return;
    const inner = panel.querySelector('.srbb-suggest__inner');
    if (!inner) return;
    activeSuggestIndex = -1;
    const rows = Array.from({ length: count }, () => `
      <div class="srbb-suggest__skel" aria-hidden="true">
        <div class="srbb-skel srbb-suggest__skel-img"></div>
        <div class="srbb-suggest__skel-meta">
          <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--title"></div>
          <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--sub"></div>
          <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--facts"></div>
          <div class="srbb-suggest__skel-chips">
            <div class="srbb-skel srbb-suggest__skel-chip"></div>
            <div class="srbb-skel srbb-suggest__skel-chip"></div>
            <div class="srbb-skel srbb-suggest__skel-chip srbb-suggest__skel-chip--short"></div>
          </div>
        </div>
      </div>
    `).join('');
    inner.innerHTML = rows;
    panel.setAttribute('aria-busy', 'true');
    panel.setAttribute('aria-label', t('suggestLoading'));
    showSuggestDropdown();
  }

  function showSuggestMessage(message) {
    const panel = document.getElementById('srbb-suggest');
    if (!panel) return;
    const inner = panel.querySelector('.srbb-suggest__inner');
    if (!inner) return;
    activeSuggestIndex = -1;
    panel.removeAttribute('aria-busy');
    panel.removeAttribute('aria-label');
    inner.innerHTML = `<div class="srbb-suggest__message">${escapeHtml(message)}</div>`;
    showSuggestDropdown();
  }

  function showSuggestDropdown() {
    const panel = document.getElementById('srbb-suggest');
    if (!panel || !settings.searchUnblocked) return;
    panel.hidden = false;
    panel.classList.add('is-open');
  }

  function hideSuggestDropdown() {
    const panel = document.getElementById('srbb-suggest');
    if (!panel) return;
    panel.hidden = true;
    panel.classList.remove('is-open');
    panel.removeAttribute('aria-busy');
    panel.removeAttribute('aria-label');
    activeSuggestIndex = -1;
    panel.querySelectorAll('.srbb-suggest__item.is-active').forEach((el) => {
      el.classList.remove('is-active');
    });
    updateSuggestProbeProgress(null);
  }

  function setActiveSuggestItem(index) {
    const panel = document.getElementById('srbb-suggest');
    if (!panel) return;
    const items = [...panel.querySelectorAll('.srbb-suggest__item')];
    if (!items.length) return;
    activeSuggestIndex = Math.max(0, Math.min(index, items.length - 1));
    items.forEach((el, i) => el.classList.toggle('is-active', i === activeSuggestIndex));
  }

  function handleSearchKeydown(e, input) {
    if (e.key === 'Escape') {
      const panel = document.getElementById('srbb-suggest');
      const suggestOpen = !!(panel && !panel.hidden);
      if (suggestOpen) {
        e.preventDefault();
        hideSuggestDropdown();
        return;
      }
      if (input.value) {
        e.preventDefault();
        clearSearchInput(input);
        return;
      }
      input.blur();
      return;
    }

    if (!settings.searchUnblocked) return;
    const panel = document.getElementById('srbb-suggest');
    if (!panel || panel.hidden) return;

    const items = [...panel.querySelectorAll('.srbb-suggest__item')];
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestItem(activeSuggestIndex + 1);
      showSuggestDropdown();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestItem(activeSuggestIndex <= 0 ? items.length - 1 : activeSuggestIndex - 1);
      showSuggestDropdown();
      return;
    }
    if (e.key === 'Enter' && activeSuggestIndex >= 0) {
      e.preventDefault();
      const target = items[activeSuggestIndex];
      if (target?.href) location.href = target.href;
    }
  }

  function hookHistoryForSearch() {
    if (historyHooked) return;
    historyHooked = true;

    const wrap = (fn) =>
      function (...args) {
        const ret = fn.apply(this, args);
        scheduleGuestSearchReload();
        return ret;
      };

    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', scheduleGuestSearchReload);
  }

  function scheduleGuestSearchReload(options = {}) {
    if (!settings.searchPageUnblocked || !isSearchPage()) return;
    const forceRefresh = !!options.forceRefresh;
    if (!forceRefresh && location.href === searchPageLoadedHref) return;
    if (searchPageDebounceTimer) window.clearTimeout(searchPageDebounceTimer);
    searchPageDebounceTimer = window.setTimeout(() => {
      loadGuestSearchPage(options);
    }, options.immediate ? 0 : 200);
  }

  function extractSearchResultsRoot(doc) {
    const rows = doc.querySelector('#search_resultsRows');
    if (rows) {
      return rows.closest('#search_results') || rows.closest('#search_result_container') || rows.parentElement;
    }
    return (
      doc.querySelector('#search_results') ||
      doc.querySelector('#search_result_container') ||
      doc.querySelector('#search_results_ctn') ||
      doc.querySelector('.search_results') ||
      null
    );
  }

  function findLiveSearchResultsRoot() {
    const rows = document.querySelector('#search_resultsRows');
    if (rows) {
      return (
        rows.closest('#search_results') ||
        rows.closest('#search_result_container') ||
        rows.parentElement
      );
    }
    return (
      document.querySelector('#search_results') ||
      document.querySelector('#search_result_container') ||
      document.querySelector('#search_results_ctn') ||
      document.querySelector('.search_results') ||
      null
    );
  }

  function getSearchTermFromLocation() {
    try {
      return new URL(location.href).searchParams.get('term') || '';
    } catch {
      return '';
    }
  }

  function buildInjectedSearchRowHtml(item) {
    const href = buildAppHref(item.id, item.name);
    const img = item.img || buildBlockedAppCapsule(item.id);
    const release = item.releaseDate
      ? `<div class="search_released responsive_secondrow">${escapeHtml(item.releaseDate)}</div>`
      : '<div class="search_released responsive_secondrow"></div>';
    const price = item.priceLabel
      ? `<div class="search_price_discount_combined responsive_secondrow"><div class="discount_block search_discount_block"><div class="discount_prices"><div class="discount_final_price">${escapeHtml(item.priceLabel)}</div></div></div></div>`
      : '<div class="search_price_discount_combined responsive_secondrow"></div>';
    return `
      <a href="${escapeHtml(href)}" data-ds-appid="${escapeHtml(String(item.id))}" data-ds-itemkey="App_${escapeHtml(String(item.id))}" class="search_result_row ds_collapse_flag srbb-search-row--injected">
        <div class="search_capsule"><img src="${escapeHtml(img)}" alt=""></div>
        <div class="responsive_search_name_combined">
          <div class="search_name ellipsis"><span class="title">${escapeHtml(item.name)}</span></div>
          ${release}
          ${price}
        </div>
      </a>
    `;
  }

  async function injectHiddenSearchHits(token) {
    const term = getSearchTermFromLocation().trim();
    if (!term) return;

    const rowsHost = document.querySelector('#search_resultsRows');
    if (!rowsHost) return;

    const rowById = new Map();
    collectSearchResultApps(rowsHost).forEach((app) => {
      if (app?.id && app.row) rowById.set(String(app.id), app.row);
    });

    let storeItems = [];
    try {
      const storeParsed = await requestGuestJson(buildStoreSearchUrl(term));
      if (token !== searchPageToken) return;
      storeItems = normalizeSuggestItems(storeParsed?.items || []);
    } catch {
      /* keep blocked-only injection */
    }

    const blockedMatches = collectBlockedSuggestMatches(term);
    // storesearch first so hidden titles keep Steam's relevance ranking
    const ranked = unionSuggestItems(storeItems, blockedMatches);
    const missing = ranked.filter((item) => item?.id && !rowById.has(String(item.id)));
    if (!missing.length) return;

    for (const item of missing) {
      if (token !== searchPageToken) return;
      const id = String(item.id);
      const wrap = document.createElement('div');
      wrap.innerHTML = buildInjectedSearchRowHtml(item).trim();
      const row = wrap.firstElementChild;
      if (!row) continue;

      const itemRank = ranked.findIndex((entry) => String(entry.id) === id);
      let inserted = false;
      for (let j = itemRank + 1; j < ranked.length; j += 1) {
        const anchor = rowById.get(String(ranked[j].id));
        if (anchor && anchor.parentNode === rowsHost) {
          rowsHost.insertBefore(row, anchor);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        let prev = null;
        for (let j = itemRank - 1; j >= 0; j -= 1) {
          const candidate = rowById.get(String(ranked[j].id));
          if (candidate && candidate.parentNode === rowsHost) {
            prev = candidate;
            break;
          }
        }
        if (prev) {
          prev.after(row);
        } else {
          const firstExisting = rowsHost.querySelector('a.search_result_row, .search_result_row');
          if (firstExisting) rowsHost.insertBefore(row, firstExisting);
          else rowsHost.appendChild(row);
        }
      }
      rowById.set(id, row);
    }
  }

  function decorateBlockedSearchResults(root = document) {
    if (!settings.markBlockedInSearch || !getBlockedAppsCount()) return;

    const rows = root.querySelectorAll(
      '#search_resultsRows .search_result_row, a.search_result_row, .search_result_row'
    );
    rows.forEach((row) => {
      const rawDsId = String(row.getAttribute('data-ds-appid') || '')
        .split(',')[0]
        .trim();
      const link =
        row.matches('a[href*="/app/"]') ? row : row.querySelector('a[href*="/app/"]');
      const appId = rawDsId || (link ? getAppIdFromUrl(link.href) : null);
      if (!appId || !isBlockedApp(appId)) return;
      row.classList.add('srbb-search-row--blocked');
      if (row.querySelector('.srbb-blocked-mark')) return;

      const mark = document.createElement('span');
      mark.className = 'srbb-blocked-mark';
      mark.textContent = t('suggestRegionBlocked');
      const title = row.querySelector('.title, .search_name, .search_title, .col.search_name');
      if (title) title.appendChild(mark);
      else row.appendChild(mark);
    });
  }

  function collectSearchResultApps(root = document) {
    const rows = root.querySelectorAll(
      '#search_resultsRows .search_result_row, a.search_result_row, .search_result_row'
    );
    const apps = [];
    const seen = Object.create(null);
    rows.forEach((row) => {
      const rawDsId = String(row.getAttribute('data-ds-appid') || '')
        .split(',')[0]
        .trim();
      const link =
        row.matches('a[href*="/app/"]') ? row : row.querySelector('a[href*="/app/"]');
      const appId = rawDsId || (link ? getAppIdFromUrl(link.href) : null);
      if (!appId || seen[appId]) return;
      seen[appId] = true;
      const name =
        row.querySelector('.title, .search_name, .search_title, .col.search_name')?.textContent?.trim() ||
        '';
      apps.push({ id: appId, name, row });
    });
    return apps;
  }

  function ensureSearchProbeStatus(mount) {
    let statusEl = document.getElementById('srbb-search-probe');
    if (statusEl) return statusEl;
    const host = mount?.parentElement || mount || findLiveSearchResultsRoot()?.parentElement;
    if (!host) return null;
    statusEl = document.createElement('div');
    statusEl.id = 'srbb-search-probe';
    statusEl.className = 'srbb-search-probe';
    statusEl.hidden = true;
    statusEl.innerHTML = `
      <div class="srbb-search-probe__row">
        <span class="srbb-search-probe__spin" aria-hidden="true"></span>
        <span class="srbb-search-probe__label" id="srbb-search-probe-label"></span>
      </div>
      <div class="srbb-search-probe__track"><div class="srbb-search-probe__fill" id="srbb-search-probe-fill"></div></div>
    `;
    const banner = document.getElementById('srbb-search-banner');
    if (banner) banner.insertAdjacentElement('afterend', statusEl);
    else host.insertAdjacentElement('afterbegin', statusEl);
    return statusEl;
  }

  function updateSearchProbeProgress(progress) {
    const bar = document.getElementById('srbb-search-probe');
    const fill = document.getElementById('srbb-search-probe-fill');
    const label = document.getElementById('srbb-search-probe-label');
    if (!bar || !fill || !label) return;
    if (!progress || !progress.total) {
      bar.hidden = true;
      bar.dataset.kind = '';
      return;
    }
    bar.hidden = false;
    bar.dataset.kind = 'loading';
    fill.style.width = `${Math.round((progress.done / progress.total) * 100)}%`;
    label.textContent = t('probeProgress', { done: progress.done, total: progress.total });
  }

  function finishSearchProbe(found) {
    const bar = document.getElementById('srbb-search-probe');
    const fill = document.getElementById('srbb-search-probe-fill');
    const label = document.getElementById('srbb-search-probe-label');
    if (!bar || !fill || !label) return;
    if (found > 0) {
      bar.hidden = false;
      bar.dataset.kind = 'done';
      fill.style.width = '100%';
      label.textContent = t('probeFound', { count: found });
      window.setTimeout(() => {
        if (bar.dataset.kind === 'done') bar.hidden = true;
      }, 2800);
    } else {
      bar.hidden = true;
      bar.dataset.kind = '';
    }
  }

  async function probeSearchPageBlocked(token) {
    if (!shouldProbeBlockedScope('search')) return;
    const liveRoot = findLiveSearchResultsRoot();
    if (!liveRoot) return;

    ensureSearchBanner(liveRoot.parentElement || liveRoot);
    ensureSearchProbeStatus(liveRoot);

    const apps = collectSearchResultApps(document);
    const result = await runBlockedProbe(apps, {
      isCancelled: () => token !== searchPageToken,
      onProgress: (p) => {
        if (token !== searchPageToken) return;
        updateSearchProbeProgress(p);
      },
      onItemStart: (app) => {
        if (token !== searchPageToken) return;
        app.row?.classList.add('srbb-search-row--probing');
      },
      onItemDone: (app) => {
        if (token !== searchPageToken) return;
        app.row?.classList.remove('srbb-search-row--probing');
      },
      onBlocked: (app) => {
        if (token !== searchPageToken) return;
        if (app.row && settings.markBlockedInSearch && !app.row.querySelector('.srbb-blocked-mark')) {
          const mark = document.createElement('span');
          mark.className = 'srbb-blocked-mark';
          mark.textContent = t('suggestRegionBlocked');
          const title = app.row.querySelector(
            '.title, .search_name, .search_title, .col.search_name'
          );
          if (title) title.appendChild(mark);
          else app.row.appendChild(mark);
          app.row.classList.add('srbb-search-row--blocked');
        }
      },
    });

    if (token !== searchPageToken) return;
    decorateBlockedSearchResults();
    finishSearchProbe(result.found);
  }

  function ensureSearchBanner(mount) {
    if (!mount || document.getElementById('srbb-search-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'srbb-search-banner';
    banner.className = 'srbb-search-banner';
    banner.innerHTML = `
      <span class="srbb-search-banner__badge">${escapeHtml(t('badge'))}</span>
      <span class="srbb-search-banner__text">${escapeHtml(t('searchPageBanner'))}</span>
      <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="search-settings">${escapeHtml(t('searchPageBannerSettings'))}</button>
      <button type="button" class="srbb-btn srbb-btn--ghost srbb-search-banner__reload" data-srbb="search-reload">${escapeHtml(t('reload'))}</button>
    `;
    banner.querySelector('[data-srbb="search-reload"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      loadGuestSearchPage({ forceRefresh: true });
    });
    banner.querySelector('[data-srbb="search-settings"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSearchSettings();
    });
    mount.insertAdjacentElement('beforebegin', banner);
  }

  function buildSearchPageSkeletonHtml(count = 8) {
    const rows = Array.from({ length: count }, (_, i) => {
      const wTitle = 42 + ((i * 17) % 38);
      const wMeta = 28 + ((i * 11) % 30);
      return `
        <div class="srbb-search-skel__row" aria-hidden="true">
          <div class="srbb-skel srbb-search-skel__cap"></div>
          <div class="srbb-search-skel__body">
            <div class="srbb-skel srbb-search-skel__title" style="width:${wTitle}%"></div>
            <div class="srbb-skel srbb-search-skel__meta" style="width:${wMeta}%"></div>
          </div>
          <div class="srbb-skel srbb-search-skel__price"></div>
        </div>
      `;
    }).join('');
    return `
      <div class="srbb-search-skel" aria-busy="true" aria-label="${escapeHtml(t('searchPageLoading'))}">
        ${rows}
      </div>
    `;
  }

  function showSearchPageSkeleton(liveRoot) {
    if (!liveRoot) return null;
    document.getElementById('srbb-search-status')?.remove();
    let skel = document.getElementById('srbb-search-skel');
    if (!skel) {
      skel = document.createElement('div');
      skel.id = 'srbb-search-skel';
      liveRoot.insertAdjacentElement('beforebegin', skel);
    }
    skel.className = 'srbb-search-skel-wrap';
    skel.dataset.kind = 'loading';
    skel.innerHTML = buildSearchPageSkeletonHtml();
    skel.hidden = false;
    liveRoot.hidden = true;
    return skel;
  }

  function clearSearchPageSkeleton(liveRoot) {
    document.getElementById('srbb-search-skel')?.remove();
    if (liveRoot) liveRoot.hidden = false;
  }

  async function loadGuestSearchPage(options = {}) {
    if (!settings.searchPageUnblocked || !isSearchPage()) return;

    const forceRefresh = !!options.forceRefresh;
    if (forceRefresh) searchPageLoadedHref = '';
    const token = ++searchPageToken;
    const mount = findLiveSearchResultsRoot() || getContentMount();
    if (!mount) return;

    ensureSearchBanner(mount.parentElement || mount);

    const liveRoot = findLiveSearchResultsRoot() || mount;
    showSearchPageSkeleton(liveRoot);

    try {
      const targetUrl = buildTargetUrl();
      let html = null;
      let fromCache = false;

      if (!forceRefresh) {
        html = readPageCache(targetUrl);
        fromCache = !!html;
      } else {
        invalidatePageCache(targetUrl);
      }

      if (!html) {
        const requestUrl = buildRequestUrl(targetUrl);
        const response = await gmRequest(requestUrl);
        if (token !== searchPageToken) return;

        if (response.status < 200 || response.status >= 400) {
          throw new Error(`HTTP ${response.status}`);
        }
        html = response.responseText || '';
      }

      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (token !== searchPageToken) return;

      const remoteRoot = extractSearchResultsRoot(doc);
      if (!remoteRoot) {
        if (fromCache) invalidatePageCache(targetUrl);
        clearSearchPageSkeleton(liveRoot);
        let statusEl = document.getElementById('srbb-search-status');
        if (!statusEl) {
          statusEl = document.createElement('div');
          statusEl.id = 'srbb-search-status';
          statusEl.className = 'srbb-search-status';
          liveRoot.insertAdjacentElement('beforebegin', statusEl);
        }
        statusEl.textContent = t('searchPageNoContent');
        statusEl.dataset.kind = 'error';
        searchPageLoadedHref = location.href;
        return;
      }

      if (!fromCache) {
        writePageCache(targetUrl, html);
      }

      const currentRoot = findLiveSearchResultsRoot() || liveRoot;
      if (!currentRoot) {
        clearSearchPageSkeleton(null);
        return;
      }

      document.getElementById('srbb-search-skel')?.remove();
      document.getElementById('srbb-search-status')?.remove();
      currentRoot.hidden = false;
      currentRoot.replaceWith(document.importNode(remoteRoot, true));
      ensureSearchBanner(findLiveSearchResultsRoot()?.parentElement || mount.parentElement);
      await injectHiddenSearchHits(token);
      if (token !== searchPageToken) return;
      decorateBlockedSearchResults();
      // Mark before probe/DOM tweaks so MutationObserver remounts do not re-fetch
      searchPageLoadedHref = location.href;
      void probeSearchPageBlocked(token);
    } catch (err) {
      if (token !== searchPageToken) return;
      clearSearchPageSkeleton(liveRoot);
      let statusEl = document.getElementById('srbb-search-status');
      if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'srbb-search-status';
        statusEl.className = 'srbb-search-status';
        liveRoot.insertAdjacentElement('beforebegin', statusEl);
      }
      statusEl.textContent = t('failedLoad', {
        error: err && err.message ? err.message : String(err),
      });
      statusEl.dataset.kind = 'error';
    }
  }

  /* ─── Header button + settings panel ─── */

  function observeHeader() {
    const observer = new MutationObserver(() => {
      if (!document.getElementById('srbb-settings-btn')) {
        ensureSettingsButton();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  async function ensureSettingsButton() {
    const host = await waitForElement('#global_actions', 20000);
    if (!host || document.getElementById('srbb-settings-btn')) {
      updateButtonState();
      return document.getElementById('srbb-settings-btn');
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'srbb-settings-btn';
    btn.className = 'srbb-header-btn';
    btn.title = t('btnTitle');
    btn.innerHTML = `
      <span class="srbb-header-btn__text">${escapeHtml(t('btnText'))}</span>
      <span class="srbb-header-btn__dot" id="srbb-proxy-dot"></span>
    `;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });

    // Prefer placing before SIH / account controls: first child of #global_actions
    const sihBtn = host.querySelector('.sih-features-button');
    if (sihBtn) host.insertBefore(btn, sihBtn);
    else host.insertBefore(btn, host.firstChild);

    ensurePanel();
    updateButtonState();
    return btn;
  }

  function updateButtonState() {
    const dot = document.getElementById('srbb-proxy-dot');
    const btn = document.getElementById('srbb-settings-btn');
    if (dot) {
      dot.classList.toggle('is-on', !!settings.proxyEnabled);
      dot.title = settings.proxyEnabled ? t('proxyOn') : t('proxyOff');
    }
    if (btn) {
      btn.classList.toggle('is-proxy-on', !!settings.proxyEnabled);
    }
  }

  function ensurePanel() {
    if (document.getElementById('srbb-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'srbb-panel';
    panel.className = 'srbb-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="srbb-panel__header">
        <div>
          <div class="srbb-panel__title">${escapeHtml(t('panelTitle'))}</div>
          <div class="srbb-panel__subtitle">${escapeHtml(t('panelSubtitle'))}</div>
        </div>
        <button type="button" class="srbb-panel__close" data-srbb="close" aria-label="${escapeHtml(t('close'))}">×</button>
      </div>

      <div class="srbb-panel__tabs" role="tablist">
        <button type="button" class="srbb-panel__tab is-active" role="tab" data-srbb-tab="general" aria-selected="true">${escapeHtml(t('tabGeneral'))}</button>
        <button type="button" class="srbb-panel__tab" role="tab" data-srbb-tab="search" aria-selected="false">${escapeHtml(t('tabSearch'))}</button>
        <button type="button" class="srbb-panel__tab" role="tab" data-srbb-tab="proxy" aria-selected="false">${escapeHtml(t('tabProxy'))}</button>
      </div>

      <div class="srbb-panel__body">
        <div class="srbb-panel__tabpane" data-srbb-pane="general" role="tabpanel">
          <div class="srbb-panel__section">
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('bypassTrigger'))}</span>
              <select id="srbb-auto">
                <option value="auto">${escapeHtml(t('bypassTriggerAuto'))}</option>
                <option value="button">${escapeHtml(t('bypassTriggerButton'))}</option>
              </select>
            </label>
            <p class="srbb-hint">${escapeHtml(t('bypassTriggerHint'))}</p>
          </div>

          <div class="srbb-panel__section">
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('storeCountry'))}</span>
              <input type="text" id="srbb-cc" maxlength="2" placeholder="US / DE / KZ…" autocomplete="off" spellcheck="false" />
            </label>
            <p class="srbb-hint">${escapeHtml(t('storeCountryHint'))}</p>
          </div>

          <div class="srbb-panel__section">
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('cacheMinutes'))}</span>
              <input type="number" id="srbb-cache-minutes" min="0" max="${CACHE_MINUTES_MAX}" step="1" placeholder="60" inputmode="numeric" />
            </label>
            <p class="srbb-hint">${escapeHtml(t('cacheMinutesHint'))}</p>
          </div>
        </div>

        <div class="srbb-panel__tabpane" data-srbb-pane="search" role="tabpanel" hidden>
          <div class="srbb-panel__section srbb-panel__section--row">
            <label class="srbb-switch">
              <input type="checkbox" id="srbb-search-unblocked" />
              <span class="srbb-switch__track"></span>
              <span class="srbb-switch__label">${escapeHtml(t('searchUnblocked'))}</span>
            </label>
            <span class="srbb-pill" id="srbb-search-pill">${escapeHtml(t('off'))}</span>
          </div>
          <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('searchUnblockedHint'))}</p>

          <div class="srbb-panel__section srbb-panel__section--row">
            <label class="srbb-switch">
              <input type="checkbox" id="srbb-search-page-unblocked" />
              <span class="srbb-switch__track"></span>
              <span class="srbb-switch__label">${escapeHtml(t('searchPageUnblocked'))}</span>
            </label>
            <span class="srbb-pill" id="srbb-search-page-pill">${escapeHtml(t('off'))}</span>
          </div>
          <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('searchPageUnblockedHint'))}</p>

          <div class="srbb-panel__section srbb-panel__section--row">
            <label class="srbb-switch">
              <input type="checkbox" id="srbb-remember-blocked" />
              <span class="srbb-switch__track"></span>
              <span class="srbb-switch__label">${escapeHtml(t('rememberBlockedApps'))}</span>
            </label>
          </div>
          <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('rememberBlockedAppsHint'))}</p>

          <div class="srbb-panel__section srbb-panel__section--row">
            <label class="srbb-switch">
              <input type="checkbox" id="srbb-mark-blocked-search" />
              <span class="srbb-switch__track"></span>
              <span class="srbb-switch__label">${escapeHtml(t('markBlockedInSearch'))}</span>
            </label>
          </div>
          <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('markBlockedInSearchHint'))}</p>

          <div class="srbb-panel__section srbb-panel__section--row">
            <label class="srbb-switch">
              <input type="checkbox" id="srbb-probe-blocked" />
              <span class="srbb-switch__track"></span>
              <span class="srbb-switch__label">${escapeHtml(t('probeBlockedInSearch'))}</span>
            </label>
          </div>
          <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('probeBlockedInSearchHint'))}</p>
          <p class="srbb-hint srbb-panel__section srbb-probe-note" id="srbb-probe-note" style="padding-top:0" hidden></p>

          <div class="srbb-panel__section srbb-probe-fields" id="srbb-probe-fields">
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('probeBlockedScope'))}</span>
              <select id="srbb-probe-scope">
                <option value="both">${escapeHtml(t('probeBlockedScopeBoth'))}</option>
                <option value="suggest">${escapeHtml(t('probeBlockedScopeSuggest'))}</option>
                <option value="search">${escapeHtml(t('probeBlockedScopeSearch'))}</option>
              </select>
            </label>
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('probeBlockedConcurrency'))}</span>
              <select id="srbb-probe-concurrency">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="5">5</option>
              </select>
            </label>
            <p class="srbb-hint">${escapeHtml(t('probeBlockedConcurrencyHint'))}</p>
          </div>

          <div class="srbb-panel__section srbb-panel__section--row">
            <span class="srbb-blocked-count" id="srbb-blocked-count"></span>
            <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="view-blocked">${escapeHtml(t('viewBlockedApps'))}</button>
            <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="clear-blocked">${escapeHtml(t('clearBlockedApps'))}</button>
          </div>
          <div class="srbb-blocked-list" id="srbb-blocked-list" hidden></div>
        </div>

        <div class="srbb-panel__tabpane" data-srbb-pane="proxy" role="tabpanel" hidden>
          <div class="srbb-panel__section srbb-panel__section--row">
            <label class="srbb-switch">
              <input type="checkbox" id="srbb-proxy-enabled" />
              <span class="srbb-switch__track"></span>
              <span class="srbb-switch__label">${escapeHtml(t('useProxy'))}</span>
            </label>
            <span class="srbb-pill" id="srbb-proxy-pill">${escapeHtml(t('off'))}</span>
          </div>

          <div class="srbb-panel__section srbb-proxy-fields" id="srbb-proxy-fields">
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('gatewayMode'))}</span>
              <select id="srbb-proxy-mode">
                <option value="gateway">host:port/https://…</option>
                <option value="path">host:port/store.steampowered.com/…</option>
                <option value="query">host:port/?url=…</option>
              </select>
            </label>
            <div class="srbb-grid">
              <label class="srbb-field">
                <span class="srbb-field__label">${escapeHtml(t('host'))}</span>
                <input type="text" id="srbb-proxy-host" placeholder="127.0.0.1" autocomplete="off" spellcheck="false" />
              </label>
              <label class="srbb-field">
                <span class="srbb-field__label">${escapeHtml(t('port'))}</span>
                <input type="text" id="srbb-proxy-port" placeholder="8080" inputmode="numeric" autocomplete="off" spellcheck="false" />
              </label>
            </div>
            <div class="srbb-grid">
              <label class="srbb-field">
                <span class="srbb-field__label">${escapeHtml(t('username'))}</span>
                <input type="text" id="srbb-proxy-user" placeholder="${escapeHtml(t('optional'))}" autocomplete="off" spellcheck="false" />
              </label>
              <label class="srbb-field">
                <span class="srbb-field__label">${escapeHtml(t('password'))}</span>
                <input type="password" id="srbb-proxy-pass" placeholder="${escapeHtml(t('optional'))}" autocomplete="off" />
              </label>
            </div>
            <p class="srbb-hint">
              ${escapeHtml(t('proxyHint'))}
            </p>
          </div>
        </div>
      </div>

      <div class="srbb-panel__footer">
        <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="close">${escapeHtml(t('cancel'))}</button>
        <button type="button" class="srbb-btn" data-srbb="save">${escapeHtml(t('save'))}</button>
        <button type="button" class="srbb-btn srbb-btn--green" data-srbb="save-run" id="srbb-save-run">${escapeHtml(t('saveReload'))}</button>
      </div>
    `;
    document.body.appendChild(panel);

    panel.addEventListener('click', (e) => e.stopPropagation());
    panel.querySelectorAll('[data-srbb-tab]').forEach((tab) => {
      tab.addEventListener('click', () => switchPanelTab(tab.getAttribute('data-srbb-tab')));
    });
    panel.querySelectorAll('[data-srbb="close"]').forEach((el) =>
      el.addEventListener('click', () => togglePanel(false))
    );
    panel.querySelector('[data-srbb="save"]').addEventListener('click', () => {
      persistPanelForm();
      togglePanel(false);
    });
    panel.querySelector('[data-srbb="save-run"]').addEventListener('click', () => {
      persistPanelForm();
      togglePanel(false);
      if (isRegionBlockedPage() || document.querySelector('.srbb-shell, .srbb-injected')) {
        bypassRegionBlock({ forceRefresh: true });
      } else {
        location.reload();
      }
    });

    const enabled = panel.querySelector('#srbb-proxy-enabled');
    enabled.addEventListener('change', () => syncProxyFieldsState());
    panel.querySelector('#srbb-search-unblocked')?.addEventListener('change', () => {
      saveSettings({ searchUnblocked: panel.querySelector('#srbb-search-unblocked').checked });
    });
    panel.querySelector('#srbb-search-page-unblocked')?.addEventListener('change', () => {
      saveSettings({
        searchPageUnblocked: panel.querySelector('#srbb-search-page-unblocked').checked,
      });
    });
    panel.querySelector('#srbb-remember-blocked')?.addEventListener('change', () => {
      saveSettings({ rememberBlockedApps: panel.querySelector('#srbb-remember-blocked').checked });
      syncBlockedAppsPanel();
      syncProbePanelState();
    });
    panel.querySelector('#srbb-mark-blocked-search')?.addEventListener('change', () => {
      saveSettings({ markBlockedInSearch: panel.querySelector('#srbb-mark-blocked-search').checked });
    });
    panel.querySelector('#srbb-probe-blocked')?.addEventListener('change', () => {
      saveSettings({ probeBlockedInSearch: panel.querySelector('#srbb-probe-blocked').checked });
      syncProbePanelState();
    });
    panel.querySelector('#srbb-probe-scope')?.addEventListener('change', () => {
      saveSettings({ probeBlockedScope: panel.querySelector('#srbb-probe-scope').value });
    });
    panel.querySelector('#srbb-probe-concurrency')?.addEventListener('change', () => {
      saveSettings({
        probeBlockedConcurrency: panel.querySelector('#srbb-probe-concurrency').value,
      });
    });
    panel.querySelector('[data-srbb="clear-blocked"]')?.addEventListener('click', () => {
      clearBlockedApps();
    });
    panel.querySelector('[data-srbb="view-blocked"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleBlockedAppsList();
    });

    document.addEventListener('click', (e) => {
      if (!panelOpen) return;
      const btn = document.getElementById('srbb-settings-btn');
      if (panel.contains(e.target) || btn?.contains(e.target)) return;
      if (e.target.closest?.('[data-srbb="search-settings"], [data-srbb="suggest-settings"], [data-srbb="open-settings"]')) {
        return;
      }
      togglePanel(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panelOpen) togglePanel(false);
    });
  }

  function switchPanelTab(tabId) {
    const panel = document.getElementById('srbb-panel');
    if (!panel || !tabId) return;
    panel.querySelectorAll('[data-srbb-tab]').forEach((tab) => {
      const active = tab.getAttribute('data-srbb-tab') === tabId;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panel.querySelectorAll('[data-srbb-pane]').forEach((pane) => {
      pane.hidden = pane.getAttribute('data-srbb-pane') !== tabId;
    });
  }

  function fillPanelForm() {
    const panel = document.getElementById('srbb-panel');
    if (!panel) return;
    panel.querySelector('#srbb-auto').value = settings.autoBypass ? 'auto' : 'button';
    panel.querySelector('#srbb-cc').value = settings.countryCode || '';
    panel.querySelector('#srbb-cache-minutes').value = String(
      normalizeCacheMinutes(settings.cacheMinutes)
    );
    panel.querySelector('#srbb-proxy-enabled').checked = !!settings.proxyEnabled;
    panel.querySelector('#srbb-proxy-mode').value = settings.proxyMode || 'gateway';
    panel.querySelector('#srbb-proxy-host').value = settings.proxyHost || '';
    panel.querySelector('#srbb-proxy-port').value = settings.proxyPort || '';
    panel.querySelector('#srbb-proxy-user').value = settings.proxyUser || '';
    panel.querySelector('#srbb-proxy-pass').value = settings.proxyPass || '';
    syncProxyFieldsState();
    syncSearchPanelToggle();
    syncBlockedAppsPanel();
    syncProbePanelState();
  }

  function syncBlockedAppsPanel() {
    const panel = document.getElementById('srbb-panel');
    if (!panel) return;
    const remember = panel.querySelector('#srbb-remember-blocked');
    const mark = panel.querySelector('#srbb-mark-blocked-search');
    const countEl = panel.querySelector('#srbb-blocked-count');
    const clearBtn = panel.querySelector('[data-srbb="clear-blocked"]');
    const viewBtn = panel.querySelector('[data-srbb="view-blocked"]');
    const listEl = panel.querySelector('#srbb-blocked-list');
    if (remember) remember.checked = !!settings.rememberBlockedApps;
    if (mark) mark.checked = !!settings.markBlockedInSearch;
    const count = getBlockedAppsCount();
    if (countEl) countEl.textContent = t('blockedAppsCount', { count });
    if (clearBtn) clearBtn.disabled = count === 0;
    if (viewBtn) viewBtn.disabled = count === 0;
    if (listEl && !listEl.hidden) {
      renderBlockedAppsList(listEl);
    }
    if (viewBtn && listEl) {
      viewBtn.textContent = listEl.hidden ? t('viewBlockedApps') : t('hideBlockedApps');
    }
  }

  function toggleBlockedAppsList() {
    const panel = document.getElementById('srbb-panel');
    const listEl = panel?.querySelector('#srbb-blocked-list');
    const viewBtn = panel?.querySelector('[data-srbb="view-blocked"]');
    if (!listEl) return;
    if (getBlockedAppsCount() === 0) {
      listEl.hidden = true;
      listEl.innerHTML = '';
      if (viewBtn) {
        viewBtn.disabled = true;
        viewBtn.textContent = t('viewBlockedApps');
      }
      return;
    }
    listEl.hidden = !listEl.hidden;
    if (!listEl.hidden) renderBlockedAppsList(listEl);
    if (viewBtn) {
      viewBtn.textContent = listEl.hidden ? t('viewBlockedApps') : t('hideBlockedApps');
    }
  }

  function renderBlockedAppsList(listEl) {
    const entries = listBlockedAppsEntries();
    if (!entries.length) {
      listEl.innerHTML = `<div class="srbb-blocked-list__empty">${escapeHtml(t('blockedAppsEmpty'))}</div>`;
      return;
    }
    listEl.innerHTML = entries
      .map((entry) => {
        const label = entry.name || t('blockedAppUntitled', { id: entry.id });
        const href = buildAppHref(entry.id, entry.name);
        return `
          <a class="srbb-blocked-list__item" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
            <span class="srbb-blocked-list__name">${escapeHtml(label)}</span>
            <span class="srbb-blocked-list__id">${escapeHtml(entry.id)}</span>
          </a>
        `;
      })
      .join('');
  }

  function persistPanelForm() {
    const panel = document.getElementById('srbb-panel');
    if (!panel) return;
    saveSettings({
      autoBypass: panel.querySelector('#srbb-auto').value !== 'button',
      countryCode: panel.querySelector('#srbb-cc').value.trim().toUpperCase(),
      cacheMinutes: normalizeCacheMinutes(panel.querySelector('#srbb-cache-minutes').value),
      proxyEnabled: panel.querySelector('#srbb-proxy-enabled').checked,
      proxyMode: panel.querySelector('#srbb-proxy-mode').value,
      proxyHost: panel.querySelector('#srbb-proxy-host').value.trim(),
      proxyPort: panel.querySelector('#srbb-proxy-port').value.trim(),
      proxyUser: panel.querySelector('#srbb-proxy-user').value.trim(),
      proxyPass: panel.querySelector('#srbb-proxy-pass').value,
      searchUnblocked: !!panel.querySelector('#srbb-search-unblocked')?.checked,
      searchPageUnblocked: !!panel.querySelector('#srbb-search-page-unblocked')?.checked,
      rememberBlockedApps: !!panel.querySelector('#srbb-remember-blocked')?.checked,
      markBlockedInSearch: !!panel.querySelector('#srbb-mark-blocked-search')?.checked,
      probeBlockedInSearch: !!panel.querySelector('#srbb-probe-blocked')?.checked,
      probeBlockedScope: panel.querySelector('#srbb-probe-scope')?.value || 'both',
      probeBlockedConcurrency: panel.querySelector('#srbb-probe-concurrency')?.value || 3,
    });
  }

  function syncProxyFieldsState() {
    const panel = document.getElementById('srbb-panel');
    if (!panel) return;
    const on = panel.querySelector('#srbb-proxy-enabled').checked;
    panel.querySelector('#srbb-proxy-fields').classList.toggle('is-disabled', !on);
    const pill = panel.querySelector('#srbb-proxy-pill');
    pill.textContent = on ? t('on') : t('off');
    pill.classList.toggle('is-on', on);
  }

  function togglePanel(force) {
    ensurePanel();
    const panel = document.getElementById('srbb-panel');
    const btn = document.getElementById('srbb-settings-btn');
    if (!panel) return;

    panelOpen = typeof force === 'boolean' ? force : !panelOpen;
    panel.hidden = !panelOpen;
    btn?.classList.toggle('is-open', panelOpen);

    if (panelOpen) {
      fillPanelForm();
      positionPanel();
    }
  }

  function positionPanel() {
    const panel = document.getElementById('srbb-panel');
    const btn = document.getElementById('srbb-settings-btn');
    if (!panel || !btn) return;

    const rect = btn.getBoundingClientRect();
    const width = 380;
    let left = rect.right - width;
    if (left < 8) left = 8;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;

    const top = Math.round(rect.bottom + 8);
    panel.style.top = `${top}px`;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.maxHeight = `${Math.max(240, window.innerHeight - top - 8)}px`;
  }

  function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve) => {
      const existing = document.querySelector(selector);
      if (existing) {
        resolve(existing);
        return;
      }
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }, timeout);
    });
  }

  function getBannerStyles() {
    return `
      .srbb-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 0 12px;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        color: #fff;
        font: 700 12px/28px "Motiva Sans", Arial, Helvetica, sans-serif;
        background: linear-gradient(to bottom, #66c0f4 5%, #417a9b 95%);
        text-shadow: 0 1px 1px rgba(0,0,0,.3);
        box-shadow: 0 0 0 1px rgba(0,0,0,.4);
      }
      .srbb-btn:hover { filter: brightness(1.08); }
      .srbb-btn--ghost {
        background: linear-gradient(to bottom, #3d4450 5%, #2c313a 95%);
      }
      .srbb-btn--green {
        background: linear-gradient(to bottom, #a4d007 5%, #536904 95%);
      }
      .srbb-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
        margin: 16px 0 12px;
        padding: 12px 14px;
        box-sizing: border-box;
        width: 100%;
        background:
          linear-gradient(90deg, rgba(198, 163, 46, .22) 0%, rgba(27, 40, 56, .96) 42%, rgba(27, 40, 56, .92) 100%);
        border: 1px solid #000;
        border-left: 3px solid #c6a32e;
        box-shadow:
          inset 0 0 0 1px rgba(198, 163, 46, .12),
          0 2px 10px rgba(0, 0, 0, .25);
        color: #c7d5e0;
        font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
      }
      #tabletGrid > .srbb-banner,
      .tablet_grid > .srbb-banner {
        margin-top: 16px;
        margin-bottom: 12px;
      }
      .srbb-banner__main {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 0;
        flex: 1 1 280px;
      }
      .srbb-banner__icon {
        flex: 0 0 auto;
        display: inline-flex;
        color: #e7c65c;
        margin-top: 1px;
        filter: drop-shadow(0 0 6px rgba(198, 163, 46, .35));
      }
      .srbb-banner__copy { min-width: 0; }
      .srbb-banner__title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 4px;
      }
      .srbb-banner__badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 2px;
        background: linear-gradient(to bottom, #c6a32e, #8a6d1a);
        color: #1b1204;
        font-weight: 700;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: .04em;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, .35);
      }
      .srbb-banner__title {
        color: #fff;
        font-size: 13px;
        font-weight: 700;
      }
      .srbb-banner__text {
        color: #b8c4d0;
        font-size: 12px;
      }
      .srbb-banner__actions { display: flex; gap: 8px; flex: 0 0 auto; }
    `;
  }

  function getStyles() {
    return `
      #srbb-settings-btn.srbb-header-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-right: 8px;
        height: 24px;
        padding: 0 10px;
        border: none;
        border-radius: 2px;
        background: linear-gradient(to bottom, #66c0f4 5%, #417a9b 95%);
        color: #fff;
        font: 700 11px/24px "Motiva Sans", Arial, Helvetica, sans-serif;
        text-shadow: 0 1px 1px rgba(0,0,0,.3);
        cursor: pointer;
        position: relative;
        white-space: nowrap;
        box-shadow: 0 0 0 1px rgba(0,0,0,.35);
      }
      #srbb-settings-btn.srbb-header-btn:hover {
        background: linear-gradient(to bottom, #7dcaFA 5%, #4d8bb0 95%);
      }
      #srbb-settings-btn.srbb-header-btn.is-open,
      #srbb-settings-btn.srbb-header-btn.is-proxy-on {
        background: linear-gradient(to bottom, #a4d007 5%, #536904 95%);
      }
      .srbb-header-btn__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: rgba(255,255,255,.35);
        box-shadow: inset 0 0 0 1px rgba(0,0,0,.25);
      }
      .srbb-header-btn__dot.is-on {
        background: #beee11;
        box-shadow: 0 0 6px rgba(190,238,17,.8);
      }

      .srbb-panel {
        position: fixed;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        width: 380px;
        max-height: calc(100vh - 72px);
        background: linear-gradient(180deg, #1b2838 0%, #16202d 100%);
        border: 1px solid #000;
        box-shadow: 0 0 12px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.04);
        color: #c7d5e0;
        font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
        border-radius: 3px;
      }
      .srbb-panel[hidden] {
        display: none !important;
      }
      .srbb-panel__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 14px 10px;
        background: radial-gradient(120% 80% at 0% 0%, rgba(102,192,244,.18), transparent 55%),
                    linear-gradient(90deg, #1a2332, #1b2838);
        border-bottom: 1px solid #000;
        flex-shrink: 0;
      }
      .srbb-panel__title {
        color: #fff;
        font-size: 14px;
        font-weight: 700;
      }
      .srbb-panel__subtitle {
        margin-top: 2px;
        color: #8f98a0;
        font-size: 11px;
      }
      .srbb-panel__close {
        border: 0;
        background: transparent;
        color: #8f98a0;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        padding: 0 2px;
      }
      .srbb-panel__close:hover { color: #fff; }
      .srbb-panel__tabs {
        display: flex;
        gap: 2px;
        padding: 0 10px;
        border-bottom: 1px solid #000;
        background: rgba(0,0,0,.18);
        flex-shrink: 0;
      }
      .srbb-panel__tab {
        flex: 1;
        margin: 0;
        padding: 9px 8px 8px;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        color: #8f98a0;
        font: 700 11px/1.2 "Motiva Sans", Arial, Helvetica, sans-serif;
        letter-spacing: .02em;
        text-transform: uppercase;
        cursor: pointer;
      }
      .srbb-panel__tab:hover {
        color: #c7d5e0;
      }
      .srbb-panel__tab.is-active {
        color: #fff;
        border-bottom-color: #66c0f4;
      }
      .srbb-panel__body {
        overflow-x: hidden;
        overflow-y: auto;
        flex: 1 1 auto;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: #417a9b transparent;
      }
      .srbb-panel__tabpane {
        padding-bottom: 4px;
      }
      .srbb-panel__tabpane[hidden] {
        display: none;
      }
      .srbb-panel__section {
        padding: 10px 14px;
      }
      .srbb-panel__section--row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .srbb-panel__divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #000, transparent);
        margin: 0 10px;
      }
      .srbb-panel__footer {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px 14px 14px;
        border-top: 1px solid #000;
        background: rgba(0,0,0,.2);
        flex-shrink: 0;
      }

      .srbb-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-bottom: 8px;
      }
      .srbb-field__label {
        color: #8f98a0;
        text-transform: uppercase;
        letter-spacing: .04em;
        font-size: 10px;
        font-weight: 700;
      }
      .srbb-field input,
      .srbb-field select {
        height: 30px;
        padding: 0 8px;
        border: 1px solid #000;
        border-radius: 2px;
        background: #316282;
        color: #fff;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
        outline: none;
        font: inherit;
      }
      .srbb-field input::placeholder { color: rgba(255,255,255,.45); }
      .srbb-field input:focus,
      .srbb-field select:focus {
        background: #3d7a9c;
        box-shadow: 0 0 0 1px #66c0f4;
      }
      .srbb-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .srbb-hint {
        margin: 0;
        color: #8f98a0;
        font-size: 11px;
        line-height: 1.35;
      }
      .srbb-proxy-fields.is-disabled,
      .srbb-probe-fields.is-disabled {
        opacity: .45;
        pointer-events: none;
      }
      .srbb-probe-note:not([hidden]) {
        color: #e7b86a;
      }

      .srbb-switch {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
      }
      .srbb-switch input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .srbb-switch__track {
        width: 34px;
        height: 18px;
        border-radius: 9px;
        background: #0e1620;
        border: 1px solid #000;
        position: relative;
        box-shadow: inset 0 1px 2px rgba(0,0,0,.5);
        flex: 0 0 auto;
      }
      .srbb-switch__track::after {
        content: '';
        position: absolute;
        top: 1px;
        left: 1px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #8f98a0;
        transition: transform .15s ease, background .15s ease;
      }
      .srbb-switch input:checked + .srbb-switch__track {
        background: linear-gradient(to bottom, #66c0f4, #417a9b);
      }
      .srbb-switch input:checked + .srbb-switch__track::after {
        transform: translateX(16px);
        background: #fff;
      }
      .srbb-switch__label { color: #c7d5e0; }

      .srbb-pill {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .06em;
        padding: 2px 7px;
        border-radius: 2px;
        background: #0e1620;
        color: #8f98a0;
        border: 1px solid #000;
      }
      .srbb-pill.is-on {
        color: #beee11;
        background: #1b3708;
        border-color: #53760d;
      }

      ${getBannerStyles()}

      .srbb-shell {
        width: 100%;
        clear: both;
      }
      .srbb-status {
        margin: 16px 0;
        padding: 12px;
        border: 1px solid #000;
        background: #1b2838;
        color: #c7d5e0;
        font: 13px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
      }
      .srbb-status[data-kind="error"] {
        background: #3a1f1f;
        border-color: #6b2a2a;
        color: #ffc9c9;
      }
      .srbb-status[data-kind="offer"] {
        background: #1b3a2a;
        border-color: #2a6b4a;
        color: #c9ffe0;
      }
      .srbb-status__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .srbb-status__actions { display: flex; gap: 8px; }

      .srbb-loader {
        position: fixed;
        inset: 0;
        z-index: 1000000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity .2s ease;
        pointer-events: none;
      }
      .srbb-loader.is-visible {
        opacity: 1;
        pointer-events: auto;
      }
      .srbb-loader.is-leaving {
        opacity: 0;
        pointer-events: none;
      }
      .srbb-loader__veil {
        position: absolute;
        inset: 0;
        background: rgba(10, 16, 24, .72);
      }
      .srbb-loader__card {
        position: relative;
        z-index: 1;
        width: min(340px, calc(100vw - 32px));
        padding: 22px 24px 20px;
        text-align: center;
        color: #c7d5e0;
        font: 13px/1.45 "Motiva Sans", Arial, Helvetica, sans-serif;
        background: linear-gradient(180deg, #1b2838 0%, #16202d 100%);
        border: 1px solid #000;
        border-radius: 3px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, .55), inset 0 1px 0 rgba(255, 255, 255, .04);
      }
      .srbb-loader__badge {
        display: inline-block;
        margin-bottom: 14px;
        padding: 2px 8px;
        border-radius: 2px;
        background: linear-gradient(to bottom, #66c0f4, #417a9b);
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        text-shadow: 0 1px 1px rgba(0, 0, 0, .35);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, .35);
      }
      .srbb-loader__spinner {
        width: 36px;
        height: 36px;
        margin: 0 auto 14px;
        border: 3px solid rgba(102, 192, 244, .2);
        border-top-color: #66c0f4;
        border-radius: 50%;
        animation: srbb-spin .8s linear infinite;
      }
      .srbb-loader__title {
        color: #fff;
        font-size: 13px;
        font-weight: 500;
      }
      @keyframes srbb-spin { to { transform: rotate(360deg); } }

      html.srbb-search-guest [id^="searchSuggestions_"] {
        display: none !important;
      }

      .srbb-search-mount {
        position: relative;
      }

      .srbb-suggest {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 99999;
        border: 1px solid #000;
        border-radius: 3px;
        background: linear-gradient(180deg, #1b2838 0%, #16202d 100%);
        box-shadow: 0 8px 24px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04);
        overflow: hidden;
      }
      .srbb-suggest__notice {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px;
        border-bottom: 1px solid rgba(0,0,0,.55);
        background: linear-gradient(90deg, rgba(27,55,8,.45), rgba(27,40,56,.92));
        font: 11px/1.35 "Motiva Sans", Arial, Helvetica, sans-serif;
      }
      .srbb-suggest__notice-text {
        color: #c7d5e0;
        min-width: 0;
        flex: 1 1 auto;
      }
      .srbb-suggest__notice-btn {
        flex: 0 0 auto;
        margin: 0;
        padding: 3px 8px;
        border: 1px solid #000;
        border-radius: 2px;
        background: linear-gradient(to bottom, #67c1f5 5%, #417a9b 95%);
        color: #fff;
        font: 10px/1.2 "Motiva Sans", Arial, Helvetica, sans-serif;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      .srbb-suggest__notice-btn:hover {
        filter: brightness(1.08);
      }
      .srbb-suggest__inner {
        max-height: min(560px, 70vh);
        overflow-y: auto;
      }
      .srbb-suggest__message {
        padding: 12px 14px;
        color: #8f98a0;
        font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
      }
      .srbb-skel {
        position: relative;
        overflow: hidden;
        background: rgba(255,255,255,.06);
        border-radius: 2px;
      }
      .srbb-skel::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(102,192,244,.12) 45%,
          rgba(199,213,224,.18) 55%,
          transparent 100%
        );
        animation: srbb-skel-shimmer 1.25s ease-in-out infinite;
      }
      @keyframes srbb-skel-shimmer {
        100% { transform: translateX(100%); }
      }
      .srbb-suggest__skel {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border-top: 1px solid rgba(0,0,0,.35);
      }
      .srbb-suggest__skel:first-child { border-top: 0; }
      .srbb-suggest__skel-img {
        width: 184px;
        height: 69px;
        flex: 0 0 auto;
        background: #0e1620;
        box-shadow: 0 0 0 1px rgba(0,0,0,.45);
      }
      .srbb-suggest__skel-meta {
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 4px;
      }
      .srbb-suggest__skel-line { height: 12px; }
      .srbb-suggest__skel-line--title { width: 58%; }
      .srbb-suggest__skel-line--sub { width: 34%; height: 10px; }
      .srbb-suggest__skel-line--facts { width: 48%; height: 10px; }
      .srbb-suggest__skel-chips {
        display: flex;
        gap: 6px;
        margin-top: 2px;
      }
      .srbb-suggest__skel-chip {
        width: 54px;
        height: 16px;
        border-radius: 2px;
      }
      .srbb-suggest__skel-chip--short { width: 36px; }
      .srbb-suggest__item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        text-decoration: none;
        color: #c7d5e0;
        border-top: 1px solid rgba(0,0,0,.35);
        font: 12px/1.35 "Motiva Sans", Arial, Helvetica, sans-serif;
      }
      .srbb-suggest__item:first-child { border-top: 0; }
      .srbb-suggest__item:hover,
      .srbb-suggest__item.is-active {
        background: rgba(102,192,244,.14);
        color: #fff;
      }
      .srbb-suggest__img {
        width: 184px;
        height: 69px;
        object-fit: cover;
        border-radius: 2px;
        flex: 0 0 auto;
        background: #0e1620;
        box-shadow: 0 0 0 1px rgba(0,0,0,.45);
      }
      .srbb-suggest__meta {
        min-width: 0;
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .srbb-suggest__title-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        flex-wrap: wrap;
      }
      .srbb-suggest__blocked-badge {
        flex: 0 0 auto;
        padding: 1px 6px;
        border-radius: 2px;
        background: linear-gradient(to bottom, #a94847, #6b2a2a);
        color: #ffc9c9;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .03em;
        border: 1px solid #000;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
      }
      .srbb-suggest__item--blocked {
        background: linear-gradient(90deg, rgba(107,42,42,.22), rgba(102,192,244,.08));
      }
      .srbb-suggest__item--blocked:hover,
      .srbb-suggest__item--blocked.is-active {
        background: linear-gradient(90deg, rgba(107,42,42,.34), rgba(102,192,244,.14));
      }
      .srbb-suggest__item--blocked .srbb-suggest__img {
        box-shadow: 0 0 0 1px rgba(169,72,71,.65);
      }
      .srbb-suggest__item--probing {
        opacity: .92;
      }
      .srbb-suggest__probe-spin {
        flex: 0 0 auto;
        width: 12px;
        height: 12px;
        margin-top: 3px;
        border: 2px solid rgba(102,192,244,.25);
        border-top-color: #66c0f4;
        border-radius: 50%;
        animation: srbb-spin .7s linear infinite;
      }
      .srbb-suggest__probe {
        padding: 8px 10px 10px;
        border-top: 1px solid rgba(0,0,0,.55);
        background: rgba(0,0,0,.22);
      }
      .srbb-suggest__probe[hidden] { display: none !important; }
      .srbb-suggest__probe-track {
        height: 4px;
        border-radius: 2px;
        background: rgba(15,24,34,.9);
        border: 1px solid #000;
        overflow: hidden;
        margin-bottom: 6px;
      }
      .srbb-suggest__probe-fill {
        height: 100%;
        width: 0;
        background: linear-gradient(90deg, #417a9b, #66c0f4);
        transition: width .2s ease;
      }
      .srbb-suggest__probe-label {
        color: #8f98a0;
        font-size: 11px;
      }
      .srbb-suggest__name {
        color: #fff;
        font-weight: 600;
        font-size: 13px;
        line-height: 1.25;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .srbb-suggest__details {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      .srbb-suggest__facts {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        color: #8f98a0;
        font-size: 11px;
        line-height: 1.3;
      }
      .srbb-suggest__facts-sep {
        color: #626366;
      }
      .srbb-suggest__release {
        color: #8f98a0;
      }
      .srbb-suggest__review {
        font-weight: 600;
        color: #8f98a0;
      }
      .srbb-suggest__review--positive { color: #66c0f4; }
      .srbb-suggest__review--mixed { color: #b9a404; }
      .srbb-suggest__review--negative { color: #c35c5c; }
      .srbb-suggest__item:hover .srbb-suggest__release,
      .srbb-suggest__item.is-active .srbb-suggest__release {
        color: #acb2b8;
      }
      .srbb-suggest__prices {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .srbb-suggest__discount {
        padding: 1px 5px;
        border-radius: 2px;
        background: #4c6b22;
        color: #beee11;
        font-size: 11px;
        font-weight: 700;
      }
      .srbb-suggest__price-old {
        color: #626366;
        font-size: 11px;
        text-decoration: line-through;
      }
      .srbb-suggest__price {
        color: #c7d5e0;
        font-size: 12px;
        font-weight: 600;
      }
      .srbb-suggest__price--free {
        color: #beee11;
      }
      .srbb-suggest__platforms {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex: 0 0 auto;
      }
      .srbb-suggest__plat {
        padding: 1px 5px;
        border-radius: 2px;
        background: rgba(143,152,160,.18);
        color: #8f98a0;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .02em;
        border: 1px solid rgba(0,0,0,.35);
      }
      .srbb-suggest__item:hover .srbb-suggest__plat,
      .srbb-suggest__item.is-active .srbb-suggest__plat {
        color: #c7d5e0;
      }
      .srbb-suggest__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }
      .srbb-suggest__chips {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }
      .srbb-suggest__chip {
        padding: 1px 6px;
        border-radius: 2px;
        background: rgba(65,122,155,.35);
        color: #acd3ec;
        font-size: 10px;
        font-weight: 600;
        border: 1px solid rgba(0,0,0,.25);
      }
      .srbb-suggest__chip--score {
        background: rgba(76,107,34,.45);
        color: #beee11;
      }
      .srbb-suggest__id {
        margin-left: auto;
        color: #626366;
        font-size: 10px;
        white-space: nowrap;
      }

      .srbb-search-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 12px 0;
        padding: 10px 12px;
        border: 1px solid #000;
        border-radius: 3px;
        background: linear-gradient(90deg, rgba(27,55,8,.55), rgba(27,40,56,.9));
        color: #c7d5e0;
        font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
      }
      .srbb-search-banner__badge {
        padding: 2px 7px;
        border-radius: 2px;
        background: linear-gradient(to bottom, #a4d007, #536904);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .04em;
      }
      .srbb-search-banner__text { flex: 1 1 auto; }
      .srbb-search-banner__reload { margin-left: 0; }

      .srbb-search-status {
        margin: 12px 0;
        padding: 10px 12px;
        border: 1px solid #000;
        border-radius: 3px;
        background: #1b2838;
        color: #c7d5e0;
        font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
      }
      .srbb-search-status[data-kind="error"] {
        background: #3a1f1f;
        border-color: #6b2a2a;
        color: #ffc9c9;
      }
      .srbb-search-skel-wrap {
        margin: 0 0 12px;
      }
      .srbb-search-skel {
        display: flex;
        flex-direction: column;
        gap: 2px;
        border: 1px solid #000;
        border-radius: 3px;
        overflow: hidden;
        background: #1b2838;
      }
      .srbb-search-skel__row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 10px;
        background: rgba(0,0,0,.18);
        border-top: 1px solid rgba(0,0,0,.35);
      }
      .srbb-search-skel__row:first-child { border-top: 0; }
      .srbb-search-skel__row:nth-child(even) {
        background: rgba(0,0,0,.28);
      }
      .srbb-search-skel__cap {
        width: 120px;
        height: 45px;
        flex: 0 0 auto;
        background: #0e1620;
      }
      .srbb-search-skel__body {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .srbb-search-skel__title {
        height: 14px;
        max-width: 420px;
      }
      .srbb-search-skel__meta {
        height: 10px;
        max-width: 260px;
      }
      .srbb-search-skel__price {
        width: 56px;
        height: 14px;
        flex: 0 0 auto;
        margin-left: auto;
      }

      .srbb-search-probe {
        margin: 0 0 12px;
        padding: 10px 12px;
        border: 1px solid #000;
        border-radius: 3px;
        background: linear-gradient(90deg, rgba(27,40,56,.95), rgba(22,48,72,.9));
        color: #c7d5e0;
        font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
      }
      .srbb-search-probe[hidden] { display: none !important; }
      .srbb-search-probe[data-kind="done"] {
        background: linear-gradient(90deg, rgba(55,27,27,.55), rgba(27,40,56,.9));
      }
      .srbb-search-probe__row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .srbb-search-probe__spin {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(102,192,244,.25);
        border-top-color: #66c0f4;
        border-radius: 50%;
        animation: srbb-spin .7s linear infinite;
        flex: 0 0 auto;
      }
      .srbb-search-probe[data-kind="done"] .srbb-search-probe__spin {
        display: none;
      }
      .srbb-search-probe__label { flex: 1 1 auto; }
      .srbb-search-probe__track {
        height: 4px;
        border-radius: 2px;
        background: rgba(15,24,34,.9);
        border: 1px solid #000;
        overflow: hidden;
      }
      .srbb-search-probe__fill {
        height: 100%;
        width: 0;
        background: linear-gradient(90deg, #417a9b, #66c0f4);
        transition: width .2s ease;
      }
      .srbb-search-row--probing {
        outline: 1px dashed rgba(102,192,244,.35);
        outline-offset: -2px;
        opacity: .85;
      }

      .srbb-blocked-count {
        color: #8f98a0;
        font-size: 11px;
        flex: 1 1 auto;
      }
      .srbb-blocked-list {
        margin: 0 0 12px;
        max-height: 180px;
        overflow: auto;
        border: 1px solid #000;
        border-radius: 2px;
        background: rgba(0,0,0,.25);
      }
      .srbb-blocked-list[hidden] {
        display: none !important;
      }
      .srbb-blocked-list__empty {
        padding: 10px 12px;
        color: #8f98a0;
        font-size: 11px;
      }
      .srbb-blocked-list__item {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        padding: 7px 10px;
        color: #c7d5e0;
        text-decoration: none;
        border-bottom: 1px solid rgba(0,0,0,.35);
      }
      .srbb-blocked-list__item:last-child {
        border-bottom: 0;
      }
      .srbb-blocked-list__item:hover {
        background: rgba(102,192,244,.1);
        color: #fff;
      }
      .srbb-blocked-list__name {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .srbb-blocked-list__id {
        flex: 0 0 auto;
        color: #66c0f4;
        font-size: 10px;
        font-variant-numeric: tabular-nums;
      }

      .srbb-blocked-mark {
        display: inline-block;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: 2px;
        background: linear-gradient(to bottom, #a94847, #6b2a2a);
        color: #ffc9c9;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .03em;
        vertical-align: middle;
        border: 1px solid #000;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
      }
      .srbb-search-row--blocked,
      a.srbb-search-row--blocked.search_result_row {
        background: linear-gradient(90deg, rgba(107,42,42,.28), rgba(102,192,244,.08)) !important;
        box-shadow: inset 3px 0 0 #a94847;
      }
      .srbb-search-row--blocked:hover,
      a.srbb-search-row--blocked.search_result_row:hover {
        background: linear-gradient(90deg, rgba(107,42,42,.4), rgba(102,192,244,.14)) !important;
      }
      .srbb-search-row--blocked .search_capsule img,
      .srbb-search-row--blocked .col.search_capsule img {
        box-shadow: 0 0 0 1px rgba(169,72,71,.75);
      }

      @media (max-width: 900px) {
        .srbb-header-btn__text { display: none; }
      }
    `;
  }
})();
