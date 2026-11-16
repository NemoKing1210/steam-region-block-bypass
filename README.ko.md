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

스크립트에는 GitHub raw 파일을 가리키는 `@updateURL` 및 `@downloadURL` 메타데이터가 포함되어 있어, 지원되는 관리자는 자동으로 업데이트를 확인합니다. 릴리스 절차는 [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing)에 있습니다.

## 기능

- **지역 차단된 앱 페이지 복원** — 익명 게스트로 다시 요청한 뒤 실제 상점 레이아웃을 현재 문서에 이식합니다(전체 문서 재작성은 폴백으로만 사용)
- **세션 유지** — 이식 후에도 로그인 상태의 위시리스트·팔로우·무시 컨트롤이 계속 작동합니다
- **자동 우회 또는 수동 제안** — 차단된 페이지에서 즉시 실행하거나 먼저 제안을 표시합니다
- **게스트 검색 제안** — 기본 활성화: 상점 헤더의 익명 제안, 저장된 차단 게임 강조 표시
- **게스트 `/search` 페이지** — 선택 사항: 검색 결과를 익명으로 다시 요청해 주입
- **차단된 게임 레지스트리** — 지역 차단된 앱 ID를 기억하고 검색 결과 프로브 중 자동 감지할 수 있습니다
- **캐시 제어** — 사용량 미터, TTL 및 항목 제한, 소스별 토글, 캐시된 페이지 탐색
- **프록시 게이트웨이** — IP 기반 차단을 위한 선택적 HTTP 릴레이([설정](docs/ARCHITECTURE.md#proxy-gateway))
- **Steam 스타일 설정 패널** — 일반 / 검색 / 캐시 / 프록시 / 정보 페이지, 초안 편집, 저장 및 저장 후 새로고침
- **10개 UI 언어** — 영어, 러시아어, 중국어, 스페인어, 포르투갈어(브라질), 독일어, 프랑스어, 일본어, 한국어, 폴란드어

## 지원 페이지

| 사이트 | URL 패턴 | 참고 |
|------|-------------|-------|
| Steam 상점(앱) | `https://store.steampowered.com/app/{id}/…` | 지역 오류 우회(주 용도) |
| Steam 상점(검색) | 헤더 검색 + `https://store.steampowered.com/search/?term=…` | **게스트 검색 제안** 및 Region Bypass → 검색의 선택적 **게스트 /search 페이지** |

앱 페이지는 Steam이 **“This item is currently unavailable in your region”**(현재 지역에서 이 아이템을 구매할 수 없습니다)을 표시할 때 작동합니다(예: 제한 지역의 **Call of Duty: Modern Warfare 4**). **게스트 검색 제안**은 헤더 검색창에 기본으로 활성화됩니다. 전체 `/search` 페이지의 게스트 재요청은 **기본으로 꺼져** 있습니다(동일한 익명 게스트 요청 스택: 프록시 / `cc` / 캐시). **Region Bypass → 검색**에서 켜세요. 저장된 지역 차단 앱 ID는 검색 결과에서 강조 표시할 수 있습니다.

## 개발자용

이 섹션은 전용 가이드로 이동했습니다:

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — 빌드, 로컬 테스트, 릴리스, 게이트웨이
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — 우회 작동 방식, 저장소 레이아웃, 메타데이터, 권한, 설정 참조
- [CONTRIBUTING.md](CONTRIBUTING.md) — 기여자 워크플로 및 PR 체크리스트
- [AGENTS.md](AGENTS.md) — AI 코딩 에이전트용 지침
- [SECURITY.md](SECURITY.md) — 보안 정책 및 비공개 제보
- [DESIGN.md](DESIGN.md) — 시각 언어 및 CSS 토큰 규칙

## 다른 사용자 스크립트

같은 작성자의 다른 유저스크립트:

| 유저스크립트 | 기능 |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Steam 상점 및 Steam 커뮤니티 콘텐츠를 위한 전체 설정 패널과 페이지 내 번역 — 게임 설명, 리뷰, 프로필 댓글, 뉴스, 가이드 |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | Steam에 [GameStatus.info](https://gamestatus.info) 데이터를 추가 — 게임 카드와 페이지에 보호, 출시일, 점수, 하드웨어 사양 |

## 면책 조항

이 프로젝트는 Valve 또는 Steam과 **제휴하지 않습니다**. 지역 제한을 우회하는 것은 [Steam 가입자 계약](https://store.steampowered.com/subscriber_agreement/)을 위반할 수 있습니다. 사용에 따른 책임은 사용자에게 있습니다. 이 스크립트는 Steam이 이미 익명 방문자에게 제공하는 상점 정보를 **열람**하기 위한 것이며, 제품을 구매하거나 활성화하지 않습니다.

## 라이선스

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
