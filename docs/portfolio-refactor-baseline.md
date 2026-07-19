# Baseline de refactorisation pour l’intégration portfolio

Date de référence : 19 juillet 2026
Commit de départ : `ce12231` (`Redesign the Objective campaign`)

Cette phase est une refactorisation structurelle à comportement strictement identique. Elle ne doit modifier ni le modèle métier, ni les formats persistés et échangés, ni l’apparence ou les interactions du plateau.

## Stack constatée

- React 19.2.7 et React DOM 19.2.7 ;
- TypeScript 6.0.2 ;
- Vite 8.1.5 avec `@vitejs/plugin-react` ;
- Zustand 5.0.14 pour l’état applicatif ;
- Immer 11.1.15 dans le reducer métier ;
- IndexedDB via `idb` 8.0.3 ;
- Zod 4.4.3 pour les formats d’import et de récupération ;
- DOMPurify 3.4.12 pour les SVG importés ;
- `html-to-image` 1.11.13 pour l’export PNG ;
- Lucide React 1.25.0 pour le catalogue d’icônes ;
- CSS Modules pour les styles ;
- Vitest 4.1.10, Testing Library, jsdom et `fake-indexeddb` pour les tests ;
- Oxlint 1.71.0 pour l’analyse statique.

Le projet n’utilise ni backend, ni routeur, ni framework UI, ni bibliothèque de drag-and-drop, ni Canvas/WebGL.

## Scripts de validation

| Commande | Rôle |
| --- | --- |
| `npm run test` | Suite Vitest complète |
| `npm run typecheck` | Vérification TypeScript avec `tsc -b --pretty false` |
| `npm run lint` | Analyse Oxlint |
| `npm run build` | TypeScript puis build de production Vite |

## Résultats initiaux

- Tests : **20 fichiers réussis, 124 tests réussis**.
- TypeScript : réussi, sans diagnostic.
- Oxlint : réussi, sans avertissement.
- Build Vite : réussi, 1 929 modules transformés en environ 1,48 s.
- HTML : 0,67 kB, 0,40 kB gzip.
- CSS principal : 45,51 kB, 9,91 kB gzip.
- JavaScript principal : **472,47 kB, 146,22 kB gzip**.
- Assets existants : texture WebP 382,04 kB, icône de base 280,84 kB, icône d’obstacle 193,33 kB.
- `src/App.tsx` : **1 481 lignes**.
- `src/features/board/Board.tsx` : **962 lignes**.

Aucun avertissement n’a été émis par les commandes locales de validation initiales.

## Invariants de persistance et d’échange

- La base IndexedDB s’appelle `tactical-board`, version 1.
- Ses stores restent `scenarios`, `assets` et `settings`.
- Le format documentaire courant reste `ScenarioDocumentV2`, `formatVersion: 2`.
- Les anciens documents V1 restent migrés à la lecture par le repository.
- Le journal localStorage conserve sa clé `tactical-board:scenario-recovery:v1` et son comportement de reprise.
- L’autosauvegarde reste sérialisée, avec un délai par défaut de 350 ms.
- Les blobs d’images restent séparés des documents et les assets orphelins restent nettoyés au démarrage.
- L’export unitaire reste `kind: "tactical-board-scenario"`, format 2.
- L’export de bibliothèque reste `kind: "tactical-board-scenario-collection"`, format 2.
- L’import reste intégralement validé avant l’écriture et remappe les identifiants.
- La migration de contenu V3 de « L’objectif », son ID suivi et sa transaction scénario/réglages restent inchangés.
- Le clone hors écran, les attributs `data-png-*`, la taille de cellule et le ratio utilisés par `html-to-image` restent inchangés.

## Responsabilités initialement concentrées dans App.tsx

- chargement IndexedDB, réconciliation du journal de récupération et hydratation du store ;
- migration et amorçage du scénario prédéfini ;
- création et révocation des URL d’assets ;
- contrôleur d’autosauvegarde, flush de page et gestion des erreurs ;
- raccourcis clavier globaux et session de multisélection avec Shift ;
- mode plateau seul et intégration de l’API Fullscreen ;
- création, duplication, changement, archivage et suppression de scénarios ;
- import/export JSON, export global et export PNG ;
- gestion des factions, types personnalisés, unités, annotations et réglages du plateau ;
- calcul des sélections individuelles et groupées ;
- zoom, ajustement et recentrage ;
- orchestration de tous les panneaux, modales, notifications et du shell responsive.

## Responsabilités initialement concentrées dans Board.tsx

- géométrie de grille, conversion pointeur/case et hit-testing des annotations ;
- rendu des unités, badges, statuts et croix de destruction ;
- rendu de la grille DOM, des coordonnées et des couches SVG ;
- sélection simple et multiple ;
- placement et routage des outils ;
- machine Pointer Events pour le drag simple et groupé ;
- prévisualisation fantôme, calcul des deltas et validation des destinations ;
- détection des objectifs atteignables ;
- dessin des flèches par glissement ou en deux touches ;
- navigation de grille au clavier ;
- marqueurs, effacement géométrique et contrats nécessaires à l’export PNG.

## Risques principaux

1. Modifier l’ordre DOM `grille → SVG → unités → fantômes` changerait le rendu et l’export.
2. Déplacer le `ref` ou les attributs `data-board-export` / `data-png-*` casserait la capture PNG.
3. Une extraction des Pointer Events peut introduire des doubles clics, perdre la capture ou modifier le seuil de drag.
4. Les callbacks de `App` ferment sur de nombreux états ; des dépendances de hooks incorrectes peuvent produire des données obsolètes.
5. Le bootstrap et l’autosauvegarde ont des garanties d’ordre et d’atomicité à préserver.
6. Les opérations groupées doivent rester une commande métier et une étape d’historique uniques.
7. Les styles reposent sur la hiérarchie `.viewport[data-tool] .unit` et sur plusieurs classes utilisées par les tests.
8. Une extraction trop large déplacerait seulement la complexité dans un hook monolithique au lieu de la réduire.

La stratégie retenue est donc incrémentale : extraire d’abord les fonctions pures et les contrôleurs déjà isolables, valider les tests ciblés et TypeScript, puis extraire les couches de rendu sans changer leurs contrats DOM.
