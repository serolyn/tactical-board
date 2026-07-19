# Phase 3C — Ghost Signal WebGL et système Motion

## Périmètre

Cette phase ajoute du mouvement uniquement au portfolio SEROLYN. Tactical
Board reste une application sœur, différée sur `/board`, sans import Three.js
ou Motion dans son code métier et sans changement de comportement.

Versions installées :

- `three` 0.185.1 ;
- `@react-three/fiber` 9.6.1 ;
- `@react-three/drei` 10.7.7 ;
- `motion` 12.42.2 via `motion/react` ;
- `@types/three` 0.185.1 en dépendance de développement.

Node reste épinglé à 22.22.0 minimum dans `.nvmrc`, `package.json` et le
workflow GitHub Pages.

## Architecture WebGL

`HeroVisualSlot` conserve l’image `signal-horizon.webp` dans le DOM dès le
premier rendu. Après vérification de WebGL2, du mouvement réduit et du mode
économie de données, il importe dynamiquement `GhostSignalCanvas`. Le Canvas
reste transparent et passe à l’opacité 1 seulement après une frame rendue sans
erreur GL. Une erreur React, un shader invalide ou un échec durable rend
simplement le ciel statique, sans message visible.

La scène sous `src/portfolio/three/` contient :

- une `PlaneGeometry` partagée entre deux ou trois membranes ;
- un `ShaderMaterial` original et deux shaders GLSL bruts ;
- une déformation lente superposant trois fréquences ;
- des couches bleu-violet translucides avec occultation par profondeur ;
- trois segments atmosphériques en qualité High ;
- une braise rouge douce sur un cycle commun de 16,2 secondes ;
- un groupe dont la rotation reste sous 0,08 rad et la translation sous 0,15
  unité, amorties avec `MathUtils.damp`.

Le repère rouge DOM reçoit le même état discret que l’uniform de braise ; React
n’est mis à jour qu’aux deux changements d’état du pulse, jamais à chaque
frame. Tous les éléments WebGL sont décoratifs et ont `pointer-events: none`.

### Profils adaptatifs

| Profil | DPR | Géométrie | Couches | Décor | Draw calls | Triangles |
| --- | --- | --- | ---: | --- | ---: | ---: |
| High | 1 à 1,5 | 56 × 80 | 3 | 3 lignes groupées | 4 | 26 880 |
| Low | 1 | 32 × 48 | 2 | aucun | 2 | 6 144 |

Ces valeurs ont été vérifiées par instrumentation du contexte WebGL2. Un
`PerformanceMonitor` dégrade High vers Low, puis Low vers le fallback statique.
Le profil initial est Low sous 720 px ou sur un appareil déclarant au plus
4 cœurs ou 4 Gio de mémoire.

### Activité et récupération

La boucle R3F utilise `frameloop="always"` seulement lorsque le hero et l’onglet
sont visibles. Elle passe à `never` hors viewport, onglet caché ou route
démontée. Observers, écouteurs, RAF, timers, matériaux et géométries disposent
tous d’un nettoyage explicite.

Une perte `webglcontextlost` est autorisée à se restaurer pendant trois
secondes. Le Canvas est masqué immédiatement, puis revient après sa nouvelle
première frame ; au-delà du délai, le fallback devient durable. La recette
Chromium force une perte puis une restauration et confirme ce chemin.

## Architecture Motion

Le provider `PortfolioMotionProvider` vit uniquement dans `PortfolioShell`. Il
combine `MotionConfig reducedMotion="user"` et `LazyMotion`; les fonctions DOM
sont elles-mêmes chargées dans le chunk dynamique `motionFeatures`.

Les tokens partagés fixent les durées à 180 ms (rapide), 320 ms (interface),
480 ms (page), 640 ms (révélation) et 140 ms (mouvement réduit). Les variantes
reduced-motion sont explicitement des fondus courts : aucun déplacement, flou,
parallaxe ou stagger long n’est conservé.

`AnimatedRoutes` maintient la page sortante avec `AnimatePresence mode="wait"`,
puis limite le scroll, le focus et l’annonce `aria-live` au cadre entrant. Les
routes différées, l’historique précédent/suivant et les liens React Router
restent immédiats. `/board` est un frère du shell et n’est jamais enveloppé par
ce cadre.

