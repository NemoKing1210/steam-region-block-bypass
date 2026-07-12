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
// @version           1.11.0
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
