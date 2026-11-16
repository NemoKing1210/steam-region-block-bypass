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

スクリプトには GitHub の raw ファイルを指す `@updateURL` と `@downloadURL` メタデータが含まれているため、対応マネージャーは自動的に更新を確認します。リリース手順は [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing) を参照してください。

## 機能

- **地域ブロックされたアプリページを復元** — 匿名ゲストによる再取得後、実際のストアレイアウトを現在のドキュメントに移植します（完全なドキュメント書き換えはフォールバックとしてのみ使用）
- **セッションを維持** — 移植後もログイン中のウィッシュリスト・フォロー・無視のコントロールが機能し続けます
- **自動バイパスまたは手動提案** — ブロックされたページで即座に実行するか、先に提案を表示します
- **ゲスト検索候補** — 既定で有効: ストアヘッダーの匿名候補で、保存済みのブロック済みゲームが強調表示されます
- **ゲスト `/search` ページ** — 任意で有効化: 検索結果の匿名再取得とインジェクション
- **ブロック済みゲーム登録** — 地域ブロックされたアプリ ID を記憶し、検索結果の調査中に自動検出できます
- **キャッシュ制御** — 使用量メーター、TTL とエントリ上限、ソース別トグル、キャッシュ済みページのブラウザ
- **プロキシゲートウェイ** — IP ベースの制限向けの任意の HTTP リレー（[セットアップ](docs/ARCHITECTURE.md#proxy-gateway)）
- **Steam 風設定パネル** — 一般 / 検索 / キャッシュ / プロキシ / 情報 ページ、下書き編集、保存、保存して再読み込み
- **10 の UI 言語** — 英語、ロシア語、中国語、スペイン語、ポルトガル語（ブラジル）、ドイツ語、フランス語、日本語、韓国語、ポーランド語

## 対応ページ

| サイト | URL パターン | 備考 |
|------|-------------|-------|
| Steam ストア（アプリ） | `https://store.steampowered.com/app/{id}/…` | 地域エラーのバイパス（主な用途） |
| Steam ストア（検索） | ヘッダー検索 + `https://store.steampowered.com/search/?term=…` | **ゲスト検索候補**と、Region Bypass → 検索 の任意の**ゲスト /search ページ** |

アプリページは、Steam が **「This item is currently unavailable in your region」**（お住まいの地域では現在このアイテムを購入できません）を表示したときに機能します（例: 制限地域での **Call of Duty: Modern Warfare 4**）。**ゲスト検索候補**はヘッダーの検索バーで既定で有効です。ゲスト `/search` ページは **Region Bypass → 検索** でオプトインできます。どちらも同じ匿名取得基盤（プロキシ / `cc` / キャッシュ）を使用します。保存した地域ブロック済みアプリ ID は検索結果で強調表示できます。

## 開発者向け

このセクションは専用ガイドに移動しました:

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — ビルド、ローカルテスト、リリース、ゲートウェイ
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — バイパスの仕組み、リポジトリ構成、メタデータ、権限、設定リファレンス
- [CONTRIBUTING.md](CONTRIBUTING.md) — コントリビューターワークフローと PR チェックリスト
- [AGENTS.md](AGENTS.md) — AI コーディングエージェント向けの指示
- [SECURITY.md](SECURITY.md) — セキュリティポリシーと非公開の報告
- [DESIGN.md](DESIGN.md) — ビジュアル言語と CSS トークン規則

## その他のユーザースクリプト

同じ作者による他のユーザースクリプト:

| ユーザースクリプト | 内容 |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Steam ストアと Steam コミュニティのコンテンツ（ゲーム説明、レビュー、プロフィールコメント、ニュース、ガイド）向けの完全な設定パネルとページ内翻訳 |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | Steam に [GameStatus.info](https://gamestatus.info) のデータを追加 — ゲームカードとページに保護情報、リリース日、スコア、ハードウェア仕様を表示 |

## 免責事項

このプロジェクトは Valve や Steam と**提携していません**。地理的制限の回避は [Steam サブスクライバー契約](https://store.steampowered.com/subscriber_agreement/)に違反する可能性があります。自己責任で使用してください。このスクリプトは、Steam が匿名訪問者にすでに提供しているストア情報を**閲覧**するためのものであり、商品の購入やアクティベーションは行いません。

## ライセンス

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