`Reveal` et `StaggerGroup` observent le conteneur de scroll une seule fois. Le
contenu est visible sans `IntersectionObserver`, si sa construction échoue ou
s’il ne répond jamais à son observation initiale. Les cartes, CTA, navigation,
croix du Lab et reflets de Musique emploient des déplacements limités et
reproductibles au clavier.

## Isolation et bundles

Graphe produit par le build :

```text
index
├─ statique → react
├─ dynamique → motionFeatures
├─ dynamique → GhostSignalCanvas
└─ dynamique → TacticalBoardApp
```

Mesures en octets avec `gzip -9 -n` :

| Artefact | Phase 3B | Phase 3C | Écart Phase 3C |
| --- | ---: | ---: | ---: |
| Entrée portfolio | 251 655 / 78 157 gzip | 305 470 / 96 541 gzip | +53 815 / +18 384 |
| React partagé | 8 408 / 3 216 | 8 348 / 3 240 | −60 / +24 |
| Initial complet | 260 063 / 81 373 | 313 818 / 99 781 | +53 755 / +18 408 |
| Motion différé | — | 37 156 / 13 882 | nouveau |
| Ghost WebGL différé | — | 890 387 / 233 881 | nouveau |
| Tactical Board | 283 638 / 85 563 | 283 371 / 85 478 | −267 / −85 |
| CSS portfolio | 27 845 / 5 901 | 29 568 / 6 282 | +1 723 / +381 |
| CSS Board | 45 526 / 9 802 | 45 526 / 9 802 | identique |

La matrice réseau Chromium, avec cache désactivé et un contexte neuf par route,
confirme que `/projects`, `/music`, `/lab` et `/about` chargent le chunk de
fonctions Motion, mais jamais Ghost/Three. En plus de l’entrée commune,
`/board` ne demande que son chunk applicatif et le petit chunk partagé
`vanilla` : ni `motionFeatures`, ni Ghost, ni Three. Le runtime minimal Motion
reste présent dans l’entrée commune parce que le routeur importe le portfolio
statiquement, mais son provider n’est pas monté sur `/board` et aucun fichier
tactique ne l’importe. IndexedDB n’est ouvert que sur `/board`.

Le chunk Ghost dépasse le seuil d’avertissement Vite de 500 kB brut. Ce coût
provient de Three/R3F, reste entièrement différé et ne touche pas le parcours
statique ou Tactical Board ; c’est le principal compromis à surveiller.

## Recette reproductible

```bash
npm run build
npm run capture:portfolio
```

La seconde commande pilote Chromium 150 via CDP, sans Playwright, et FFmpeg
6.1.1. Elle produit trois captures, deux WebM et
`docs/portfolio-previews/phase3c/browser-audit.json`. La recette vérifie :

- desktop High et mobile Low à l’état `ready` ;
- fallback sans Canvas ni chunk Ghost en reduced-motion ;
- pause hors viewport ;
- perte et restauration réelles du contexte ;
- aucune erreur console ;
- navigation animée de l’accueil vers le Lab.

Chromium affiche un avertissement amont non bloquant : Three 0.185.1 marque
`THREE.Clock` comme déprécié alors que R3F 9.6.1 l’instancie encore. Aucun
warning de shader, erreur GL ou exception applicative n’est relevé.

## Validation finale

- test Node de copie postbuild : 1/1 ;
- Vitest : 42 fichiers et 234 tests réussis ;
- TypeScript et Oxlint : réussis sans diagnostic ; build Vite réussi avec le
  seul avertissement de taille Ghost documenté ci-dessus ;
- `npm audit` : aucune vulnérabilité ;
- focus clavier : une révélation encore masquée devient immédiatement visible
  avant son interaction ;
- reflow à 200 %, vue tactile 390 × 844 et reduced-motion : contrôlés ;
- perte/restauration du contexte, pause hors viewport et absence d’erreur
  console : confirmées par la recette Chromium finale.

Les preuves sont indexées dans
[`portfolio-previews/README.md`](./portfolio-previews/README.md). Le registre de
licences est dans [`ASSET_MANIFEST.md`](./ASSET_MANIFEST.md) : la scène est
entièrement procédurale et n’ajoute aucun asset externe.
