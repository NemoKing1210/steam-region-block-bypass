# Steam Region Block Bypass

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · **Português (Brasil)** · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Instalar userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

Um userscript para a loja da Steam que restaura **páginas de produto bloqueadas** e adiciona uma **busca de convidado** opcional — sugestões de busca anônimas no cabeçalho e uma página `/search` de convidado ativada separadamente, sem cookies da conta.

Ele refaz a requisição das URLs dos apps **sem cookies da conta** (visão de convidado), transfere o layout real da loja para o documento ativo e restaura os controles de lista de desejos, seguir e ignorar para usuários conectados após a transferência. As **sugestões de busca para convidados** ficam ativadas por padrão; o modo convidado da **página `/search`** completa fica desativado por padrão (ative em Region Bypass → Busca). Para bloqueios baseados em IP, um **gateway proxy** opcional pode ser configurado no painel de configurações com estilo Steam (menu da conta → Configurações do Region Bypass).

Compatível com [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat e outros gerenciadores que suportem o bloco de metadados `// ==UserScript==`.

## Capturas de tela

O userscript real rodando em uma página da loja Steam ao vivo.

![Painel de configurações do Region Bypass com as páginas Geral, Busca, Cache, Proxy e Sobre](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![Geral — idioma da interface, modo de bypass, país da loja, notificações toast](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**Geral** — idioma da interface, bypass automático/manual, banner, país da loja, notificações toast | ![Busca — sugestões de convidado, página /search opcional, registro de jogos bloqueados, sondagem](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**Busca** — sugestões de convidado, página `/search` opcional, registro de jogos bloqueados, sondagem |
| ![Cache — medidor de uso, TTL, limite de entradas, cache por origem, lista de bloqueados](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**Cache** — medidor de uso, TTL, limite de entradas, cache por origem, lista de bloqueados | ![Gateway proxy — modo de URL, host/porta, autenticação HTTP Basic opcional](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**Gateway proxy** — modo de URL, host/porta, autenticação HTTP Basic opcional |

Sugestões de busca para convidados no cabeçalho da loja — **Call of Duty: Modern Warfare 4** aparece marcado como **bloqueado por região**, enquanto os demais resultados continuam disponíveis:

![Sugestões de busca para convidados de Call of Duty: Modern Warfare 4 com o selo Region blocked](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## Instalação rápida

1. Instale um gerenciador de userscripts (recomendados: Tampermonkey ou Violentmonkey).
2. Clique no link de instalação abaixo — o gerenciador deve abrir uma confirmação de instalação.

**URL de instalação:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![Instalar](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### Instalar por URL (painel de controle)

| Gerenciador | Caminho |
|---------|------|
| Tampermonkey | Painel de controle → **Utilitários** → **Instalar por URL** |
| Violentmonkey | Painel de controle → **+** → **Instalar por URL** |
| Greasemonkey | Menu da extensão → **Novo script de usuário** → cole a URL bruta |

Cole a [URL de instalação](#instalação-rápida) acima.

### Instalação manual

1. Abra [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js) neste repositório.
2. Copie todo o conteúdo do arquivo.
3. No seu gerenciador de userscripts, crie um novo script e cole o código.
4. Salve e ative o script.

## Atualizações

O script inclui metadados `@updateURL` e `@downloadURL` apontando para o arquivo bruto do GitHub, então gerenciadores compatíveis verificam atualizações automaticamente. As etapas de lançamento estão em [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing).

## Recursos

- **Restaura páginas de apps bloqueadas por região** — nova requisição anônima de convidado e, em seguida, o layout real da loja é transferido para o documento ativo (reescrita completa do documento apenas como fallback)
- **Mantém sua sessão intacta** — os controles de lista de desejos, seguir e ignorar para usuários conectados continuam funcionando após a transferência
- **Bypass automático ou oferta manual** — execute imediatamente em páginas bloqueadas ou mostre uma oferta primeiro
- **Sugestões de busca para convidados** — ativadas por padrão: sugestões anônimas no cabeçalho da loja, com jogos bloqueados salvos destacados
- **Página `/search` de convidado** — nova requisição e injeção anônimas dos resultados de busca, ativadas separadamente
- **Registro de jogos bloqueados** — lembra IDs de apps bloqueados por região e pode detectá-los automaticamente durante a sondagem dos resultados de busca
- **Controles de cache** — medidor de uso, TTL e limite de entradas, alternâncias por origem e navegador de páginas em cache
- **Gateway proxy** — retransmissor HTTP opcional para bloqueios baseados em IP ([configuração](docs/ARCHITECTURE.md#proxy-gateway))
- **Painel de configurações com estilo Steam** — páginas Geral / Busca / Cache / Proxy / Sobre, edição de rascunho, Salvar e Salvar e recarregar
- **10 idiomas da interface** — inglês, russo, chinês, espanhol, português (Brasil), alemão, francês, japonês, coreano, polonês

## Páginas compatíveis

| Site | Padrão de URL | Observações |
|------|-------------|-------|
| Loja Steam (apps) | `https://store.steampowered.com/app/{id}/…` | Bypass do erro de região (uso principal) |
| Loja Steam (busca) | Busca do cabeçalho + `https://store.steampowered.com/search/?term=…` | **Sugestões de busca para convidados** e **página /search de convidado** opcional em Region Bypass → Busca |

As páginas de apps funcionam quando a Steam mostra **“This item is currently unavailable in your region”** (este item não está disponível na sua região) — por exemplo, **Call of Duty: Modern Warfare 4** em regiões restritas. As sugestões de busca para convidados ficam ativadas por padrão para a barra de busca do cabeçalho; a página `/search` de convidado é opcional em **Region Bypass → Busca**. Ambas usam a mesma pilha de requisições anônimas (proxy / `cc` / cache). IDs de apps bloqueados salvos podem ser destacados nos resultados de busca.

## Para desenvolvedores

Esta seção foi movida para guias dedicados:

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — build, testes locais, lançamento, gateway
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — como o bypass funciona, estrutura do repositório, metadados, permissões, referência de configurações
- [CONTRIBUTING.md](CONTRIBUTING.md) — fluxo do contribuidor e checklist de PR
- [AGENTS.md](AGENTS.md) — instruções para agentes de codificação com IA
- [SECURITY.md](SECURITY.md) — política de segurança e relato privado
- [DESIGN.md](DESIGN.md) — linguagem visual e regras de tokens CSS

## Outros userscripts

Outros userscripts do mesmo autor:

| Userscript | O que faz |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Painel de configurações completo e tradução na página para conteúdo da Steam Store e Steam Community — descrições de jogos, análises, comentários de perfil, notícias e guias |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | Adiciona dados do [GameStatus.info](https://gamestatus.info) à Steam — proteção, datas de lançamento, pontuações e especificações de hardware nos cartões e páginas de jogos |

## Aviso legal

Este projeto **não é afiliado** à Valve nem à Steam. Contornar restrições geográficas pode violar o [Contrato de Assinante da Steam](https://store.steampowered.com/subscriber_agreement/). Use por sua conta e risco. O script destina-se a **visualizar** informações da loja que a Steam já entrega a visitantes anônimos; ele não compra nem ativa produtos.

## Licença

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
