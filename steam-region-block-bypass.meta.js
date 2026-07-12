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
// @version           1.4.0
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
