# Steam Region Block Bypass

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · **한국어** · [Polski](README.pl.md)

[![유저스크립트 설치](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

Steam 상점을 위한 유저스크립트로, **지역 차단된 상품 페이지**를 복원하고 선택적 **게스트 검색**을 추가합니다. 헤더의 익명 검색 제안과 별도로 켤 수 있는 게스트 `/search` 페이지를 계정 쿠키 없이 제공합니다.

앱 URL을 **계정 쿠키 없이** 다시 요청(게스트 보기)하고, 실제 상점 레이아웃을 현재 문서에 이식한 뒤 로그인 사용자의 위시리스트·팔로우·무시 컨트롤을 복원합니다. **게스트 검색 제안**은 기본으로 켜져 있고, 전체 **`/search` 페이지** 게스트 모드는 기본으로 꺼져 있습니다(Region Bypass → 검색에서 활성화). IP 기반 차단에는 Steam 스타일 설정 패널(계정 메뉴 → Region Bypass 설정)에서 선택적 **프록시 게이트웨이**를 구성할 수 있습니다.

[Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat 및 `// ==UserScript==` 메타데이터 블록을 지원하는 기타 관리자와 호환됩니다.

## 스크린샷

실제 유저스크립트가 라이브 Steam 상점 페이지에서 실행 중인 모습입니다.

![일반, 검색, 캐시, 프록시, 정보 페이지가 있는 Region Bypass 설정 패널](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![일반 — 인터페이스 언어, 우회 모드, 상점 국가, 토스트 알림](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**일반** — 인터페이스 언어, 자동/수동 우회, 배너, 상점 국가, 토스트 알림 | ![검색 — 게스트 제안, 선택적 /search 페이지, 차단된 게임 레지스트리, 프로브](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**검색** — 게스트 제안, 선택적 `/search` 페이지, 차단된 게임 레지스트리, 프로브 |
| ![캐시 — 사용량 미터, TTL, 항목 제한, 소스별 캐시, 차단 목록](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**캐시** — 사용량 미터, TTL, 항목 제한, 소스별 캐시, 차단 목록 | ![프록시 게이트웨이 — URL 모드, 호스트/포트, 선택적 HTTP Basic 인증](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**프록시 게이트웨이** — URL 모드, 호스트/포트, 선택적 HTTP Basic 인증 |

상점 헤더의 게스트 검색 제안 — **Call of Duty: Modern Warfare 4**가 **지역 차단**으로 표시되고 나머지 결과는 계속 제공됩니다:

![Steam 헤더에서 Call of Duty: Modern Warfare 4에 대한 게스트 검색 제안(Region blocked 배지 포함)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## 빠른 설치

1. 유저스크립트 관리자를 설치합니다(Tampermonkey 또는 Violentmonkey 권장).
2. 아래 설치 링크를 클릭합니다. 관리자의 설치 확인 창이 열립니다.

**설치 URL:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![설치](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### URL로 설치(대시보드)

| 관리자 | 경로 |
|---------|------|
| Tampermonkey | 대시보드 → **유틸리티** → **URL에서 설치** |
| Violentmonkey | 대시보드 → **+** → **URL에서 설치** |
| Greasemonkey | 부가 기능 메뉴 → **새 사용자 스크립트** → raw URL 붙여넣기 |

위의 [설치 URL](#빠른-설치)을 붙여넣으세요.

### 수동 설치

1. 이 저장소에서 [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js)를 엽니다.
2. 파일 전체 내용을 복사합니다.
3. 유저스크립트 관리자에서 새 스크립트를 만들고 코드를 붙여넣습니다.
4. 저장하고 스크립트를 활성화합니다.

## 업데이트

스크립트에는 GitHub raw 파일을 가리키는 `@updateURL` 및 `@downloadURL` 메타데이터가 포함되어 있습니다. 지원되는 관리자는 자동으로 업데이트를 확인합니다(Tampermonkey: 대시보드 → 확인 간격, Violentmonkey: 유사).

**새 버전을 릴리스하려면:**

1. `package.json`의 `version`을 올립니다(SemVer).
2. `npm run build`를 실행합니다(루트의 `.user.js` / `.meta.js` 갱신).
3. [`CHANGELOG.md`](CHANGELOG.md)에 항목을 추가합니다.
4. `main`에 푸시합니다(또는 GitHub Release 생성).

관리자는 설치된 `@version`과 원격 메타데이터를 비교해 업데이트 제공 여부를 결정합니다. 전체 절차는 [DEVELOPMENT.md](DEVELOPMENT.md)를 참조하세요.

## 기능

- **이식 우선 주입** — 게스트 게임 레이아웃을 현재 `#responsive_page_template_content`로 교체하면서 로그인 헤더, 세션 전역 변수, 로드된 스타일과 스크립트를 보존합니다. `document.write`는 전체 재작성 폴백으로 유지됩니다
- **로그인 사용자 큐 복원** — 이식 후 위시리스트·팔로우·무시 컨트롤을 다시 만들고 현재 세션을 통해 작업을 전송합니다
- **자동 우회 또는 버튼** — 차단된 페이지에서 즉시 실행하거나 먼저 수동 제안을 표시합니다
- **익명 요청** — `GM_xmlhttpRequest`를 `anonymous: true`로 사용합니다(로그인 쿠키 없음)
- **상점 언어** — 게스트 요청은 `Steam_Language`, `?l=`, `Accept-Language`를 사용해 Steam UI 언어와 페이지를 맞춥니다
- **연령 확인 쿠키** — `birthtime` / 성인 콘텐츠 쿠키를 보내 게스트 페이지가 연령 확인에서 멈출 가능성을 줄입니다
- **선택적 상점 국가(`cc`)** — 게스트 요청의 Steam 상점 국가를 재정의합니다
- **프록시 게이트웨이 패널** — 활성화/비활성화, 호스트, 포트, 사용자 이름, 비밀번호, URL 모드
- **지역 마스터 스위치 + 배너 제어** — 게스트 검색에 영향 없이 페이지 우회를 끌 수 있습니다. 필요 시 지역 배너를 숨깁니다
- **Steam 스타일 UI** — 계정 드롭다운의 설정 항목(`#account_dropdown`, SteamDB 스타일). 로그아웃 시 `#global_actions`의 대체 버튼. 홈 목록 패널에 일반 / 검색 / 캐시 / 프록시 / 정보 페이지, 초안 편집, 재설정, 취소, 저장, 저장 후 새로고침
- **현지화 UI** — 패널과 메시지를 en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl로 제공. 브라우저 자동 감지가 포함된 인터페이스 언어 선택기
- **수동 제어** — 주입된 콘텐츠 다시 불러오기, 배너 또는 유저스크립트 관리자 메뉴에서 설정 열기
- **게스트 검색 제안** — 기본 활성화: 동일한 게스트 요청 스택(프록시 / `cc` / 캐시)을 통한 익명 제안 드롭다운. **Region Bypass → 검색**에서 비활성화
- **게스트 `/search` 페이지** — 선택 사항: `store.steampowered.com/search`에 대한 익명 재요청 및 주입(동일 스택). **Region Bypass → 검색**에서 별도로 활성화
- **캐시 탭** — 사용량 미터, TTL 및 최대 항목 수, 저장할 게스트 페이지 종류 선택, 캐시된 HTML 탐색/삭제, 차단된 게임 목록 탐색/비우기
- **차단된 게임 레지스트리** — 지역 차단된 앱 ID를 기억하고(검색 탭 스위치) 게스트 검색에서 강조 표시합니다. 목록과 비우기는 **캐시** 탭에서 수행합니다

## 지원 페이지

| 사이트 | URL 패턴 | 참고 |
|------|-------------|-------|
| Steam 상점(앱) | `https://store.steampowered.com/app/{id}/…` | 지역 오류 우회(주 용도) |
| Steam 상점(검색) | 헤더 검색 + `https://store.steampowered.com/search/?term=…` | **게스트 검색 제안** 및 Region Bypass → 검색의 선택적 **게스트 /search 페이지** |

앱 페이지는 Steam이 **“This item is currently unavailable in your region”**(현재 지역에서 이 아이템을 구매할 수 없습니다)을 표시할 때 작동합니다(예: 제한 지역의 **Call of Duty: Modern Warfare 4**). **게스트 검색 제안**은 헤더 검색창에 기본으로 활성화됩니다. 전체 `/search` 페이지의 게스트 재요청은 **기본으로 꺼져** 있습니다(동일한 익명 게스트 요청 스택: 프록시 / `cc` / 캐시). **Region Bypass → 검색**에서 켜세요. 저장된 지역 차단 앱 ID는 검색 결과에서 강조 표시할 수 있습니다.

## 작동 방식

```
Steam 앱 페이지 로드
       │
       ▼
#error_box / Oops가 “unavailable in your region”과 일치하는가?
       │
       ├── 아니오 ──► 대기(설정 버튼은 계속 사용 가능)
       │
       └── 예 ──► 대상 URL 구성(?l= 언어, 선택적 ?cc=)
                │
                ▼
       캐시 적중(TTL 내)? ── 예 ──► 저장된 게스트 HTML 사용
                │ 아니오
                ▼
       선택 사항: 프록시 게이트웨이를 통해 URL 재작성
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       HTML 파싱 → .game_page_background / #tabletGrid 추출
                │
                ├── 여전히 차단? ──► 오류 표시 + 프록시 제안
                │
                ├── 현재 셸로 이식
                │   ├── title, 클래스, 스타일, 스크립트 동기화
                │   ├── 로그인 사용자 큐 컨트롤 복원
                │   └── 실패 → document.write(게스트 HTML) 폴백
                │
                └── 배너 + 기능 재부팅(성공한 HTML은 캐시에 저장)
```

### 게스트 검색

Region Bypass 패널(**검색 탭**)에서:

1. **게스트 검색 제안**(기본 활성화) — 상점 헤더 검색에 입력하면 `/search/results`에서 익명 제안을 가져옵니다(최대 25개 게임). 사용 가능한 경우 `/api/storesearch/` 데이터로 보강합니다(폴백: `/search/suggest`).
2. **게스트 `/search` 페이지**(기본 비활성화) — 이 설정을 켜면 검색을 제출하거나 `/search/?term=…`을 열 때 게스트로 결과를 다시 가져와 페이지에 주입할 수 있습니다.
3. 선택적 **차단된 게임 레지스트리**는 이전에 지역 오류 페이지에서 열었던 앱을 강조 표시합니다.
4. **검색에서 차단 자동 감지**(기본 활성화) — 로그인된 Steam 쿠키로 각 결과를 조사하고 지역 제한 앱을 차단 목록에 추가합니다(진행률 표시줄 + 항목별 로더, 범위와 동시성 설정 가능).

앱 페이지 우회와 동일한 프록시, `cc`, 언어, 캐시 설정을 사용합니다.

### 익명 요청

Steam은 종종 **계정 국가**로 상점 페이지를 제한합니다. 세션 쿠키 없는 권한 요청은 해당 IP에 대한 공개 상점 레이아웃을 반환할 수 있습니다. 스크립트는 우회 요청에 로그인 세션을 절대 사용하지 않습니다.

### 상점 언어

게스트 요청은 가능한 경우 Steam 상점 언어를 반영합니다:

1. 현재 페이지의 `Steam_Language` 쿠키
2. 그렇지 않으면 UI/브라우저 로케일에서 파생된 언어
3. `?l=…`, `Cookie: Steam_Language=…`, `Accept-Language`로 적용

### 프록시 게이트웨이

유저스크립트 관리자는 `GM_xmlhttpRequest`에 시스템 SOCKS/HTTP 프록시를 **연결할 수 없습니다**. 차단이 IP 기반이면 패널에서 다른 네트워크를 통해 Steam URL을 가져오는 로컬 또는 원격 **HTTP 게이트웨이**를 지정하세요.

| 모드 | 요청 예시 |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

이 저장소에는 선택적 Node 게이트웨이가 포함되어 있습니다: [`proxy-gateway.mjs`](proxy-gateway.mjs).

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

그런 다음 유저스크립트 패널에서: Host `127.0.0.1`, Port `8765`, 모드 `host:port/https://…`, 프록시 **켜기**.

## 저장소 구조

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # 로케일 + bootDocument + region:rewrote 핸들러
│   ├── core/                   # 설정, 캐시, 차단된 앱, bus, 상수, 디버그
│   ├── region/                 # 감지, 요청, 이식, 큐, 수정, 우회
│   ├── features/search/        # 제안 API/파싱/렌더/헤더, /search 페이지, 프로브
│   ├── features/settings/      # 패널, 컨트롤, 확인, 페이지
│   ├── i18n/                   # 로케일 메타데이터 + 10개 언어 파일
│   ├── ui/                     # 토스트 알림
│   ├── utils/                  # dom, html, pool, 탐색, 스크롤 잠금
│   └── styles/                 # tokens, base, panel, region, search, cache, toast
├── tests/                      # Node 내장 단위 테스트
├── scripts/                    # 빌드 / 아티팩트 도우미
├── steam-region-block-bypass.user.js   # 설치 가능한 유저스크립트(커밋된 아티팩트)
├── steam-region-block-bypass.meta.js   # 업데이트 확인용 메타데이터
├── proxy-gateway.mjs           # 선택적 로컬 HTTP 게이트웨이(Node)
├── package.json                # 종속성, 버전, 스크립트
├── README.md                   # 문서 및 설치 안내
├── CHANGELOG.md                # 버전 기록
├── DESIGN.md                   # 시각 언어 및 CSS 토큰 규칙
├── LICENSE                     # MIT 라이선스
└── .gitattributes / .gitignore
```

| 파일 | 용도 |
|------|---------|
| `steam-region-block-bypass.user.js` | `@downloadURL` / `@updateURL`로 제공되는 전체 스크립트 |
| `steam-region-block-bypass.meta.js` | 경량 메타데이터 미러. 업데이트 확인 시 전체 스크립트 대신 가져올 수 있습니다 |
| `proxy-gateway.mjs` | IP 기반 지역 차단을 위한 선택적 로컬 릴레이 |

## 스크립트 메타데이터

관리자가 사용하는 주요 `// ==UserScript==` 필드:

| 필드 | 값 |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | 시맨틱 버전(모든 릴리스마다 올려야 함) |
| `@updateURL` / `@downloadURL` | `steam-region-block-bypass.user.js`의 GitHub raw URL |
| `@homepageURL` | 이 저장소 |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*`(사용자 지정 프록시 게이트웨이) |

en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl에 대한 현지화된 `@name` 및 `@description` 태그가 제공됩니다.

## 필요한 권한

| 권한 | 용도 |
|-------|---------|
| `GM_xmlhttpRequest` | 페이지 쿠키 / CORS 제한 없이 상점 페이지 가져오기 |
| `GM_getValue` / `GM_setValue` | 프록시 및 UI 설정 저장 |
| `GM_addStyle` | Steam 스타일 패널 및 배너 CSS 주입 |
| `GM_registerMenuCommand` | 유저스크립트 관리자 메뉴에서 설정 열기 |

사용자가 구성한 프록시 게이트웨이 호스트를 호출할 수 있도록 `@connect *`가 필요합니다.

## 개발

**Vite** + **vite-plugin-monkey**로 빌드됩니다. [`src/`](src/) 아래의 ESM 모듈을 편집한 뒤 `npm run build`를 실행해 커밋된 설치 아티팩트를 갱신하세요. 자세한 내용: [DEVELOPMENT.md](DEVELOPMENT.md), [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm install
npm run dev      # Vite를 통한 라이브 "dev:" 유저스크립트
npm run build    # 프로덕션 → dist/ + 루트 .user.js / .meta.js
npm test         # Node 내장 단위 테스트
npm run ci       # 테스트 + 빌드 + 아티팩트 검증
npm run gateway  # 선택적 로컬 프록시 게이트웨이
```

### 로컬 워크플로(Violentmonkey)

1. 이 저장소를 클론하고 `npm run build`를 실행합니다.
2. Violentmonkey에서 로컬 루트의 `steam-region-block-bypass.user.js`로 설치합니다.
3. 설치 대화상자를 닫기 전에 **로컬 파일 추적**을 활성화합니다.
4. `src/`를 편집하고 다시 빌드한 뒤 Steam 페이지를 새로고침하거나, HMR을 위해 `npm run dev`를 사용합니다.

### 로컬 워크플로(Tampermonkey)

Tampermonkey는 로컬 파일을 기본적으로 추적하지 않습니다. 옵션:

- `npm run dev`를 사용하고 제공되는 `dev:` 유저스크립트를 설치하거나
- `npm run build` 후마다 빌드된 파일 / URL에서 다시 설치하거나
- 개발 중에만 `@updateURL` / `@downloadURL`을 `http://localhost:...`로 임시 지정합니다(로컬 URL을 커밋하지 마세요).

### 설정

설정은 설정 패널을 통해 유저스크립트 저장소에 저장됩니다(`srbb_settings_v2`. 평면 `srbb_settings` v1 객체는 한 번 마이그레이션되고 다운그레이드를 위해 그대로 유지됩니다):

| 설정 | 기본값 | 설명 |
|---------|---------|-------------|
| 인터페이스 언어 | 자동 | 패널 / 메시지 언어. `자동`은 브라우저를 따릅니다. 게스트 요청에서는 Steam 상점 언어 쿠키가 여전히 우선합니다 |
| 지역 우회 활성화 | 켜짐 | 페이지 감지, 자동/수동 모드, 배너, 다른 사이트 버튼, 큐 복원을 제어합니다. 게스트 검색에는 자체 스위치가 있습니다 |
| 우회 트리거 | 자동 | **자동**은 지역 오류 페이지에서 실행됩니다. **버튼 표시**는 수동 작업을 기다립니다 |
| 배너 표시 | 켜짐 | 우회된 페이지 위에 지역 알림을 표시합니다 |
| 상점 국가(`cc`) | 비어 있음 | 게스트 요청용 선택적 Steam 국가 코드 |
| 토스트 알림 표시 | 켜짐 | 설정 변경 시 Steam 스타일 부동 알림. 끌 수 있습니다 |
| 토스트 위치 | 오른쪽 위 | 토스트 모서리: 위/아래 × 왼쪽/오른쪽 |
| 게스트 검색 제안 | 켜짐 | **검색** 탭: 헤더 익명 제안 |
| 게스트 `/search` 페이지 | 꺼짐 | **검색** 탭: 현재 결과를 익명 게스트 요청으로 교체 |
| 차단된 게임 기억 | 켜짐 | **검색** 탭: Steam이 지역 오류를 표시할 때 앱 ID 저장 |
| 검색에서 차단 항목 강조 | 켜짐 | **검색** 탭: 게스트 결과에서 저장된 게임에 배지 표시 |
| 검색에서 차단 자동 감지 | 켜짐 | **검색** 탭: 로그인 세션으로 결과 페이지 조사. 범위와 동시성 설정 가능 |
| 캐시 기간(분) | `60` | **캐시** 탭: 성공한 게스트 페이지를 이 시간 동안 재사용합니다. `0`은 캐시 비활성화. 배너의 **새로고침**은 항상 최신 데이터를 가져옵니다 |
| 최대 캐시 페이지 수 | `30` | **캐시** 탭: 유지할 최신 게스트 HTML 항목(10 MB 미터의 소프트 예산) |
| 앱 / 검색 페이지 캐시 | 켜짐 / 켜짐 | **캐시** 탭: 저장할 게스트 HTML 종류. 끄면 쓰기를 중단하고 해당 종류를 정리합니다 |
| 프록시 게이트웨이 사용 | 꺼짐 | 익명 요청을 게이트웨이로 라우팅 |
| 게이트웨이 모드 | `gateway` | 대상 URL을 `host:port`에 추가하는 방식 |
| 호스트 / 포트 | 비어 있음 | 게이트웨이 주소(예: `127.0.0.1` / `8765`) |
| 사용자 이름 / 비밀번호 | 비어 있음 | 게이트웨이용 선택적 HTTP Basic 인증 |

설정은 `srbb_settings_v2`에 기록됩니다. 페이지 캐시는 기존 `srbb_page_cache` 키를, 차단 레지스트리는 `srbb_blocked_apps`를 유지합니다.

## 면책 조항

이 프로젝트는 Valve 또는 Steam과 **제휴하지 않습니다**. 지역 제한을 우회하는 것은 [Steam 가입자 계약](https://store.steampowered.com/subscriber_agreement/)을 위반할 수 있습니다. 사용에 따른 책임은 사용자에게 있습니다. 이 스크립트는 Steam이 이미 익명 방문자에게 제공하는 상점 정보를 **열람**하기 위한 것이며, 제품을 구매하거나 활성화하지 않습니다.

## 라이선스

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
