# SEROLYN — Portfolio et Tactical Board

Ce dépôt contient deux applications React sœurs, publiées ensemble sans
backend :

- le portfolio éditorial SEROLYN sur `/` ;
- Tactical Board, un éditeur de scénarios tactiques, sur `/board`.

Le portfolio présente des projets, des scènes sonores et des expérimentations.
Tactical Board conserve ses scénarios et ses images dans IndexedDB, uniquement
sur la route `/board`.

**Site :** [https://serolyn.github.io/tactical-board/](https://serolyn.github.io/tactical-board/)

## Installation

Le projet demande Node.js 22.22.0 ou une version compatible plus récente.

```bash
npm install
npm run dev
```

Vite indique ensuite l’adresse locale, généralement
`http://localhost:5173/tactical-board/`.

## Commandes principales

```bash
npm run dev        # lancer le serveur de développement
npm run test       # exécuter les tests Vitest
npm run test:watch # relancer les tests pendant le développement
npm run typecheck  # vérifier les types TypeScript
npm run lint       # analyser le code avec Oxlint
npm run build      # produire le site dans dist/
npm run preview    # prévisualiser le build de production
npm run docs:api   # générer la documentation technique TypeDoc
```

Un envoi sur `main` déclenche le déploiement GitHub Pages. Le build utilise le
base path `/tactical-board/` et crée aussi le fallback `404.html` nécessaire aux
liens directs.

## Routes

| Route | Contenu |
| --- | --- |
| `/` | Accueil du portfolio |
| `/projects` et `/projects/:slug` | Projets et détails publiés |
| `/music` et `/music/:slug` | Scènes sonores et détails publiés |
| `/lab` et `/lab/:slug` | Expérimentations et détails publiés |
| `/about` | Présentation |
| `/board` | Application Tactical Board indépendante |
| `/art-direction/` | Planche visuelle statique |

`/projects/tactical-board` reste une redirection historique vers
`/lab/tactical-board`. Une route inconnue affiche la page introuvable du
portfolio.

## Arborescence simplifiée

```text
src/
├── main.tsx
├── app/
│   └── SiteRouter.tsx
├── portfolio/
│   ├── assets, components, content, motion, pages, styles
│   ├── webgl/
│   └── PortfolioShell.tsx
├── tactical-board/
│   ├── assets, features, hooks, import-export
│   ├── model, persistence, state, styles, ui
│   └── TacticalBoardApp.tsx
├── shared/
│   └── assets/
└── tests/
docs/
├── CONTENT.md
└── DESIGN.md
public/
└── art-direction/
```

Le portfolio et Tactical Board ne s’importent jamais mutuellement. Le routeur
racine est le seul module qui choisit entre les deux applications. `shared`
reste réservé aux ressources réellement utilisées par les deux côtés.

## Ordre de lecture conseillé

1. `src/main.tsx` monte React.
2. `src/app/SiteRouter.tsx` choisit le portfolio ou `/board`.
3. `src/portfolio/PortfolioShell.tsx` structure les pages éditoriales.
4. `src/tactical-board/TacticalBoardApp.tsx` orchestre le plateau.
5. `src/tactical-board/model/` contient les règles métier pures et l’historique.
6. `src/tactical-board/features/` regroupe plateau, bibliothèque, inspecteur et scénarios.
7. `src/tactical-board/persistence/` gère IndexedDB, l’autosauvegarde et la récupération.

Les imports internes utilisent l’alias unique `@/`, qui désigne `src/`. Par
exemple, `@/portfolio/pages/HomePage` pointe vers
`src/portfolio/pages/HomePage.tsx` ; aucun autre système d’alias n’est prévu.

## Modifier le projet

- Le contenu du portfolio se trouve dans `src/portfolio/content/`. Le guide
  [docs/CONTENT.md](./docs/CONTENT.md) explique comment ajouter et publier une entrée.
- Les styles, principes visuels, assets et licences sont centralisés dans
  [docs/DESIGN.md](./docs/DESIGN.md).
- Le plateau est rendu en DOM/CSS, avec ses annotations en SVG. Three.js et
  Motion restent strictement réservés au portfolio.

Le document Tactical Board courant utilise `formatVersion: 2`. Les migrations,
les clés de persistance, l’import atomique et la séparation des blobs sont des
contrats à préserver lors de toute évolution.

## Documentation technique (style Doxygen)

Le projet fournit une documentation API générée automatiquement avec TypeDoc.

```bash
npm run docs:api
```

La sortie est créée dans `docs/api/` (point d’entrée : `docs/api/index.html`).

Pour t’orienter plus vite dans l’architecture applicative, consulte aussi
`docs/ARCHITECTURE.md`.

Pour un repérage détaillé fichier par fichier (style Doxygen), consulte
`docs/FILE_MAP.md`.
