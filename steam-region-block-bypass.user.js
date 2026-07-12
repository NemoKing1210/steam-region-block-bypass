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
// @version           1.6.3
// @description       View Steam store pages blocked in your region by refetching without account cookies; optional proxy gateway
// @description:ru    Показывает страницы магазина Steam, недоступные в регионе, повторным запросом без cookies аккаунта; опциональный proxy gateway
// @description:zh-CN 通过无账号 Cookie 重新请求查看因区域限制不可用的 Steam 商店页面；可选代理网关
// @description:es    Muestra páginas de Steam bloqueadas en tu región recargándolas sin cookies de cuenta; gateway proxy opcional
// @description:pt-BR  Mostra páginas da Steam bloqueadas na sua região recarregando sem cookies da conta; gateway proxy opcional
// @description:de     Zeigt regional gesperrte Steam-Store-Seiten durch erneutes Laden ohne Account-Cookies; optionaler Proxy-Gateway
// @description:fr     Affiche les pages Steam bloquées dans votre région en rechargeant sans cookies de compte; gateway proxy optionnel
// @description:ja     アカウントCookieなしで再取得し、地域制限のSteamストアページを表示。任意のプロキシゲートウェイ
// @description:ko     계정 쿠키 없이 다시 요청해 지역 제한 Steam 스토어 페이지를 표시. 선택적 프록시 게이트웨이
// @description:pl     Pokazuje strony Sklepu Steam zablokowane w regionie przez ponowne pobranie bez cookies konta; opcjonalny gateway proxy
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
  /** Soft cap so GM storage does not grow without bound */
  const CACHE_MAX_ENTRIES = 30;
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

  init();

  function init() {
    GM_addStyle(getStyles());
    GM_registerMenuCommand(t('menuSettings'), () => {
      ensureSettingsButton().then(() => togglePanel(true));
    });

    ensureSettingsButton();
    observeHeader();

    if (!isRegionBlockedPage()) return;
    if (settings.autoBypass) {
      bypassRegionBlock();
    } else {
      showBypassOffer();
    }
  }

  function loadSettings() {
    const raw = GM_getValue(STORAGE_KEY, null);
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
    const merged = { ...DEFAULT_SETTINGS, ...raw };
    merged.cacheMinutes = normalizeCacheMinutes(merged.cacheMinutes);
    return merged;
  }

  function saveSettings(next) {
    settings = { ...settings, ...next };
    settings.cacheMinutes = normalizeCacheMinutes(settings.cacheMinutes);
    GM_setValue(STORAGE_KEY, settings);
    updateButtonState();
  }

  function normalizeCacheMinutes(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n) || n < 0) return DEFAULT_SETTINGS.cacheMinutes;
    return Math.min(n, CACHE_MINUTES_MAX);
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

  function buildTargetUrl() {
    const url = new URL(location.href);
    url.searchParams.delete('snr');
    url.searchParams.set('l', getSteamStoreLanguage());
    if (settings.countryCode) {
      url.searchParams.set('cc', settings.countryCode.trim().toLowerCase());
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
      <span class="srbb-header-btn__icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.507 6.507 0 0 0 8 1.5Zm0 11.7A5.2 5.2 0 1 1 13.2 8 5.206 5.206 0 0 1 8 13.2Z" fill="currentColor"/>
          <path d="M8 4.2a.65.65 0 0 0-.65.65v.2a3.15 3.15 0 0 0-2.5 3.08v.12a.65.65 0 1 0 1.3 0v-.12a1.85 1.85 0 0 1 1.85-1.85h.1a.65.65 0 0 0 0-1.3H8Zm2.55 4.35a.65.65 0 0 0-.65.65v.55a.9.9 0 1 1-1.8 0 .65.65 0 1 0-1.3 0 2.2 2.2 0 1 0 3.75-1.55v-.65a.65.65 0 0 0-.65-.65h.65Z" fill="currentColor"/>
        </svg>
      </span>
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

      <div class="srbb-panel__divider"></div>

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

      <div class="srbb-panel__footer">
        <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="close">${escapeHtml(t('cancel'))}</button>
        <button type="button" class="srbb-btn" data-srbb="save">${escapeHtml(t('save'))}</button>
        <button type="button" class="srbb-btn srbb-btn--green" data-srbb="save-run" id="srbb-save-run">${escapeHtml(t('saveReload'))}</button>
      </div>
    `;
    document.body.appendChild(panel);

    panel.addEventListener('click', (e) => e.stopPropagation());
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

    document.addEventListener('click', (e) => {
      if (!panelOpen) return;
      const btn = document.getElementById('srbb-settings-btn');
      if (panel.contains(e.target) || btn?.contains(e.target)) return;
      togglePanel(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panelOpen) togglePanel(false);
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
    const width = 360;
    let left = rect.right - width;
    if (left < 8) left = 8;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;

    panel.style.top = `${Math.round(rect.bottom + 8)}px`;
    panel.style.left = `${Math.round(left)}px`;
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
      .srbb-header-btn__icon {
        display: inline-flex;
        width: 14px;
        height: 14px;
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
        width: 360px;
        background: linear-gradient(180deg, #1b2838 0%, #16202d 100%);
        border: 1px solid #000;
        box-shadow: 0 0 12px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.04);
        color: #c7d5e0;
        font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
        border-radius: 3px;
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
      .srbb-proxy-fields.is-disabled {
        opacity: .45;
        pointer-events: none;
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

      @media (max-width: 900px) {
        .srbb-header-btn__text { display: none; }
      }
    `;
  }
})();
