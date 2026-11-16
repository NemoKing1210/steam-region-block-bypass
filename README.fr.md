# Steam Region Block Bypass

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · **Français** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Installer le userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

Un userscript pour la boutique Steam qui restaure les **pages de produit bloquées** et ajoute une **recherche invité** facultative — des suggestions de recherche anonymes dans l'en-tête, ainsi qu'une page `/search` invité activable séparément, sans cookies de compte.

Il recharge les URL des applications **sans cookies de compte** (vue invité), transpose la vraie mise en page de la boutique dans le document actif et restaure les contrôles liste de souhaits, suivre et ignorer pour les utilisateurs connectés après la transposition. Les **suggestions de recherche invité** sont activées par défaut ; le mode invité complet de la **page `/search`** est désactivé par défaut (à activer dans Region Bypass → Recherche). Pour les blocages basés sur l'IP, une **passerelle proxy** facultative peut être configurée depuis le panneau de réglages au style Steam (menu du compte → Réglages Region Bypass).

Compatible avec [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat et les autres gestionnaires prenant en charge le bloc de métadonnées `// ==UserScript==`.

## Captures d'écran

Le userscript réel exécuté sur une page de la boutique Steam en direct.

![Panneau de réglages Region Bypass avec les pages Général, Recherche, Cache, Proxy et À propos](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![Général — langue de l'interface, mode de contournement, pays de la boutique, notifications toast](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**Général** — langue de l'interface, contournement auto/manuel, bannière, pays de la boutique, notifications toast | ![Recherche — suggestions invité, page /search facultative, registre des jeux bloqués, sondage](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**Recherche** — suggestions invité, page `/search` facultative, registre des jeux bloqués, sondage |
| ![Cache — jauge d'utilisation, TTL, limite d'entrées, cache par source, liste des bloqués](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**Cache** — jauge d'utilisation, TTL, limite d'entrées, cache par source, liste des bloqués | ![Passerelle proxy — mode d'URL, hôte/port, authentification HTTP Basic facultative](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**Passerelle proxy** — mode d'URL, hôte/port, authentification HTTP Basic facultative |

Suggestions de recherche invité dans l'en-tête de la boutique — **Call of Duty: Modern Warfare 4** est signalé comme **bloqué par région**, tandis que les autres résultats restent disponibles :

![Suggestions de recherche invité pour Call of Duty: Modern Warfare 4 avec le badge Region blocked](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## Installation rapide

1. Installez un gestionnaire de userscripts (Tampermonkey ou Violentmonkey recommandés).
2. Cliquez sur le lien d'installation ci-dessous — votre gestionnaire devrait ouvrir une fenêtre d'installation.

**URL d'installation :**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![Installer](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### Installation depuis une URL (tableau de bord)

| Gestionnaire | Chemin |
|---------|------|
| Tampermonkey | Tableau de bord → **Utilitaires** → **Installer depuis une URL** |
| Violentmonkey | Tableau de bord → **+** → **Installer depuis une URL** |
| Greasemonkey | Menu de l'extension → **Nouveau script utilisateur** → collez l'URL brute |

Collez l'[URL d'installation](#installation-rapide) ci-dessus.

### Installation manuelle

1. Ouvrez [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js) dans ce dépôt.
2. Copiez l'intégralité du contenu du fichier.
3. Dans votre gestionnaire de userscripts, créez un nouveau script et collez le code.
4. Enregistrez et activez le script.

## Mises à jour

Le script inclut les métadonnées `@updateURL` et `@downloadURL` pointant vers le fichier brut GitHub. Les gestionnaires compatibles vérifient automatiquement les mises à jour (Tampermonkey : tableau de bord → intervalle de vérification ; Violentmonkey : similaire).

**Pour publier une nouvelle version :**

1. Incrémentez `version` dans `package.json` (SemVer).
2. Exécutez `npm run build` (met à jour les `.user.js` / `.meta.js` à la racine).
3. Ajoutez une entrée dans [`CHANGELOG.md`](CHANGELOG.md).
4. Poussez vers `main` (ou créez une GitHub Release).

Les gestionnaires comparent la `@version` installée aux métadonnées distantes pour décider s'il faut proposer une mise à jour. Consultez [DEVELOPMENT.md](DEVELOPMENT.md) pour le flux complet.

## Fonctionnalités

- **Injection par transposition prioritaire** — échange la mise en page du jeu invitée dans le `#responsive_page_template_content` actif, en préservant l'en-tête de la session connectée, les variables globales de session, les styles et scripts chargés ; `document.write` reste la solution de secours pour une réécriture complète
- **Restauration de la file pour les connectés** — reconstruit les contrôles liste de souhaits, suivre et ignorer après une transposition et envoie les actions via la session active
- **Contournement automatique ou bouton** — s'exécute immédiatement sur les pages bloquées ou affiche d'abord une proposition manuelle
- **Requête anonyme** — utilise `GM_xmlhttpRequest` avec `anonymous: true` (sans cookies de connexion)
- **Langue de la boutique** — la requête invitée utilise `Steam_Language`, `?l=` et `Accept-Language` pour que la page corresponde à la langue de votre interface Steam
- **Cookies de vérification de l'âge** — envoie les cookies `birthtime` / contenu adulte afin que les pages invité s'arrêtent moins souvent à la vérification de l'âge
- **Pays de la boutique facultatif (`cc`)** — remplace le pays de la boutique Steam pour la requête invitée
- **Panneau de passerelle proxy** — activation/désactivation, hôte, port, nom d'utilisateur, mot de passe, mode d'URL
- **Interrupteur principal de région + contrôle de la bannière** — désactive le contournement des pages sans affecter la recherche invité ; masque la bannière de région si souhaité
- **Interface au style Steam** — entrée des réglages dans le menu déroulant du compte (`#account_dropdown`, style SteamDB) ; bouton de secours pour les déconnectés dans `#global_actions` ; panneau en liste sur la page d'accueil avec les pages Général / Recherche / Cache / Proxy / À propos, édition de brouillon, Réinitialiser, Annuler, Enregistrer et Enregistrer et recharger
- **Interface localisée** — panneau et messages en en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl ; sélecteur de langue de l'interface avec détection automatique du navigateur
- **Contrôles manuels** — recharger le contenu injecté, ouvrir les réglages depuis la bannière ou le menu du gestionnaire de userscripts
- **Suggestions de recherche invité** — activées par défaut : liste de suggestions anonymes via la même pile de requêtes invité (proxy / `cc` / cache) ; à désactiver dans **Region Bypass → Recherche**
- **Page `/search` invité** — facultative : rechargement et injection anonymes pour `store.steampowered.com/search` (même pile) ; à activer séparément dans **Region Bypass → Recherche**
- **Onglet Cache** — jauge d'utilisation, TTL et nombre maximal d'entrées, choix des pages invité à stocker, parcours/suppression du HTML en cache, parcours/nettoyage de la liste des jeux bloqués
- **Registre des jeux bloqués** — mémorise les ID d'applications bloquées par région (interrupteurs de l'onglet Recherche) et les met en évidence dans la recherche invité ; liste et nettoyage dans **Cache**

## Pages prises en charge

| Site | Modèle d'URL | Remarques |
|------|-------------|-------|
| Boutique Steam (applications) | `https://store.steampowered.com/app/{id}/…` | Contournement de l'erreur de région (usage principal) |
| Boutique Steam (recherche) | Recherche de l'en-tête + `https://store.steampowered.com/search/?term=…` | **Suggestions de recherche invité** et **page /search invité** facultative dans Region Bypass → Recherche |

Les pages d'application fonctionnent lorsque Steam affiche **« This item is currently unavailable in your region »** (cet article n'est pas disponible dans votre région) — par exemple **Call of Duty: Modern Warfare 4** dans les régions restreintes. Les **suggestions de recherche invité** sont activées par défaut pour la barre de recherche de l'en-tête. Le rechargement invité de la page `/search` complète est **désactivé par défaut** (même pile de requêtes invité anonymes : proxy / `cc` / cache) — activez-le dans **Region Bypass → Recherche**. Les ID d'applications bloquées enregistrés peuvent être mis en évidence dans les résultats de recherche.

## Fonctionnement

```
La page d'application Steam se charge
       │
       ▼
#error_box / Oops correspond à « unavailable in your region » ?
       │
       ├── non ──► inactif (le bouton des réglages reste disponible)
       │
       └── oui ──► Construire l'URL cible (?l= langue, ?cc= facultatif)
                │
                ▼
       Cache trouvé (dans le TTL) ? ── oui ──► utiliser le HTML invité stocké
                │ non
                ▼
       Facultatif : réécrire l'URL via la passerelle proxy
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       Analyser le HTML → extraire .game_page_background / #tabletGrid
                │
                ├── toujours bloqué ? ──► afficher l'erreur + suggérer un proxy
                │
                ├── transposer dans l'enveloppe active
                │   ├── synchroniser title, classes, styles, scripts
                │   ├── restaurer les contrôles de file de la session connectée
                │   └── échec → solution de secours document.write(HTML invité)
                │
                └── bannière + redémarrage des fonctionnalités (HTML réussi enregistré en cache)
```

### Recherche invité

Dans le panneau Region Bypass (**onglet Recherche**) :

1. **Suggestions de recherche invité** (activées par défaut) — la saisie dans la recherche de l'en-tête de la boutique récupère des suggestions anonymes depuis `/search/results` (jusqu'à 25 jeux), enrichies avec les données `/api/storesearch/` lorsqu'elles sont disponibles (solution de secours : `/search/suggest`).
2. **Page `/search` invité** (désactivée par défaut) — envoyer une recherche ou ouvrir `/search/?term=…` peut recharger les résultats en tant qu'invité et les injecter dans la page lorsque ce réglage est activé.
3. Le **registre des jeux bloqués** facultatif met en évidence les applications que vous avez ouvertes auparavant sur une page d'erreur de région.
4. **Détection automatique des blocages dans la recherche** (activée par défaut) teste chaque résultat avec vos cookies de session Steam et ajoute les applications verrouillées par région à la liste (barre de progression + indicateurs de chargement par élément ; portée et concurrence configurables).

Utilise les mêmes réglages de proxy, `cc`, langue et cache que le contournement des pages d'application.

### Requête anonyme

Steam restreint souvent la page de la boutique selon le **pays du compte**. Une requête privilégiée sans cookies de session peut renvoyer la mise en page publique de la boutique pour cette IP. Le script n'utilise jamais votre session connectée pour la requête de contournement.

### Langue de la boutique

La requête invitée reproduit la langue de votre boutique Steam lorsque c'est possible :

1. Cookie `Steam_Language` de la page actuelle
2. Sinon, une langue déduite de la locale de l'interface/du navigateur
3. Appliquée via `?l=…`, `Cookie: Steam_Language=…` et `Accept-Language`

### Passerelle proxy

Les gestionnaires de userscripts **ne peuvent pas** attacher un proxy SOCKS/HTTP système à `GM_xmlhttpRequest`. Lorsque le verrouillage est basé sur l'IP, pointez le panneau vers une **passerelle HTTP** locale ou distante qui récupère l'URL Steam depuis un autre réseau.

| Mode | Exemple de requête |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

Ce dépôt inclut une passerelle Node facultative : [`proxy-gateway.mjs`](proxy-gateway.mjs).

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

Puis dans le panneau du userscript : Hôte `127.0.0.1`, Port `8765`, mode `host:port/https://…`, proxy **ACTIVÉ**.

## Structure du dépôt

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # locale + bootDocument + gestionnaire region:rewrote
│   ├── core/                   # réglages, cache, applis bloquées, bus, constantes, débogage
│   ├── region/                 # détection, requête, transposition, file, correctifs, contournement
│   ├── features/search/        # API/analyse/rendu des suggestions, page /search, sondage
│   ├── features/settings/      # panneau, contrôles, confirmation, pages
│   ├── i18n/                   # métadonnées de locale + dix fichiers de langue
│   ├── ui/                     # notifications toast
│   ├── utils/                  # dom, html, pool, navigation, verrouillage du défilement
│   └── styles/                 # tokens, base, panel, region, search, cache, toast
├── tests/                      # Tests unitaires intégrés à Node
├── scripts/                    # utilitaires de build / vérification des artefacts
├── steam-region-block-bypass.user.js   # Userscript installable (artefact versionné)
├── steam-region-block-bypass.meta.js   # Métadonnées pour la vérification des mises à jour
├── proxy-gateway.mjs           # Passerelle HTTP locale facultative (Node)
├── package.json                # Dépendances, version, scripts
├── README.md                   # Documentation et instructions d'installation
├── CHANGELOG.md                # Historique des versions
├── DESIGN.md                   # Langage visuel et règles des tokens CSS
├── LICENSE                     # Licence MIT
└── .gitattributes / .gitignore
```

| Fichier | Rôle |
|------|---------|
| `steam-region-block-bypass.user.js` | Script complet servi à `@downloadURL` / `@updateURL` |
| `steam-region-block-bypass.meta.js` | Miroir léger des métadonnées ; les gestionnaires peuvent le récupérer au lieu du script complet lors des vérifications de mise à jour |
| `proxy-gateway.mjs` | Relais local facultatif pour les verrouillages régionaux par IP |

## Métadonnées du script

Champs clés de `// ==UserScript==` utilisés par les gestionnaires :

| Champ | Valeur |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | Version sémantique (à incrémenter à chaque publication) |
| `@updateURL` / `@downloadURL` | URL GitHub brute de `steam-region-block-bypass.user.js` |
| `@homepageURL` | Ce dépôt |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*` (passerelles proxy personnalisées) |

Des balises `@name` et `@description` localisées sont fournies pour en, ru, zh-CN, es, pt-BR, de, fr, ja, ko et pl.

## Autorisations requises

| Autorisation | Rôle |
|-------|---------|
| `GM_xmlhttpRequest` | Récupérer la page de la boutique sans cookies de page / limites CORS |
| `GM_getValue` / `GM_setValue` | Conserver les réglages proxy et d'interface |
| `GM_addStyle` | Injecter le CSS du panneau et de la bannière au style Steam |
| `GM_registerMenuCommand` | Ouvrir les réglages depuis le menu du gestionnaire de userscripts |

`@connect *` est requis pour que le script puisse appeler un hôte de passerelle proxy configuré par l'utilisateur.

## Développement

Construit avec **Vite** + **vite-plugin-monkey**. Modifiez les modules ESM dans [`src/`](src/), puis exécutez `npm run build` pour actualiser les artefacts d'installation versionnés. Détails : [DEVELOPMENT.md](DEVELOPMENT.md), [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm install
npm run dev      # userscript "dev:" en direct via Vite
npm run build    # production → dist/ + .user.js / .meta.js à la racine
npm test         # tests unitaires intégrés à Node
npm run ci       # tests + build + vérification des artefacts
npm run gateway  # passerelle proxy locale facultative
```

### Flux local (Violentmonkey)

1. Clonez ce dépôt et exécutez `npm run build`.
2. Dans Violentmonkey, installez depuis le `steam-region-block-bypass.user.js` local à la racine.
3. Activez **Suivre le fichier local** avant de fermer la boîte d'installation.
4. Modifiez `src/`, rebuild, rechargez la page Steam — ou utilisez `npm run dev` pour le HMR.

### Flux local (Tampermonkey)

Tampermonkey ne suit pas les fichiers locaux nativement. Options :

- Utilisez `npm run dev` et installez le userscript `dev:` servi, ou
- Réinstallez depuis le fichier construit / l'URL après chaque `npm run build`, ou
- Pointez temporairement `@updateURL` / `@downloadURL` vers `http://localhost:...` pendant le développement (ne committez pas les URL locales).

### Configuration

Les réglages sont stockés dans le stockage du userscript (`srbb_settings_v2` ; l'objet plat `srbb_settings` v1 est migré une fois et laissé intact pour un retour arrière) via le panneau de réglages :

| Réglage | Par défaut | Description |
|---------|---------|-------------|
| Langue de l'interface | Automatique | Langue du panneau / des messages ; `Automatique` suit le navigateur. Le cookie de langue de la boutique Steam reste prioritaire pour les requêtes invité |
| Activer le contournement de région | activé | Contrôle la détection des pages, le mode auto/manuel, la bannière, le bouton sur d'autres sites et la restauration de la file. La recherche invité a ses propres interrupteurs |
| Déclencheur du contournement | Automatique | **Automatique** s'exécute sur les pages d'erreur de région ; **Afficher le bouton** attend une action manuelle |
| Afficher la bannière | activé | Affiche l'avis de région au-dessus d'une page contournée |
| Pays de la boutique (`cc`) | vide | Code pays Steam facultatif pour les requêtes invité |
| Afficher les notifications toast | activé | Avis flottants au style Steam lors des changements de réglages ; peuvent être désactivés |
| Position des toasts | En haut à droite | Coin des toasts : haut/bas × gauche/droite |
| Suggestions de recherche invité | activé | Onglet **Recherche** : suggestions anonymes dans l'en-tête |
| Page `/search` invité | désactivé | Onglet **Recherche** : remplacer les résultats actifs par une requête invitée anonyme |
| Mémoriser les jeux bloqués | activé | Onglet **Recherche** : enregistrer les ID d'application lorsque Steam affiche une erreur de région |
| Mettre en évidence les bloqués dans la recherche | activé | Onglet **Recherche** : marquer les jeux enregistrés dans les résultats invité |
| Détection automatique des blocages dans la recherche | activé | Onglet **Recherche** : sonder les pages de résultats avec la session connectée ; portée et concurrence configurables |
| Durée du cache (minutes) | `60` | Onglet **Cache** : réutiliser une page invitée réussie pendant cette durée ; `0` désactive le cache. **Recharger** dans la bannière récupère toujours des données fraîches |
| Nombre max. de pages en cache | `30` | Onglet **Cache** : entrées HTML invité les plus récentes conservées (budget souple de la jauge de 10 Mo) |
| Mettre en cache les pages d'application / de recherche | activé / activé | Onglet **Cache** : quels types de HTML invité stocker ; désactiver arrête les écritures et supprime ce type |
| Utiliser la passerelle proxy | désactivé | Router la requête anonyme via une passerelle |
| Mode de la passerelle | `gateway` | Comment l'URL cible est ajoutée à `host:port` |
| Hôte / Port | vide | Adresse de la passerelle (p. ex. `127.0.0.1` / `8765`) |
| Nom d'utilisateur / Mot de passe | vide | Authentification HTTP Basic facultative pour la passerelle |

Les réglages sont écrits dans `srbb_settings_v2`. Le cache de pages conserve la clé existante `srbb_page_cache` et le registre des bloqués conserve `srbb_blocked_apps`.

## Avertissement

Ce projet **n'est pas affilié** à Valve ni à Steam. Contourner les restrictions géographiques peut enfreindre le [Contrat d'abonné Steam](https://store.steampowered.com/subscriber_agreement/). Utilisez-le à vos propres risques. Le script est destiné à **consulter** des informations de la boutique que Steam fournit déjà aux visiteurs anonymes ; il n'achète ni n'active de produits.

## Licence

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
