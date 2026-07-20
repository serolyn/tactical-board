# Architecture technique (repère rapide)

Ce document complète la documentation API générée automatiquement et sert de
plan de lecture du projet.

## Vue d’ensemble

Le dépôt contient deux applications React séparées, choisies uniquement par le
routeur racine :

- Portfolio éditorial sur `/`
- Tactical Board sur `/board`

Règle structurante : aucun import croisé direct entre `portfolio` et
`tactical-board`.

## Points d’entrée

- `src/main.tsx` : montage React
- `src/app/SiteRouter.tsx` : choix entre Portfolio et Tactical Board
- `src/app/SiteRouteEffects.tsx` : métadonnées de route

## Zone Portfolio (`src/portfolio`)

- `PortfolioShell.tsx` : shell global (header/main/footer)
- `pages/` : pages routées
- `components/` : composants éditoriaux
- `content/` : contenu publié et validation
- `motion/` : animations Motion
- `webgl/` : effets Three.js réservés au portfolio
- `styles/` : tokens, typo, layout

## Zone Tactical Board (`src/tactical-board`)

- `TacticalBoardApp.tsx` : racine applicative du board
- `model/` : logique métier pure
- `state/` : store applicatif
- `features/` : UI métier (battlefield, inspector, library, scenarios)
- `persistence/` : IndexedDB + autosauvegarde + migrations
- `import-export/` : imports/exports de documents et assets
- `ui/` : primitives visuelles réutilisables côté board

## Zone Shared (`src/shared`)

Contient uniquement les éléments réellement communs aux deux applications.

## Tests

Les tests sont dans `src/tests/` et valident notamment :

- l’isolation de routage portfolio/board
- la persistance
- le contenu publié
- les fallbacks WebGL

## Documentation API automatique (TypeDoc)

Une documentation type Doxygen est générée depuis TypeScript.

Commandes :

```bash
npm run docs:api
npm run docs:api:open
```

Sortie : `docs/api/index.html`

## Ordre de lecture recommandé

1. `src/app/SiteRouter.tsx`
2. `src/portfolio/PortfolioShell.tsx`
3. `src/tactical-board/TacticalBoardApp.tsx`
4. `src/tactical-board/model/`
5. `src/tactical-board/persistence/`
