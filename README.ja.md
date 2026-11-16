# Steam Region Block Bypass

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · **日本語** · [한국어](README.ko.md) · [Polski](README.pl.md)

[![ユーザースクリプトをインストール](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

Steam ストア向けのユーザースクリプトです。**地域ブロックされた商品ページ**を復元し、オプションの**ゲスト検索**を追加します。ヘッダーの匿名検索候補に加え、個別に有効化できるゲスト用 `/search` ページを、アカウント Cookie なしで提供します。

アプリ URL を**アカウント Cookie なし**で再取得（ゲスト表示）し、実際のストアレイアウトを現在のドキュメントに移植したうえで、移植後にログイン中のウィッシュリスト・フォロー・無視のコントロールを復元します。**ゲスト検索候補**は既定で有効、**`/search` ページ**のフルゲストモードは既定で無効です（Region Bypass → 検索 で有効化）。IP ベースの制限には、Steam 風の設定パネル（アカウントメニュー → Region Bypass 設定）からオプションの**プロキシゲートウェイ**を設定できます。

[Tampermonkey](https://www.tampermonkey.net/)、[Violentmonkey](https://violentmonkey.github.io/)、[Greasemonkey](https://www.greasespot.net/)、ScriptCat など、`// ==UserScript==` メタデータブロックに対応したマネージャーと互換性があります。

## スクリーンショット

実際のユーザースクリプトをライブの Steam ストアページで実行した様子です。

![一般・検索・キャッシュ・プロキシ・情報ページを備えた Region Bypass 設定パネル](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![一般 — UI 言語、バイパスモード、ストア国、トースト通知](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**一般** — UI 言語、自動/手動バイパス、バナー、ストア国、トースト通知 | ![検索 — ゲスト候補、任意の /search ページ、ブロック済みゲーム登録、プローブ](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**検索** — ゲスト候補、任意の `/search` ページ、ブロック済みゲーム登録、プローブ |
| ![キャッシュ — 使用量メーター、TTL、エントリ上限、ソース別キャッシュ、ブロック一覧](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**キャッシュ** — 使用量メーター、TTL、エントリ上限、ソース別キャッシュ、ブロック一覧 | ![プロキシゲートウェイ — URL モード、ホスト/ポート、任意の HTTP Basic 認証](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**プロキシゲートウェイ** — URL モード、ホスト/ポート、任意の HTTP Basic 認証 |

ストアヘッダーのゲスト検索候補 — **Call of Duty: Modern Warfare 4** が**地域ブロック**として表示され、他の結果は引き続き利用できます:

![Steam ヘッダーで Call of Duty: Modern Warfare 4 を検索したゲスト候補（Region blocked バッジ付き）](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## クイックインストール

1. ユーザースクリプトマネージャーをインストールします（Tampermonkey または Violentmonkey を推奨）。
2. 下のインストールリンクをクリックします。マネージャーのインストール確認が開きます。

**インストール URL:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![インストール](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### URL からインストール（ダッシュボード）

| マネージャー | 手順 |
|---------|------|
| Tampermonkey | ダッシュボード → **ユーティリティ** → **URL からインストール** |
| Violentmonkey | ダッシュボード → **+** → **URL からインストール** |
| Greasemonkey | アドオンメニュー → **新規ユーザースクリプト** → raw URL を貼り付け |

上記の[インストール URL](#クイックインストール)を貼り付けてください。

### 手動インストール

1. このリポジトリの [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js) を開きます。
2. ファイルの内容をすべてコピーします。
3. ユーザースクリプトマネージャーで新しいスクリプトを作成し、コードを貼り付けます。
4. 保存してスクリプトを有効化します。

## アップデート

スクリプトには GitHub の raw ファイルを指す `@updateURL` と `@downloadURL` メタデータが含まれています。対応マネージャーは自動的に更新を確認します（Tampermonkey: ダッシュボード → 確認間隔、Violentmonkey: 同様）。

**新しいバージョンをリリースするには:**

1. `package.json` の `version` を上げます（SemVer）。
2. `npm run build` を実行します（ルートの `.user.js` / `.meta.js` を更新）。
3. [`CHANGELOG.md`](CHANGELOG.md) にエントリを追加します。
4. `main` にプッシュします（または GitHub Release を作成）。

マネージャーはインストール済みの `@version` とリモートのメタデータを比較し、更新を提示するか判断します。詳細な手順は [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。

## 機能

- **移植優先のインジェクション** — ゲストのゲームレイアウトを現在の `#responsive_page_template_content` に差し替え、ログイン中のヘッダー、セッションのグローバル変数、読み込み済みのスタイルとスクリプトを保持します。`document.write` は完全書き換えのフォールバックとして残ります
- **ログイン中のキュー復元** — 移植後にウィッシュリスト・フォロー・無視のコントロールを再構築し、アクションを現在のセッション経由で送信します
- **自動バイパスまたはボタン** — ブロックされたページで即座に実行するか、先に手動の提案を表示します
- **匿名リクエスト** — `GM_xmlhttpRequest` を `anonymous: true` で使用します（ログイン Cookie なし）
- **ストア言語** — ゲストリクエストは `Steam_Language`、`?l=`、`Accept-Language` を使用し、Steam の UI 言語にページを合わせます
- **年齢確認 Cookie** — `birthtime` / 成人向けコンテンツの Cookie を送信し、ゲストページが年齢確認で止まりにくくします
- **任意のストア国（`cc`）** — ゲストリクエストの Steam ストア国を上書きします
- **プロキシゲートウェイパネル** — 有効/無効、ホスト、ポート、ユーザー名、パスワード、URL モード
- **地域マスタースイッチ + バナー制御** — ゲスト検索に影響せずページバイパスを無効化できます。必要に応じて地域バナーを非表示にできます
- **Steam 風 UI** — アカウントメニューに設定項目（`#account_dropdown`、SteamDB 風）。ログアウト時は `#global_actions` にフォールバックボタン。ホームの一覧パネルに 一般 / 検索 / キャッシュ / プロキシ / 情報 ページ、下書き編集、リセット、キャンセル、保存、保存して再読み込み
- **ローカライズ UI** — パネルとメッセージを en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl で提供。ブラウザ自動検出付きの UI 言語セレクター
- **手動操作** — インジェクトされたコンテンツの再読み込み、バナーまたはユーザースクリプトマネージャーメニューからの設定表示
- **ゲスト検索候補** — 既定で有効: 同じゲストリクエスト基盤（プロキシ / `cc` / キャッシュ）による匿名の候補ドロップダウン。**Region Bypass → 検索**で無効化できます
- **ゲスト `/search` ページ** — オプション: `store.steampowered.com/search` の匿名再取得とインジェクション（同じ基盤）。**Region Bypass → 検索**で個別に有効化します
- **キャッシュタブ** — 使用量メーター、TTL と最大エントリ数、保存するゲストページの種類、キャッシュ HTML の閲覧/削除、ブロック済みゲーム一覧の閲覧/クリア
- **ブロック済みゲーム登録** — 地域ブロックされたアプリ ID を記憶し（検索タブのスイッチ）、ゲスト検索で強調表示します。一覧とクリアは**キャッシュ**タブで行えます

## 対応ページ

| サイト | URL パターン | 備考 |
|------|-------------|-------|
| Steam ストア（アプリ） | `https://store.steampowered.com/app/{id}/…` | 地域エラーのバイパス（主な用途） |
| Steam ストア（検索） | ヘッダー検索 + `https://store.steampowered.com/search/?term=…` | **ゲスト検索候補**と、Region Bypass → 検索 の任意の**ゲスト /search ページ** |

アプリページは、Steam が **「This item is currently unavailable in your region」**（お住まいの地域では現在このアイテムを購入できません）を表示したときに機能します（例: 制限地域での **Call of Duty: Modern Warfare 4**）。**ゲスト検索候補**はヘッダーの検索バーで既定で有効です。`/search` ページ全体のゲスト再取得は**既定で無効**です（同じ匿名ゲストリクエスト基盤: プロキシ / `cc` / キャッシュ）。**Region Bypass → 検索**で有効化してください。保存した地域ブロック済みアプリ ID は検索結果で強調表示できます。

## 仕組み

```
Steam アプリページが読み込まれる
       │
       ▼
#error_box / Oops が「unavailable in your region」に一致するか？
       │
       ├── いいえ ──► 待機（設定ボタンは引き続き利用可能）
       │
       └── はい ──► ターゲット URL を構築（?l= 言語、任意で ?cc=）
                │
                ▼
       キャッシュヒット（TTL 内）？ ── はい ──► 保存済みゲスト HTML を使用
                │ いいえ
                ▼
       任意: プロキシゲートウェイ経由で URL を書き換え
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       HTML を解析 → .game_page_background / #tabletGrid を抽出
                │
                ├── まだブロック？ ──► エラーを表示 + プロキシを提案
                │
                ├── 現在のシェルに移植
                │   ├── title、クラス、スタイル、スクリプトを同期
                │   ├── ログイン中のキューのコントロールを復元
                │   └── 失敗 → document.write(ゲスト HTML) フォールバック
                │
                └── バナー + 機能の再起動（成功した HTML はキャッシュに保存）
```

### ゲスト検索

Region Bypass パネル（**検索タブ**）で:

1. **ゲスト検索候補**（既定で有効）— ストアヘッダーの検索に入力すると、`/search/results` から匿名の候補を取得します（最大 25 ゲーム）。利用可能な場合は `/api/storesearch/` のデータで補完します（フォールバック: `/search/suggest`）。
2. **ゲスト `/search` ページ**（既定で無効）— この設定を有効にすると、検索の送信や `/search/?term=…` を開いたときに、ゲストとして結果を再取得してページにインジェクトできます。
3. 任意の**ブロック済みゲーム登録**は、以前に地域エラーページで開いたアプリを強調表示します。
4. **検索内のブロック自動検出**（既定で有効）— ログイン中の Steam Cookie で各結果を調査し、地域制限されたアプリをブロック一覧に追加します（進行状況バー + 項目ごとのローダー。範囲と並列数は設定可能）。

アプリページのバイパスと同じプロキシ、`cc`、言語、キャッシュ設定を使用します。

### 匿名リクエスト

Steam はしばしば**アカウントの国**でストアページを制限します。セッション Cookie なしの特権リクエストは、その IP 向けの公開ストアレイアウトを返すことがあります。スクリプトがバイパスリクエストにログイン中のセッションを使うことはありません。

### ストア言語

ゲストリクエストは可能な限り Steam ストアの言語を反映します:

1. 現在のページの `Steam_Language` Cookie
2. それ以外は UI/ブラウザのロケールから導出した言語
3. `?l=…`、`Cookie: Steam_Language=…`、`Accept-Language` として適用

### プロキシゲートウェイ

ユーザースクリプトマネージャーは `GM_xmlhttpRequest` にシステムの SOCKS/HTTP プロキシを**接続できません**。制限が IP ベースの場合は、別のネットワークから Steam URL を取得するローカルまたはリモートの **HTTP ゲートウェイ**をパネルで指定します。

| モード | リクエスト例 |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

このリポジトリには任意の Node ゲートウェイが含まれています: [`proxy-gateway.mjs`](proxy-gateway.mjs)。

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

その後、ユーザースクリプトパネルで: Host `127.0.0.1`、Port `8765`、モード `host:port/https://…`、プロキシ**オン**。

## リポジトリ構成

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # ロケール + bootDocument + region:rewrote ハンドラー
│   ├── core/                   # 設定、キャッシュ、ブロック済みアプリ、bus、定数、デバッグ
│   ├── region/                 # 検出、リクエスト、移植、キュー、修正、バイパス
│   ├── features/search/        # 候補 API/解析/描画/ヘッダー、/search ページ、プローブ
│   ├── features/settings/      # パネル、コントロール、確認、ページ
│   ├── i18n/                   # ロケールメタデータ + 10 言語ファイル
│   ├── ui/                     # トースト通知
│   ├── utils/                  # dom、html、pool、ナビゲーション、スクロールロック
│   └── styles/                 # tokens、base、panel、region、search、cache、toast
├── tests/                      # Node 組み込みユニットテスト
├── scripts/                    # ビルド / アーティファクト補助
├── steam-region-block-bypass.user.js   # インストール可能なユーザースクリプト（コミット済みアーティファクト）
├── steam-region-block-bypass.meta.js   # 更新確認用メタデータ
├── proxy-gateway.mjs           # 任意のローカル HTTP ゲートウェイ（Node）
├── package.json                # 依存関係、バージョン、スクリプト
├── README.md                   # ドキュメントとインストール手順
├── CHANGELOG.md                # バージョン履歴
├── DESIGN.md                   # ビジュアル言語と CSS トークン規則
├── LICENSE                     # MIT ライセンス
└── .gitattributes / .gitignore
```

| ファイル | 用途 |
|------|---------|
| `steam-region-block-bypass.user.js` | `@downloadURL` / `@updateURL` で配信される完全なスクリプト |
| `steam-region-block-bypass.meta.js` | 軽量なメタデータミラー。更新確認時に完全なスクリプトの代わりに取得される場合があります |
| `proxy-gateway.mjs` | IP ベースの地域制限向けの任意のローカルリレー |

## スクリプトメタデータ

マネージャーが使用する主要な `// ==UserScript==` フィールド:

| フィールド | 値 |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | セマンティックバージョン（リリースごとに更新必須） |
| `@updateURL` / `@downloadURL` | `steam-region-block-bypass.user.js` の GitHub raw URL |
| `@homepageURL` | このリポジトリ |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*`（カスタムプロキシゲートウェイ） |

en、ru、zh-CN、es、pt-BR、de、fr、ja、ko、pl のローカライズされた `@name` と `@description` タグが用意されています。

## 必要な権限

| 権限 | 用途 |
|-------|---------|
| `GM_xmlhttpRequest` | ページ Cookie / CORS 制限なしでストアページを取得 |
| `GM_getValue` / `GM_setValue` | プロキシと UI 設定を保存 |
| `GM_addStyle` | Steam 風パネルとバナーの CSS を挿入 |
| `GM_registerMenuCommand` | ユーザースクリプトマネージャーメニューから設定を開く |

ユーザーが設定したプロキシゲートウェイホストを呼び出せるよう、`@connect *` が必要です。

## 開発

**Vite** + **vite-plugin-monkey** で構築されています。[`src/`](src/) 配下の ESM モジュールを編集し、`npm run build` を実行してコミット済みのインストールアーティファクトを更新してください。詳細: [DEVELOPMENT.md](DEVELOPMENT.md)、[CONTRIBUTING.md](CONTRIBUTING.md)。

```bash
npm install
npm run dev      # Vite 経由のライブ "dev:" ユーザースクリプト
npm run build    # 本番 → dist/ + ルートの .user.js / .meta.js
npm test         # Node 組み込みユニットテスト
npm run ci       # テスト + ビルド + アーティファクト検証
npm run gateway  # 任意のローカルプロキシゲートウェイ
```

### ローカルワークフロー（Violentmonkey）

1. このリポジトリをクローンし、`npm run build` を実行します。
2. Violentmonkey で、ローカルのルート `steam-region-block-bypass.user.js` からインストールします。
3. インストールダイアログを閉じる前に**ローカルファイルを追跡**を有効にします。
4. `src/` を編集して再ビルドし、Steam ページを再読み込みします。または HMR のために `npm run dev` を使用します。

### ローカルワークフロー（Tampermonkey）

Tampermonkey はローカルファイルをネイティブに追跡しません。選択肢:

- `npm run dev` を使用して配信される `dev:` ユーザースクリプトをインストールする、または
- `npm run build` のたびにビルド済みファイル / URL から再インストールする、または
- 開発中のみ `@updateURL` / `@downloadURL` を `http://localhost:...` に向ける（ローカル URL はコミットしないでください）。

### 設定

設定は設定パネルを通じてユーザースクリプトストレージに保存されます（`srbb_settings_v2`。フラットな `srbb_settings` v1 オブジェクトは一度だけ移行され、ダウングレード用にそのまま残されます）:

| 設定 | 既定値 | 説明 |
|---------|---------|-------------|
| UI 言語 | 自動 | パネル / メッセージの言語。`自動`はブラウザに従います。ゲストリクエストでは Steam のストア言語 Cookie が引き続き優先されます |
| 地域バイパスを有効化 | オン | ページ検出、自動/手動モード、バナー、他サイトのボタン、キュー復元を制御します。ゲスト検索には独自のスイッチがあります |
| バイパスのトリガー | 自動 | **自動**は地域エラーページで実行されます。**ボタンを表示**は手動操作を待ちます |
| バナーを表示 | オン | バイパスされたページの上に地域の通知を表示します |
| ストア国（`cc`） | 空 | ゲストリクエスト用の任意の Steam 国コード |
| トースト通知を表示 | オン | 設定変更時の Steam 風フローティング通知。無効にできます |
| トースト位置 | 右上 | トーストの隅: 上/下 × 左/右 |
| ゲスト検索候補 | オン | **検索**タブ: ヘッダーの匿名候補 |
| ゲスト `/search` ページ | オフ | **検索**タブ: 現在の結果を匿名ゲストリクエストに置き換え |
| ブロック済みゲームを記憶 | オン | **検索**タブ: Steam が地域エラーを表示したときにアプリ ID を保存 |
| 検索でブロック済みを強調表示 | オン | **検索**タブ: ゲスト結果で保存済みゲームにバッジを表示 |
| 検索内のブロックを自動検出 | オン | **検索**タブ: ログイン中のセッションで結果ページを調査。範囲と並列数は設定可能 |
| キャッシュ期間（分） | `60` | **キャッシュ**タブ: 成功したゲストページをこの時間再利用します。`0`でキャッシュ無効。バナーの**再読み込み**は常に最新を取得します |
| キャッシュ最大ページ数 | `30` | **キャッシュ**タブ: 保持する最新のゲスト HTML エントリ（10 MB メーターのソフト上限） |
| アプリ / 検索ページをキャッシュ | オン / オン | **キャッシュ**タブ: 保存するゲスト HTML の種類。オフにすると書き込みを停止し、その種類を削除します |
| プロキシゲートウェイを使用 | オフ | 匿名リクエストをゲートウェイ経由でルーティング |
| ゲートウェイモード | `gateway` | ターゲット URL を `host:port` に追加する方法 |
| ホスト / ポート | 空 | ゲートウェイアドレス（例: `127.0.0.1` / `8765`） |
| ユーザー名 / パスワード | 空 | ゲートウェイ用の任意の HTTP Basic 認証 |

設定は `srbb_settings_v2` に書き込まれます。ページキャッシュは既存の `srbb_page_cache` キーを、ブロック登録は `srbb_blocked_apps` を保持します。

## 免責事項

このプロジェクトは Valve や Steam と**提携していません**。地理的制限の回避は [Steam サブスクライバー契約](https://store.steampowered.com/subscriber_agreement/)に違反する可能性があります。自己責任で使用してください。このスクリプトは、Steam が匿名訪問者にすでに提供しているストア情報を**閲覧**するためのものであり、商品の購入やアクティベーションは行いません。

## ライセンス

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
