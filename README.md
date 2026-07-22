# SEROLYN — Portfolio et Tactical Board

Ce dépôt contient deux applications React publiées ensemble sans backend :

- le portfolio éditorial SEROLYN sur `/` ;
- Tactical Board, un éditeur de scénarios tactiques, sur `/board`.

Le portfolio présente des projets, des scènes sonores, des expérimentations et le monde SRO. Tactical Board conserve ses scénarios et ses images dans IndexedDB, uniquement sur la route `/board`.

**Site :** https://serolyn.github.io/tactical-board/

## Installation

Le projet demande Node.js 22.22.0 ou une version compatible plus récente.

```bash
npm install
npm run dev
```

Vite indique ensuite l’adresse locale, généralement `http://localhost:5173/tactical-board/`.

## Commandes principales

```bash
npm run dev        # lancer le serveur de développement
npm run test       # exécuter les tests Vitest
npm run test:watch # relancer les tests pendant le développement
npm run typecheck  # vérifier les types TypeScript
npm run lint       # analyser le code avec Oxlint
npm run build      # produire le site dans dist/
npm run preview    # prévisualiser le build de production
```

Un envoi sur `main` déclenche le déploiement GitHub Pages. Le build utilise le base path `/tactical-board/` et crée aussi le fallback `404.html` nécessaire aux liens directs.

## Routes

| Route | Contenu |
| --- | --- |
| `/` | Accueil du portfolio |
| `/projects` et `/projects/:slug` | Projets et détails publiés |
| `/music` et `/music/:slug` | Scènes sonores et détails publiés |
| `/music/sro-world` | Expérience 3D SRO en plein écran |
| `/lab` et `/lab/:slug` | Expérimentations et détails publiés |
| `/about` | Présentation |
| `/board` | Application Tactical Board indépendante |
| `/art-direction/` | Planche visuelle statique |

`/projects/tactical-board` reste une redirection historique vers `/lab/tactical-board`. Une route inconnue affiche la page introuvable du portfolio.

## Arborescence utile

```text
src/
├── main.tsx
├── app/
│   └── SiteRouter.tsx
├── portfolio/
│   ├── components/
│   ├── content/
│   ├── experiences/
│   ├── motion/
│   ├── pages/
│   ├── styles/
│   └── webgl/
├── tactical-board/
│   ├── features/
│   ├── hooks/
│   ├── import-export/
│   ├── model/
│   ├── persistence/
│   ├── state/
│   ├── styles/
│   └── ui/
├── shared/
└── tests/
```

Le portfolio et Tactical Board ne s’importent jamais mutuellement. Le routeur racine choisit l’application à afficher. `shared` reste réservé aux ressources réellement utilisées par les deux côtés.

## Modifier le contenu

Le contenu éditorial se trouve dans `src/portfolio/content/`. Les templates visuels, notamment les projets modèles comme Nemyl, font partie du site et doivent rester disponibles tant qu’ils sont publiés.

- `docs/CONTENT.md` explique comment ajouter et publier une entrée ;
- `docs/DESIGN.md` centralise la direction artistique, les assets et les licences.

Le plateau est rendu en DOM/CSS, avec ses annotations en SVG. Three.js et Motion restent réservés au portfolio et aux expériences immersives.
