# Routage du portfolio

Le portfolio utilise React Router en mode déclaratif. Toutes les pages éditoriales partagent `PortfolioShell`, tandis que Tactical Board reste une application plein écran indépendante sur `/board`.

## Routes

| Route | Rôle | Shell du portfolio |
| --- | --- | --- |
| `/` | Accueil SEROLYN | Oui |
| `/projects` | Index des projets | Oui |
| `/projects/tactical-board` | Présentation de Tactical Board et accès à l’application | Oui |
| `/board` | Application Tactical Board complète | Non |
| `/music` | Espace musique | Oui |
| `/lab` | Expérimentations et apprentissages | Oui |
| `/about` | Présentation | Oui |
| `*` | Page introuvable | Oui |

Les liens internes doivent utiliser les composants de React Router afin que le base path soit appliqué automatiquement et que la navigation reste côté client.

## Basename Vite et GitHub Pages

Le routeur racine est un `BrowserRouter` dont le `basename` vient de `import.meta.env.BASE_URL` :

```tsx
const basename = normalizeBasename(import.meta.env.BASE_URL)

<BrowserRouter basename={basename}>
  <AppRoutes />
</BrowserRouter>
```

Vite est configuré avec le base path `/tactical-board/` en développement comme en production. L’application reste ainsi publiée sous ce chemin sur GitHub Pages sans répéter ce préfixe dans les routes. Par exemple, la route applicative `/projects/tactical-board` correspond à l’URL publique `/tactical-board/projects/tactical-board`.

Le `base` Vite doit rester cohérent avec le chemin de publication. Les assets produits doivent conserver des URL basées sur ce préfixe afin de fonctionner aussi lors d’un accès direct à une route profonde.

## Chargement différé de Tactical Board

`TacticalBoardApp` est importée avec `React.lazy()` et rendue dans un `Suspense` uniquement par la route `/board` :

```tsx
const TacticalBoardApp = lazy(() => import('./TacticalBoardApp'))
```

Cette frontière garde Zustand, IndexedDB, `html-to-image`, les reducers métier et les composants du plateau hors du graphe initial des pages du portfolio. Pour conserver cette séparation, les modules du shell et des pages éditoriales ne doivent pas importer directement le domaine, le store, les services ou les styles propres au tableau.

## Fallback SPA sur GitHub Pages

GitHub Pages ne connaît pas les routes du navigateur : un accès direct à `/tactical-board/board` ou `/tactical-board/projects/tactical-board` chercherait normalement un fichier à cette adresse. Après le build, `scripts/copy-spa-fallback.mjs` copie donc `dist/index.html` vers `dist/404.html`.

Quand GitHub Pages ne trouve pas une route profonde, il sert ce fallback. Le même bundle React démarre alors sur l’URL demandée et `BrowserRouter` résout la route après avoir retiré le basename. Les chemins d’assets continuent de fonctionner parce qu’ils sont générés avec le base path Vite.

Le script est écrit avec les API Node et résout les chemins depuis son propre emplacement ; il ne dépend ni du shell ni du répertoire courant. `dist/` reste un artefact de build et ne doit pas être committé.

Vérifications attendues après un build :

- `dist/index.html` et `dist/404.html` existent et sont identiques ;
- les URLs des scripts et feuilles de style commencent par le base path attendu ;
- `/tactical-board/projects/tactical-board` et `/tactical-board/board` démarrent correctement via le fallback ;
- Tactical Board apparaît dans un chunk différé distinct du bundle initial du portfolio.
