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

脚本附带指向 GitHub 原始文件的 `@updateURL` 和 `@downloadURL` 元数据，因此受支持的管理器会自动检查更新。发布步骤见 [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing)。

## 功能

- **恢复被区域封锁的应用页面**——匿名访客重新获取，然后将真实商店布局移植到当前文档中（仅在回退时进行整页重写）
- **保持会话完整**——移植后，已登录用户的愿望单、关注和忽略控件继续正常工作
- **自动绕过或手动提示**——在封锁页面上立即运行，或先显示操作提示
- **访客搜索建议**——默认开启：商店页头中的匿名建议，并高亮显示已保存的封锁游戏
- **访客 `/search` 页面**——可选择启用的搜索结果匿名重新获取与注入
- **已封锁游戏记录**——记住被区域封锁的应用 ID，并可在探测搜索结果时自动检测
- **缓存控制**——用量指示、TTL 和条目上限、按来源开关，以及缓存页面浏览器
- **代理网关**——用于基于 IP 封锁的可选 HTTP 中继（[设置说明](docs/ARCHITECTURE.md#proxy-gateway)）
- **Steam 风格设置面板**——常规 / 搜索 / 缓存 / 代理 / 关于页面、草稿编辑、保存和保存并重新加载
- **10 种界面语言**——英语、俄语、中文、西班牙语、葡萄牙语（巴西）、德语、法语、日语、韩语、波兰语

## 支持的页面

| 站点 | URL 模式 | 说明 |
|------|-------------|-------|
| Steam 商店（应用） | `https://store.steampowered.com/app/{id}/…` | 区域错误绕过（主要用途） |
| Steam 商店（搜索） | 页头搜索 + `https://store.steampowered.com/search/?term=…` | **访客搜索建议**和可选的**访客 /search 页面**（Region Bypass → 搜索） |

当 Steam 显示**“This item is currently unavailable in your region”**（该商品在您所在地区不可用）时，应用页面即可生效——例如受限地区的 **Call of Duty: Modern Warfare 4**。页头搜索栏的**访客搜索建议**默认开启；访客 `/search` 页面则需在 **Region Bypass → 搜索**中主动启用。两者使用同一套匿名请求栈（代理 / `cc` / 缓存）。已保存的区域封锁应用 ID 可在搜索结果中高亮显示。

## 面向开发者

本节已移至专门的指南：

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — 构建、本地测试、发布、网关
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — 绕过的工作原理、仓库结构、元数据、权限、设置参考
- [CONTRIBUTING.md](CONTRIBUTING.md) — 贡献者工作流与 PR 检查清单
- [AGENTS.md](AGENTS.md) — 面向 AI 编码代理的说明
- [SECURITY.md](SECURITY.md) — 安全策略与私下报告
- [DESIGN.md](DESIGN.md) — 视觉语言与 CSS token 规则

## 其他用户脚本

同一作者的其他用户脚本：

| 用户脚本 | 功能 |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | 为 Steam 商店和 Steam 社区内容提供完整的设置面板和页面翻译——游戏描述、评测、个人资料评论、新闻和指南 |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | 为 Steam 添加 [GameStatus.info](https://gamestatus.info) 数据——游戏卡片和页面上的保护状态、发行日期、评分和硬件规格 |

## 免责声明

本项目与 Valve 或 Steam **无任何关联**。规避地理限制可能违反 [Steam 用户协议](https://store.steampowered.com/subscriber_agreement/)。使用风险自负。本脚本旨在**查看** Steam 已经向匿名访客提供的商店信息；它不会购买或激活产品。

## 许可证

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
