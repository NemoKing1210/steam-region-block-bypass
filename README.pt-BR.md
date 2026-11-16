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

O script inclui metadados `@updateURL` e `@downloadURL` apontando para o arquivo bruto do GitHub. Gerenciadores compatíveis verificam atualizações automaticamente (Tampermonkey: painel de controle → intervalo de verificação; Violentmonkey: semelhante).

**Para lançar uma nova versão:**

1. Atualize `version` em `package.json` (SemVer).
2. Execute `npm run build` (atualiza os `.user.js` / `.meta.js` da raiz).
3. Adicione uma entrada em [`CHANGELOG.md`](CHANGELOG.md).
4. Envie para `main` (ou crie um GitHub Release).

Os gerenciadores comparam o `@version` instalado com os metadados remotos para decidir se oferecem uma atualização. Consulte [DEVELOPMENT.md](DEVELOPMENT.md) para o fluxo completo.

## Recursos

- **Injeção com transferência prioritária** — troca o layout do jogo de convidado no `#responsive_page_template_content` ativo, preservando o cabeçalho da sessão conectada, as variáveis globais de sessão e os estilos e scripts carregados; `document.write` continua sendo o fallback de reescrita completa
- **Restauração da fila para conectados** — recria os controles de lista de desejos, seguir e ignorar após uma transferência e envia as ações pela sessão ativa
- **Bypass automático ou botão** — executa imediatamente em páginas bloqueadas ou mostra primeiro uma oferta manual
- **Requisição anônima** — usa `GM_xmlhttpRequest` com `anonymous: true` (sem cookies de login)
- **Idioma da loja** — a requisição de convidado usa `Steam_Language`, `?l=` e `Accept-Language` para que a página corresponda ao idioma da sua interface Steam
- **Cookies de verificação de idade** — envia cookies `birthtime` / de conteúdo adulto para que as páginas de convidado parem menos na verificação de idade
- **País da loja opcional (`cc`)** — substitui o país da loja Steam na requisição de convidado
- **Painel do gateway proxy** — ativar/desativar, host, porta, usuário, senha, modo de URL
- **Chave mestra de região + controle do banner** — desativa o bypass de páginas sem afetar a busca de convidado; oculta o banner de região quando quiser
- **Interface no estilo Steam** — entrada de configurações no menu suspenso da conta (`#account_dropdown`, estilo SteamDB); botão alternativo para deslogados em `#global_actions`; painel em lista na página inicial com páginas Geral / Busca / Cache / Proxy / Sobre, edição de rascunho, Redefinir, Cancelar, Salvar e Salvar e recarregar
- **Interface localizada** — painel e mensagens em en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl; seletor de idioma da interface com detecção automática do navegador
- **Controles manuais** — recarrega o conteúdo injetado, abre as configurações pelo banner ou pelo menu do gerenciador de userscripts
- **Sugestões de busca para convidados** — ativadas por padrão: lista de sugestões anônimas pela mesma pilha de requisições de convidado (proxy / `cc` / cache); desative em **Region Bypass → Busca**
- **Página `/search` de convidado** — opcional: nova requisição e injeção anônimas para `store.steampowered.com/search` (mesma pilha); ative separadamente em **Region Bypass → Busca**
- **Aba Cache** — medidor de uso, TTL e máximo de entradas, escolha de quais páginas de convidado armazenar, navegação/remoção do HTML em cache, navegação/limpeza da lista de jogos bloqueados
- **Registro de jogos bloqueados** — lembra IDs de apps bloqueados por região (chaves na aba Busca) e os destaca na busca de convidado; lista e limpeza em **Cache**

## Páginas compatíveis

| Site | Padrão de URL | Observações |
|------|-------------|-------|
| Loja Steam (apps) | `https://store.steampowered.com/app/{id}/…` | Bypass do erro de região (uso principal) |
| Loja Steam (busca) | Busca do cabeçalho + `https://store.steampowered.com/search/?term=…` | **Sugestões de busca para convidados** e **página /search de convidado** opcional em Region Bypass → Busca |

As páginas de apps funcionam quando a Steam mostra **“This item is currently unavailable in your region”** (este item não está disponível na sua região) — por exemplo, **Call of Duty: Modern Warfare 4** em regiões restritas. As **sugestões de busca para convidados** ficam ativadas por padrão para a barra de busca do cabeçalho. A nova requisição de convidado para a página `/search` completa fica **desativada por padrão** (mesma pilha de requisições anônimas de convidado: proxy / `cc` / cache) — ative em **Region Bypass → Busca**. IDs de apps bloqueados salvos podem ser destacados nos resultados de busca.

## Como funciona

```
Página de app da Steam carrega
       │
       ▼
#error_box / Oops corresponde a “unavailable in your region”?
       │
       ├── não ──► ocioso (o botão de configurações continua disponível)
       │
       └── sim ──► Montar URL de destino (?l= idioma, ?cc= opcional)
                │
                ▼
       Acerto no cache (dentro do TTL)? ── sim ──► usar HTML de convidado armazenado
                │ não
                ▼
       Opcional: reescrever a URL pelo gateway proxy
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       Analisar HTML → extrair .game_page_background / #tabletGrid
                │
                ├── ainda bloqueado? ──► mostrar erro + sugerir proxy
                │
                ├── transferir para o shell ativo
                │   ├── sincronizar title, classes, estilos, scripts
                │   ├── restaurar controles de fila da sessão conectada
                │   └── falha → fallback document.write(HTML de convidado)
                │
                └── banner + reinicialização dos recursos (HTML bem-sucedido salvo no cache)
```

