import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json' with { type: 'json' };

const RAW_BASE =
  'https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2, pure_getters: true },
      mangle: true,
      format: { comments: false },
    },
    cssMinify: true,
    target: 'es2018',
    reportCompressedSize: true,
  },
  esbuild: {
    legalComments: 'none',
  },
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: {
          '': 'Steam Region Block Bypass',
          ru: 'Steam Region Block Bypass — обход региональной блокировки',
          'zh-CN': 'Steam Region Block Bypass — 区域限制绕过',
          es: 'Steam Region Block Bypass — bypass de región',
          'pt-BR': 'Steam Region Block Bypass — bypass de região',
          de: 'Steam Region Block Bypass — Regionsperre umgehen',
          fr: 'Steam Region Block Bypass — contournement régional',
          ja: 'Steam Region Block Bypass — 地域制限バイパス',
          ko: 'Steam Region Block Bypass — 지역 제한 우회',
          pl: 'Steam Region Block Bypass — obejście blokady regionu',
        },
        namespace:
          'https://github.com/NemoKing1210/steam-region-block-bypass',
        version: pkg.version,
        description: {
          '': 'View region-blocked Steam store pages and guest search via anonymous fetch (no account cookies); optional proxy gateway',
          ru: 'Просмотр заблокированных страниц и гостевой поиск Steam без cookies аккаунта; опциональный proxy gateway',
          'zh-CN':
            '通过无账号 Cookie 查看区域限制页面及访客搜索 Steam 商店；可选代理网关',
          es: 'Muestra páginas bloqueadas y búsqueda invitado en Steam sin cookies de cuenta; gateway proxy opcional',
          'pt-BR':
            'Mostra páginas bloqueadas e busca convidado na Steam sem cookies da conta; gateway proxy opcional',
          de: 'Zeigt gesperrte Store-Seiten und Gast-Suche ohne Account-Cookies; optionaler Proxy-Gateway',
          fr: 'Affiche les pages bloquées et la recherche invité Steam sans cookies de compte; gateway proxy optionnel',
          ja: '地域制限ページとゲスト検索をアカウントCookieなしで表示。任意のプロキシゲートウェイ',
          ko: '지역 제한 페이지와 게스트 검색을 계정 쿠키 없이 표시. 선택적 프록시 게이트웨이',
          pl: 'Pokazuje zablokowane strony i wyszukiwanie gościa w Sklepie Steam bez cookies konta; opcjonalny gateway proxy',
        },
        author: 'NemoKing1210',
        tag: ['steam', 'store'],
        homepageURL:
          'https://github.com/NemoKing1210/steam-region-block-bypass',
        supportURL:
          'https://github.com/NemoKing1210/steam-region-block-bypass/issues',
        updateURL: `${RAW_BASE}/steam-region-block-bypass.user.js`,
        downloadURL: `${RAW_BASE}/steam-region-block-bypass.user.js`,
        license: 'MIT',
        icon: 'https://store.steampowered.com/favicon.ico',
        match: ['https://store.steampowered.com/*'],
        connect: ['store.steampowered.com', '*'],
        'run-at': 'document-idle',
        noframes: true,
      },
      server: {
        prefix: 'dev:',
      },
      build: {
        fileName: 'steam-region-block-bypass.user.js',
        metaFileName: true,
      },
    }),
  ],
});
