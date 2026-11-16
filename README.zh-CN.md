# Steam Region Block Bypass

[English](README.md) · [Русский](README.ru.md) · **简体中文** · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![安装用户脚本](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

一款适用于 Steam 商店的用户脚本，可恢复**被区域封锁的商品页面**，并提供可选的**访客搜索**——页头中的匿名搜索建议，以及可选择启用的访客 `/search` 页面，全程不使用账号 Cookie。

脚本会在**不使用账号 Cookie** 的情况下重新获取应用 URL（访客视图），将真实的商店布局移植到当前文档中，并在移植后为已登录用户恢复愿望单、关注和忽略控件。**访客搜索建议**默认开启；完整的 **`/search` 页面**访客模式默认关闭（在 Region Bypass → 搜索中开启）。对于基于 IP 的封锁，可在 Steam 风格的设置面板（账号菜单 → Region Bypass 设置）中配置可选的**代理网关**。

兼容 [Tampermonkey](https://www.tampermonkey.net/)、[Violentmonkey](https://violentmonkey.github.io/)、[Greasemonkey](https://www.greasespot.net/)、ScriptCat 以及其他支持 `// ==UserScript==` 元数据块的脚本管理器。

## 截图

真实用户脚本运行在 Steam 商店的实时页面上。

![包含常规、搜索、缓存、代理和关于页面的 Region Bypass 设置面板](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![常规 — 界面语言、绕过模式、商店国家/地区、toast 通知](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**常规** — 界面语言、自动/手动绕过、横幅、商店国家/地区、toast 通知 | ![搜索 — 访客建议、可选 /search 页面、已封锁游戏记录、探测](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**搜索** — 访客建议、可选 `/search` 页面、已封锁游戏记录、自动探测 |
| ![缓存 — 用量指示、TTL、条目上限、按来源缓存、封锁列表](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**缓存** — 用量指示、TTL、条目上限、按来源缓存、封锁列表 | ![代理网关 — URL 模式、主机/端口、可选 HTTP Basic 认证](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**代理网关** — URL 模式、主机/端口、可选 HTTP Basic 认证 |

商店页头中的访客搜索建议——**Call of Duty: Modern Warfare 4** 被标记为**区域封锁**，其他结果仍可正常显示：

![Steam 页头中 Call of Duty: Modern Warfare 4 的访客搜索建议，带有 Region blocked 标记](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## 快速安装

1. 安装用户脚本管理器（推荐 Tampermonkey 或 Violentmonkey）。
2. 点击下方安装链接——管理器应会弹出安装确认。

**安装 URL：**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![安装](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### 从 URL 安装（管理面板）

| 管理器 | 路径 |
|---------|------|
| Tampermonkey | 管理面板 → **实用工具** → **从 URL 安装** |
| Violentmonkey | 管理面板 → **+** → **从 URL 安装** |
| Greasemonkey | 附加组件菜单 → **新建用户脚本** → 粘贴原始 URL |

粘贴上方的[安装 URL](#快速安装)。

### 手动安装

1. 在本仓库中打开 [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js)。
2. 复制文件的全部内容。
3. 在用户脚本管理器中新建脚本并粘贴代码。
4. 保存并启用脚本。

## 更新

脚本包含指向 GitHub 原始文件的 `@updateURL` 和 `@downloadURL` 元数据。受支持的管理器会自动检查更新（Tampermonkey：管理面板 → 检查间隔；Violentmonkey：类似）。

**发布新版本：**

1. 在 `package.json` 中提升 `version`（SemVer）。
2. 运行 `npm run build`（刷新根目录的 `.user.js` / `.meta.js`）。
3. 在 [`CHANGELOG.md`](CHANGELOG.md) 中添加条目。
4. 推送到 `main`（或创建 GitHub Release）。

管理器会将已安装的 `@version` 与远程元数据进行比较，以决定是否提供更新。完整流程见 [DEVELOPMENT.md](DEVELOPMENT.md)。

## 功能

- **优先移植式注入**——将访客游戏布局替换到正在使用的 `#responsive_page_template_content` 中，同时保留登录后的页头、会话全局变量、已加载的样式和脚本；`document.write` 保留为整页重写回退方案
- **已登录队列控件恢复**——移植后重建愿望单、关注和忽略控件，并通过当前会话提交操作
- **自动绕过或按钮**——在封锁页面上立即运行，或先显示手动操作提示
- **匿名请求**——使用 `GM_xmlhttpRequest` 并设置 `anonymous: true`（不携带登录 Cookie）
- **商店语言**——访客请求使用 `Steam_Language`、`?l=` 和 `Accept-Language`，使页面与你的 Steam 界面语言一致
- **年龄验证 Cookie**——发送 `birthtime` / 成人内容 Cookie，降低访客页面停留在年龄验证的概率
- **可选的商店国家/地区（`cc`）**——为访客请求覆盖 Steam 商店国家/地区
- **代理网关面板**——启用/禁用、主机、端口、用户名、密码、URL 模式
- **区域总开关 + 横幅控制**——可禁用页面绕过而不影响访客搜索；可按需隐藏区域横幅
- **Steam 风格界面**——设置入口位于账号下拉菜单（`#account_dropdown`，SteamDB 风格）；未登录时在 `#global_actions` 中提供回退按钮；首页列表式面板，包含常规 / 搜索 / 缓存 / 代理 / 关于页面，支持草稿编辑、重置、取消、保存和保存并重新加载
- **本地化界面**——面板和消息支持 en、ru、zh-CN、es、pt-BR、de、fr、ja、ko、pl；界面语言选择器支持浏览器自动检测
- **手动控制**——重新加载注入内容，从横幅或用户脚本管理器菜单打开设置
- **访客搜索建议**——默认开启：通过同一套访客请求栈（代理 / `cc` / 缓存）获取匿名建议下拉列表；可在 **Region Bypass → 搜索**中关闭
- **访客 `/search` 页面**——选择性开启：对 `store.steampowered.com/search` 进行匿名重新获取和注入（同一套请求栈）；在 **Region Bypass → 搜索**中单独启用
- **缓存标签页**——用量指示、TTL 和最大条目数、选择要存储的访客页面类型、浏览/删除缓存的 HTML、浏览/清空已封锁游戏列表
- **已封锁游戏记录**——记住被区域封锁的应用 ID（搜索标签页中的开关），并在访客搜索中高亮显示；可在**缓存**标签页查看和清空

## 支持的页面

| 站点 | URL 模式 | 说明 |
|------|-------------|-------|
| Steam 商店（应用） | `https://store.steampowered.com/app/{id}/…` | 区域错误绕过（主要用途） |
| Steam 商店（搜索） | 页头搜索 + `https://store.steampowered.com/search/?term=…` | **访客搜索建议**和可选的**访客 /search 页面**（Region Bypass → 搜索） |

当 Steam 显示**“This item is currently unavailable in your region”**（该商品在您所在地区不可用）时，应用页面即可生效——例如受限地区的 **Call of Duty: Modern Warfare 4**。**访客搜索建议**默认对页头搜索栏启用。完整 `/search` 页面的访客重新获取**默认关闭**（使用同一套匿名访客请求栈：代理 / `cc` / 缓存）——可在 **Region Bypass → 搜索**中开启。已保存的区域封锁应用 ID 可在搜索结果中高亮显示。

## 工作原理

```
Steam 应用页面加载
       │
       ▼
#error_box / Oops 是否匹配 “unavailable in your region”？
       │
       ├── 否 ──► 空闲（设置按钮仍然可用）
       │
       └── 是 ──► 构建目标 URL（?l= 语言，可选 ?cc=）
                │
                ▼
       命中缓存（在 TTL 内）？ ── 是 ──► 使用已存储的访客 HTML
                │ 否
                ▼
       可选：通过代理网关重写 URL
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       解析 HTML → 提取 .game_page_background / #tabletGrid
                │
                ├── 仍被封锁？ ──► 显示错误 + 建议使用代理
                │
                ├── 移植到正在使用的页面外壳
                │   ├── 同步 title、类名、样式、脚本
                │   ├── 恢复已登录用户的队列控件
                │   └── 失败 → document.write(访客 HTML) 回退
                │
                └── 横幅 + 功能重新启动（成功的 HTML 保存到缓存）
```

### 访客搜索

在 Region Bypass 面板（**搜索**标签页）中：

1. **访客搜索建议**（默认开启）——在商店页头搜索框中输入时，从 `/search/results` 匿名获取建议（最多 25 个游戏），在可用时用 `/api/storesearch/` 数据补充（回退：`/search/suggest`）。
2. **访客 `/search` 页面**（默认关闭）——启用此设置后，提交搜索或打开 `/search/?term=…` 时会以访客身份重新获取结果并注入页面。
3. 可选的**已封锁游戏记录**会高亮显示你之前在区域错误页面上打开过的应用。
4. **在搜索中自动检测封锁**（默认开启）会使用你已登录的 Steam Cookie 探测每个结果，并将区域限制的应用加入封锁列表（进度条 + 逐项加载指示；范围和并发数可配置）。

使用与页面绕过相同的代理、`cc`、语言和缓存设置。

### 匿名请求

Steam 经常按**账号国家/地区**限制商店页面。不带会话 Cookie 的请求可能返回该 IP 对应的公开商店布局。脚本从不使用你的登录会话执行绕过请求。

### 商店语言

访客请求会尽可能匹配你的 Steam 商店语言：

1. 当前页面的 `Steam_Language` Cookie
2. 否则使用由界面/浏览器区域设置推导出的语言
3. 以 `?l=…`、`Cookie: Steam_Language=…` 和 `Accept-Language` 的形式应用

### 代理网关

用户脚本管理器**无法**为 `GM_xmlhttpRequest` 附加系统 SOCKS/HTTP 代理。当封锁基于 IP 时，请在面板中将请求指向一个本地或远程 **HTTP 网关**，由它从其他网络获取 Steam URL。

| 模式 | 请求示例 |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

本仓库包含一个可选的 Node 网关：[`proxy-gateway.mjs`](proxy-gateway.mjs)。

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

然后在用户脚本面板中设置：主机 `127.0.0.1`、端口 `8765`、模式 `host:port/https://…`、代理**开启**。

## 仓库结构

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # 语言区域 + bootDocument + region:rewrote 处理程序
│   ├── core/                   # 设置、缓存、已封锁应用、总线、常量、调试
│   ├── region/                 # 检测、请求、移植、队列、修正、绕过
│   ├── features/search/        # 建议 API/解析/渲染/页头、/search 页面、探测
│   ├── features/settings/      # 面板、控件、确认、页面
│   ├── i18n/                   # 语言区域元数据 + 十个语言文件
│   ├── ui/                     # toast 通知
│   ├── utils/                  # dom、html、pool、导航、滚动锁定
│   └── styles/                 # tokens、base、panel、region、search、cache、toast
├── tests/                      # Node 内置单元测试
├── scripts/                    # 构建 / 产物辅助脚本
├── steam-region-block-bypass.user.js   # 可安装的用户脚本（已提交产物）
├── steam-region-block-bypass.meta.js   # 用于更新检查的元数据文件
├── proxy-gateway.mjs           # 可选本地 HTTP 网关（Node）
├── package.json                # 依赖、版本、脚本
├── README.md                   # 文档和安装说明
├── CHANGELOG.md                # 版本历史
├── DESIGN.md                   # 视觉语言和 CSS token 规则
├── LICENSE                     # MIT 许可证
└── .gitattributes / .gitignore
```

| 文件 | 用途 |
|------|---------|
| `steam-region-block-bypass.user.js` | 通过 `@downloadURL` / `@updateURL` 提供的完整脚本 |
| `steam-region-block-bypass.meta.js` | 轻量元数据镜像；管理器检查更新时可用它代替完整脚本 |
| `proxy-gateway.mjs` | 用于基于 IP 的区域封锁的可选本地中继 |

## 脚本元数据

管理器使用的关键 `// ==UserScript==` 字段：

| 字段 | 值 |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | 语义化版本（每次发布都必须提升） |
| `@updateURL` / `@downloadURL` | `steam-region-block-bypass.user.js` 的 GitHub 原始 URL |
| `@homepageURL` | 本仓库 |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*`（自定义代理网关） |

提供 en、ru、zh-CN、es、pt-BR、de、fr、ja、ko 和 pl 的本地化 `@name` 与 `@description` 标签。

## 所需权限

| 授权 | 用途 |
|-------|---------|
| `GM_xmlhttpRequest` | 获取商店页面，不受页面 Cookie / CORS 限制 |
| `GM_getValue` / `GM_setValue` | 保存代理和界面设置 |
| `GM_addStyle` | 注入 Steam 风格的面板和横幅 CSS |
| `GM_registerMenuCommand` | 从用户脚本管理器菜单打开设置 |

需要 `@connect *`，以便脚本能够访问用户配置的代理网关主机。

## 开发

使用 **Vite** + **vite-plugin-monkey** 构建。编辑 [`src/`](src/) 下的 ESM 模块，然后运行 `npm run build` 刷新已提交的安装产物。详情见 [DEVELOPMENT.md](DEVELOPMENT.md)、[CONTRIBUTING.md](CONTRIBUTING.md)。

```bash
npm install
npm run dev      # 通过 Vite 提供实时 "dev:" 用户脚本
npm run build    # 生产构建 → dist/ + 根目录 .user.js / .meta.js
npm test         # Node 内置单元测试
npm run ci       # 测试 + 构建 + 产物校验
npm run gateway  # 可选的本地代理网关
```

### 本地工作流（Violentmonkey）

1. 克隆本仓库并运行 `npm run build`。
2. 在 Violentmonkey 中从本地根目录的 `steam-region-block-bypass.user.js` 安装。
3. 在关闭安装对话框之前启用 **跟踪本地文件**。
4. 编辑 `src/`，重新构建，重新加载 Steam 页面——或使用 `npm run dev` 进行热更新。

### 本地工作流（Tampermonkey）

Tampermonkey 原生不支持跟踪本地文件。可选方案：

- 使用 `npm run dev` 并安装提供的 `dev:` 用户脚本，或
- 每次 `npm run build` 后从构建文件 / URL 重新安装，或
- 开发期间临时将 `@updateURL` / `@downloadURL` 指向 `http://localhost:...`（不要提交本地 URL）。

### 配置

设置通过设置面板存储在用户脚本存储中（`srbb_settings_v2`；扁平的 `srbb_settings` v1 对象会迁移一次，并保留原样以便降级）：

| 设置 | 默认值 | 说明 |
|---------|---------|-------------|
| 界面语言 | 自动 | 面板 / 消息语言；`自动`跟随浏览器。Steam 商店语言 Cookie 在访客请求中仍然优先 |
| 启用区域绕过 | 开 | 控制页面检测、自动/手动模式、横幅、其他站点按钮和队列恢复。访客搜索有自己的开关 |
| 绕过触发方式 | 自动 | **自动**在区域错误页面上运行；**显示按钮**等待手动操作 |
| 显示横幅 | 开 | 在已绕过的页面上方显示区域提示 |
| 商店国家/地区（`cc`） | 空 | 访客请求的可选 Steam 国家/地区代码 |
| 显示 toast 通知 | 开 | 设置更改时显示 Steam 风格浮动通知；可关闭 |
| Toast 位置 | 右上 | toast 所在角落：上/下 × 左/右 |
| 访客搜索建议 | 开 | **搜索**标签页：页头匿名建议 |
| 访客 `/search` 页面 | 关 | **搜索**标签页：用匿名访客请求替换当前结果 |
| 记住已封锁游戏 | 开 | **搜索**标签页：当 Steam 显示区域错误时保存应用 ID |
| 在搜索中高亮封锁项 | 开 | **搜索**标签页：在访客结果中标记已保存的游戏 |
| 在搜索中自动检测封锁 | 开 | **搜索**标签页：使用已登录会话探测结果页面；范围和并发数可配置 |
| 缓存时长（分钟） | `60` | **缓存**标签页：在此时间内复用成功的访客页面；`0` 禁用缓存。横幅**重新加载**始终获取最新数据 |
| 最大缓存页面数 | `30` | **缓存**标签页：保留最新的访客 HTML 条目（10 MB 用量指示为软预算） |
| 缓存应用 / 搜索页面 | 开 / 开 | **缓存**标签页：存储哪些类型的访客 HTML；关闭后停止写入并清理该类型 |
| 使用代理网关 | 关 | 通过网关路由匿名请求 |
| 网关模式 | `gateway` | 目标 URL 如何追加到 `host:port` |
| 主机 / 端口 | 空 | 网关地址（例如 `127.0.0.1` / `8765`） |
| 用户名 / 密码 | 空 | 网关的可选 HTTP Basic 认证 |

设置写入 `srbb_settings_v2`。页面缓存保留现有的 `srbb_page_cache` 键，封锁记录保留 `srbb_blocked_apps`。

## 免责声明

本项目与 Valve 或 Steam **无任何关联**。规避地理限制可能违反 [Steam 用户协议](https://store.steampowered.com/subscriber_agreement/)。使用风险自负。本脚本旨在**查看** Steam 已经向匿名访客提供的商店信息；它不会购买或激活产品。

## 许可证

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