### Busca de convidado

No painel Region Bypass (**aba Busca**):

1. **Sugestões de busca para convidados** (ativadas por padrão) — ao digitar na busca do cabeçalho da loja, são obtidas sugestões anônimas de `/search/results` (até 25 jogos), enriquecidas com dados de `/api/storesearch/` quando disponíveis (fallback: `/search/suggest`).
2. **Página `/search` de convidado** (desativada por padrão) — enviar uma busca ou abrir `/search/?term=…` pode buscar os resultados novamente como convidado e injetá-los na página quando esta configuração está ativada.
3. O **registro de jogos bloqueados** opcional destaca apps que você abriu anteriormente em uma página de erro de região.
4. **Detecção automática de bloqueios na busca** (ativada por padrão) testa cada resultado com seus cookies de sessão Steam e adiciona apps com bloqueio regional à lista (barra de progresso + indicadores de carregamento por item; escopo e concorrência configuráveis).

Usa as mesmas configurações de proxy, `cc`, idioma e cache do bypass de páginas de apps.

### Requisição anônima

A Steam frequentemente restringe a página da loja pelo **país da conta**. Uma requisição privilegiada sem cookies de sessão pode retornar o layout público da loja para aquele IP. O script nunca usa sua sessão conectada para a requisição de bypass.

### Idioma da loja

A requisição de convidado replica o idioma da sua loja Steam quando possível:

1. Cookie `Steam_Language` da página atual
2. Caso contrário, um idioma derivado do locale da interface/navegador
3. Aplicado como `?l=…`, `Cookie: Steam_Language=…` e `Accept-Language`

### Gateway proxy

Gerenciadores de userscripts **não conseguem** anexar um proxy SOCKS/HTTP do sistema ao `GM_xmlhttpRequest`. Quando o bloqueio é por IP, aponte o painel para um **gateway HTTP** local ou remoto que busque a URL da Steam a partir de outra rede.

| Modo | Requisição de exemplo |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

Este repositório inclui um gateway Node opcional: [`proxy-gateway.mjs`](proxy-gateway.mjs).

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

Depois, no painel do userscript: Host `127.0.0.1`, Porta `8765`, modo `host:port/https://…`, proxy **ATIVADO**.

## Estrutura do repositório

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # locale + bootDocument + handler region:rewrote
│   ├── core/                   # configurações, cache, apps bloqueados, bus, constantes, debug
│   ├── region/                 # detecção, requisição, transferência, fila, correções, bypass
│   ├── features/search/        # API/parse/render de sugestões, página /search, sondagem
│   ├── features/settings/      # painel, controles, confirmação, páginas
│   ├── i18n/                   # metadados de locale + dez arquivos de idioma
│   ├── ui/                     # notificações toast
│   ├── utils/                  # dom, html, pool, navegação, bloqueio de rolagem
│   └── styles/                 # tokens, base, panel, region, search, cache, toast
├── tests/                      # Testes unitários nativos do Node
├── scripts/                    # auxiliares de build / verificação de artefatos
├── steam-region-block-bypass.user.js   # Userscript instalável (artefato versionado)
├── steam-region-block-bypass.meta.js   # Metadados para verificação de atualizações
├── proxy-gateway.mjs           # Gateway HTTP local opcional (Node)
├── package.json                # Dependências, versão, scripts
├── README.md                   # Documentação e instruções de instalação
├── CHANGELOG.md                # Histórico de versões
├── DESIGN.md                   # Linguagem visual e regras de tokens CSS
├── LICENSE                     # Licença MIT
└── .gitattributes / .gitignore
```

| Arquivo | Finalidade |
|------|---------|
| `steam-region-block-bypass.user.js` | Script completo servido em `@downloadURL` / `@updateURL` |
| `steam-region-block-bypass.meta.js` | Espelho leve de metadados; gerenciadores podem buscá-lo em vez do script completo ao verificar atualizações |
| `proxy-gateway.mjs` | Retransmissor local opcional para bloqueios regionais por IP |

## Metadados do script

Campos-chave de `// ==UserScript==` usados pelos gerenciadores:

