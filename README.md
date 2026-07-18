# Tactical Board

Tactical Board est un éditeur de scénarios tactiques sur grille. Il reprend la lisibilité d’un plateau d’échecs sans appliquer aucune règle d’échecs : les unités sont placées et déplacées librement pour construire une carte opérationnelle.

**Version en ligne :** [https://serolyn.github.io/tactical-board/](https://serolyn.github.io/tactical-board/)

L’application fonctionne entièrement dans le navigateur. Elle n’utilise ni compte, ni serveur, ni backend ; scénarios et images sont enregistrés dans IndexedDB.

## Installation

Prérequis : Node.js 22 ou une version récente compatible avec Vite 8.

```bash
npm install
npm run dev
```

Vite affiche ensuite l’adresse locale, généralement `http://localhost:5173`.

## Commandes

```bash
npm run dev        # serveur de développement
npm run test       # tests Vitest
npm run test:watch # tests en mode interactif
npm run typecheck  # vérification TypeScript
npm run lint       # analyse Oxlint
npm run build      # build de production dans dist/
npm run preview    # aperçu du build
```

Chaque envoi sur la branche `main` publie automatiquement la version de production sur GitHub Pages.

## Utilisation

1. Choisissez une faction et un type dans la bibliothèque.
2. Touchez ou cliquez une case pour placer autant d’unités que nécessaire.
3. Revenez à l’outil **Sélection** pour déplacer une unité par glisser-déposer, ou sélectionnez-la puis choisissez sa destination. Un aperçu semi-transparent suit le pointeur pendant le glissement ; les collisions et sorties du plateau sont refusées.
4. Utilisez l’inspecteur compact pour modifier son nom, sa faction, son type, son icône et son statut. Une unité détruite reste visible sous une grande croix rouge.
5. Une opportunité **À rallier** peut rejoindre immédiatement **Mes forces** ; un **Obstacle** peut être neutralisé depuis ce même inspecteur.
6. Les outils **Flèche** et **Marqueur** ajoutent les annotations tactiques. La palette de flèches propose attaque/menace, soutien et route/déplacement. La gomme ne supprime que les annotations ; l’outil suppression vise les unités.

Pour agir sur plusieurs unités, maintenez `Shift` et cliquez chacune d’elles. L’**Inspecteur** affiche les actions groupées lorsque vous relâchez la touche. Il ne propose que les actions applicables à toute la sélection, notamment le ralliement, la neutralisation et les changements communs de faction ou de statut. Faites glisser l’une des unités sélectionnées pour déplacer toute la formation : les aperçus semi-transparents conservent ses écarts et le mouvement est refusé si une destination est occupée ou hors limites. Une modification groupée ne crée qu’une seule étape d’historique.

Le bouton **Plein écran** masque toute l’interface pour ne conserver que le plateau interactif. `Échap` ou le bouton discret en haut à droite restaure l’interface. Le mode se ferme aussi automatiquement lorsqu’un panneau d’actions ou un dialogue est nécessaire, par exemple après une multi-sélection.

Le menu **Plateau** règle les dimensions de 5 × 5 à 20 × 20, les coordonnées et le vidage complet. Une réduction qui retire du contenu demande confirmation et reste annulable.

Les factions et types personnalisés sont propres à chaque scénario. Les images PNG, JPEG, WebP et SVG sont validées, nettoyées puis optimisées avant leur stockage. Archiver un type personnalisé ne modifie pas les unités déjà placées.

## Scénarios et sauvegardes

- L’autosauvegarde locale intervient après chaque modification ; `Ctrl/Cmd+S` force l’écriture immédiate.
- Un journal de reprise synchrone protège aussi la courte fenêtre précédant l’écriture IndexedDB, notamment lors d’un rechargement immédiat.
- Chaque scénario peut porter un objectif court, une période facultative, un statut actif/archivé et un lien vers le scénario précédent.
- Le menu du scénario permet de créer, renommer, modifier l’objectif et la période, dupliquer, archiver, supprimer, importer et exporter. **Créer le suivant** propose soit un plateau vide, soit la reprise des seules unités de **Mes forces**.
- Le scénario fourni **L’objectif** organise la campagne de l’été 2026 sur 20 × 20. Ces données restent un contenu initial : tous les mécanismes de l’application sont génériques.
- L’export JSON est autonome et inclut les images référencées. Un import valide crée toujours un nouveau scénario et ne remplace aucune donnée existante.
- **Exporter tous les scénarios** produit une sauvegarde versionnée de la bibliothèque et déduplique les images partagées.
- L’export PNG capture le plateau entier avec unités, noms, statuts et annotations, indépendamment du zoom affiché.

Les données restent attachées au profil du navigateur et à l’origine du site. Pour transférer ou sauvegarder durablement un scénario, utilisez régulièrement l’export JSON.

## Raccourcis

| Raccourci | Action |
| --- | --- |
| `Suppr` | Supprimer la sélection |
| `Échap` | Fermer le panneau actif, annuler l’outil puis désélectionner |
| `Ctrl/Cmd+Z` | Annuler |
| `Ctrl/Cmd+Maj+Z` | Rétablir |
| `Ctrl/Cmd+S` | Sauvegarder immédiatement |
| `Shift` + clics | Constituer une sélection multiple, puis ouvrir ses actions au relâchement |

Les raccourcis de suppression et d’historique global sont neutralisés pendant la saisie dans un champ.

## Architecture

- `src/domain` : contrats TypeScript, catalogue, invariants, reducer pur et historique.
- `src/store` : état applicatif Zustand et état d’interaction.
- `src/features` : plateau, bibliothèque, scénarios et inspecteur.
- `src/components` : composants d’interface réutilisables et accessibles.
- `src/data` : contenu initial de la campagne et continuité entre scénarios, séparés du fonctionnement générique.
- `src/services` : IndexedDB, autosauvegarde, images, import/export JSON et PNG.

Le document et le format d’échange courants utilisent `formatVersion: 2`. Un scénario exporté est identifié par `kind: "tactical-board-scenario"` ; une sauvegarde globale par `kind: "tactical-board-scenario-collection"`. Les documents V1 sont migrés sans perte à leur lecture et les imports sont validés intégralement avant toute écriture.