| Campo | Valor |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | Versão semântica (deve ser incrementada a cada lançamento) |
| `@updateURL` / `@downloadURL` | URL bruta do GitHub de `steam-region-block-bypass.user.js` |
| `@homepageURL` | Este repositório |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*` (gateways proxy personalizados) |

Tags `@name` e `@description` localizadas são fornecidas para en, ru, zh-CN, es, pt-BR, de, fr, ja, ko e pl.

## Permissões necessárias

| Permissão | Finalidade |
|-------|---------|
| `GM_xmlhttpRequest` | Buscar a página da loja sem cookies da página / limites de CORS |
| `GM_getValue` / `GM_setValue` | Persistir configurações de proxy e interface |
| `GM_addStyle` | Injetar o CSS do painel e do banner com estilo Steam |
| `GM_registerMenuCommand` | Abrir as configurações pelo menu do gerenciador de userscripts |

`@connect *` é necessário para que o script possa chamar um host de gateway proxy configurado pelo usuário.

## Desenvolvimento

Criado com **Vite** + **vite-plugin-monkey**. Edite os módulos ESM em [`src/`](src/) e execute `npm run build` para atualizar os artefatos de instalação versionados. Detalhes: [DEVELOPMENT.md](DEVELOPMENT.md), [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm install
npm run dev      # userscript "dev:" ao vivo via Vite
npm run build    # produção → dist/ + .user.js / .meta.js na raiz
npm test         # testes unitários nativos do Node
npm run ci       # testes + build + verificação de artefatos
npm run gateway  # gateway proxy local opcional
```

### Fluxo de trabalho local (Violentmonkey)

1. Clone este repositório e execute `npm run build`.
2. No Violentmonkey, instale a partir do `steam-region-block-bypass.user.js` local na raiz.
3. Ative **Acompanhar arquivo local** antes de fechar o diálogo de instalação.
4. Edite `src/`, recompile, recarregue a página da Steam — ou use `npm run dev` para HMR.

### Fluxo de trabalho local (Tampermonkey)

O Tampermonkey não acompanha arquivos locais nativamente. Opções:

- Use `npm run dev` e instale o userscript `dev:` servido, ou
- Reinstale a partir do arquivo compilado / URL após cada `npm run build`, ou
- Aponte temporariamente `@updateURL` / `@downloadURL` para `http://localhost:...` durante o desenvolvimento (não faça commit de URLs locais).

### Configuração

As configurações são armazenadas no armazenamento do userscript (`srbb_settings_v2`; o objeto plano `srbb_settings` v1 é migrado uma vez e mantido intacto para downgrade) pelo painel de configurações:

| Configuração | Padrão | Descrição |
|---------|---------|-------------|
| Idioma da interface | Automático | Idioma do painel / mensagens; `Automático` segue o navegador. O cookie de idioma da loja Steam ainda prevalece nas requisições de convidado |
| Ativar bypass de região | ativado | Controla a detecção de páginas, o modo automático/manual, o banner, o botão em outros sites e a restauração da fila. A busca de convidado tem suas próprias chaves |
| Gatilho do bypass | Automático | **Automático** executa em páginas com erro de região; **Mostrar botão** aguarda uma ação manual |
| Mostrar banner | ativado | Mostra o aviso de região acima de uma página contornada |
| País da loja (`cc`) | vazio | Código de país da Steam opcional para requisições de convidado |
| Mostrar notificações toast | ativado | Avisos flutuantes no estilo Steam ao alterar configurações; podem ser desativados |
| Posição do toast | Canto superior direito | Canto dos toasts: superior/inferior × esquerda/direita |
| Sugestões de busca para convidados | ativado | Aba **Busca**: sugestões anônimas no cabeçalho |
| Página `/search` de convidado | desativado | Aba **Busca**: substituir os resultados ativos por uma requisição anônima de convidado |
| Lembrar jogos bloqueados | ativado | Aba **Busca**: salvar IDs de apps quando a Steam mostra um erro de região |
| Destacar bloqueados na busca | ativado | Aba **Busca**: marcar jogos salvos nos resultados de convidado |
| Detecção automática de bloqueios na busca | ativado | Aba **Busca**: testar páginas de resultados com a sessão conectada; escopo e concorrência configuráveis |
| Duração do cache (minutos) | `60` | Aba **Cache**: reutilizar uma página de convidado bem-sucedida por esse tempo; `0` desativa o cache. **Recarregar** no banner sempre busca dados novos |
| Máximo de páginas em cache | `30` | Aba **Cache**: entradas de HTML de convidado mais recentes mantidas (orçamento flexível do medidor de 10 MB) |
| Cache de páginas de apps / busca | ativado / ativado | Aba **Cache**: quais tipos de HTML de convidado armazenar; desativar interrompe as gravações e remove esse tipo |
| Usar gateway proxy | desativado | Encaminhar a requisição anônima por um gateway |
| Modo do gateway | `gateway` | Como a URL de destino é anexada a `host:port` |
| Host / Porta | vazio | Endereço do gateway (ex.: `127.0.0.1` / `8765`) |
| Usuário / Senha | vazio | Autenticação HTTP Basic opcional para o gateway |

As configurações são gravadas em `srbb_settings_v2`. O cache de páginas mantém a chave existente `srbb_page_cache`, e o registro de bloqueados mantém `srbb_blocked_apps`.

## Aviso legal

Este projeto **não é afiliado** à Valve nem à Steam. Contornar restrições geográficas pode violar o [Contrato de Assinante da Steam](https://store.steampowered.com/subscriber_agreement/). Use por sua conta e risco. O script destina-se a **visualizar** informações da loja que a Steam já entrega a visitantes anônimos; ele não compra nem ativa produtos.

## Licença

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
