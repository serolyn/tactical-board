# Carte des fichiers (style Doxygen)

Ce document sert de repère opérationnel : chaque fichier source est listé avec
sa responsabilité principale.

## Utilisation

- Commencer par les points d’entrée.
- Suivre ensuite le dossier correspondant au besoin : `portfolio` ou
  `tactical-board`.
- Croiser avec la documentation API générée dans `docs/api/`.

## Points d’entrée

- `src/main.tsx` : monte React et attache le routeur racine.
- `src/app/SiteRouter.tsx` : déclare toutes les routes et choisit portfolio ou board.
- `src/app/SiteRouteEffects.tsx` : applique titre/description HTML selon la route.
- `src/app/siteRouteMetadata.ts` : table centrale des métadonnées de routes.
- `src/app/normalizeSiteBasename.ts` : normalise le basename Vite/GitHub Pages.
- `src/app/effects/ScreenGlitch.tsx` : couche visuelle glitch globale.
- `src/app/effects/screen-glitch.css` : styles de l’effet glitch.
- `src/assets.d.ts` : déclarations TypeScript pour imports d’assets.

## Portfolio

### Shell, pages, composants

- `src/portfolio/PortfolioShell.tsx` : shell global portfolio (header/main/footer).
- `src/portfolio/pages/HomePage.tsx` : page d’accueil éditoriale.
- `src/portfolio/pages/ProjectsPage.tsx` : index des projets publiés.
- `src/portfolio/pages/ProjectDetailPage.tsx` : détail d’un projet par slug.
- `src/portfolio/pages/MusicPage.tsx` : index des scènes sonores publiées.
- `src/portfolio/pages/MusicDetailPage.tsx` : détail d’une scène sonore.
- `src/portfolio/pages/LabPage.tsx` : index des entrées lab publiées.
- `src/portfolio/pages/LabDetailPage.tsx` : détail d’une entrée lab.
- `src/portfolio/pages/AboutPage.tsx` : page de présentation.
- `src/portfolio/pages/NotFoundPage.tsx` : fallback des routes portfolio inconnues.
- `src/portfolio/components/EditorialHeader.tsx` : en-tête et navigation principale portfolio.
- `src/portfolio/components/EmptyState.tsx` : composant d’état vide (index sans contenu).
- `src/portfolio/components/EntryCard.tsx` : carte de résumé d’entrée (index).
- `src/portfolio/components/EntryHero.tsx` : bandeau hero des pages détail.
- `src/portfolio/components/EntryIndex.tsx` : grille/liste d’entrées publiées.
- `src/portfolio/components/EntryLinks.tsx` : rendu des liens d’une entrée.
- `src/portfolio/components/EntryMetadata.tsx` : bloc de métadonnées d’entrée.
- `src/portfolio/components/EntrySections.tsx` : rendu des sections éditoriales.
- `src/portfolio/components/HeroVisualSlot.tsx` : support visuel du hero (image/WebGL).
- `src/portfolio/components/SectionHeading.tsx` : titre normalisé des sections.

### Contenu publié

- `src/portfolio/content/index.ts` : agrégation/exports du contenu portfolio.
- `src/portfolio/content/site.ts` : textes globaux du site (home/about/navigation).
- `src/portfolio/content/projects.ts` : base de données des projets.
- `src/portfolio/content/music.ts` : base de données des scènes sonores.
- `src/portfolio/content/lab.ts` : base de données des entrées lab.
- `src/portfolio/content/types.ts` : types TypeScript du modèle de contenu.
- `src/portfolio/content/validation.ts` : validation runtime du contenu publié.

### Motion

- `src/portfolio/motion/PortfolioMotionProvider.tsx` : provider d’animations portfolio.
- `src/portfolio/motion/domAnimationFeatures.ts` : features Motion chargées côté DOM.
- `src/portfolio/motion/motionTokens.ts` : variantes/tokens d’animation partagés.
- `src/portfolio/motion/AnimatedLink.tsx` : lien animé réutilisable.
- `src/portfolio/motion/AnimatedRoutes.tsx` : transitions entre routes portfolio.
- `src/portfolio/motion/PageTransition.tsx` : conteneur de transition de page.
- `src/portfolio/motion/Reveal.tsx` : révélation progressive d’éléments.
- `src/portfolio/motion/StaggerGroup.tsx` : orchestration d’animations en cascade.
- `src/portfolio/motion/useViewportReveal.ts` : hook de reveal basé viewport.

### WebGL (portfolio uniquement)

- `src/portfolio/webgl/GhostSignalCanvas.tsx` : canvas WebGL du signal fantôme.
- `src/portfolio/webgl/GhostSignalScene.tsx` : scène 3D du hero portfolio.
- `src/portfolio/webgl/GhostSignalMaterial.ts` : matériau/shader du signal.
- `src/portfolio/webgl/GhostMembrane.tsx` : géométrie/couche visuelle complémentaire.
- `src/portfolio/webgl/ghostSignalCapabilities.ts` : détection des capacités WebGL.
- `src/portfolio/webgl/ghostSignalQualityProfile.ts` : profils qualité/performance.
- `src/portfolio/webgl/ghostSignalCycle.ts` : cycle temporel du signal.
- `src/portfolio/webgl/useHeroActivity.ts` : hook d’activité utilisateur sur le hero.
- `src/portfolio/webgl/webglContextLifecycle.ts` : gestion de vie du contexte WebGL.
- `src/portfolio/webgl/HeroWebGLErrorBoundary.tsx` : isolation des erreurs WebGL.
- `src/portfolio/webgl/MusicModel.tsx` : modèle 3D lié aux scènes musicales.
- `src/portfolio/webgl/musicScene.tsx` : scène 3D associée aux pages musique.

### Styles et assets portfolio

- `src/portfolio/styles/tokens.css` : variables design (couleurs, spacing, etc.).
- `src/portfolio/styles/typography.css` : fontes et règles typographiques.
- `src/portfolio/styles/portfolio.css` : layout global et styles de pages portfolio.
- `src/portfolio/assets/Project_WE310.wav` : ressource audio locale.
- `src/portfolio/assets/fog-reflections.webp` : visuel éditorial local.
- `src/portfolio/assets/moonlit-harbor.webp` : visuel éditorial local.
- `src/portfolio/assets/signal-horizon.webp` : visuel hero principal.
- `src/portfolio/assets/signal-preview-desktop.png` : aperçu desktop documenté.
- `src/portfolio/assets/signal-preview-mobile.png` : aperçu mobile documenté.

## Tactical Board

### Racine, état et hooks

- `src/tactical-board/TacticalBoardApp.tsx` : composition principale de l’application board.
- `src/tactical-board/state/tacticalBoardStore.ts` : store Zustand et actions globales.
- `src/tactical-board/hooks/useBoardAssetUrls.ts` : URLs d’assets (prévisualisation/export).
- `src/tactical-board/hooks/useBoardOnlyMode.ts` : mode plein plateau sans panneaux.
- `src/tactical-board/hooks/useGlobalBoardShortcuts.ts` : raccourcis clavier globaux.
- `src/tactical-board/hooks/useScenarioAutosave.ts` : autosauvegarde du scénario actif.

### Modèle métier

- `src/tactical-board/model/tacticalBoardTypes.ts` : types métier centraux du board.
- `src/tactical-board/model/scenarioDocument.ts` : structure et création de scénario.
- `src/tactical-board/model/scenarioDocumentSchema.ts` : schémas/validations de document.
- `src/tactical-board/model/scenarioHistory.ts` : historique et navigation undo/redo.
- `src/tactical-board/model/scenarioNaming.ts` : règles de nommage/tri des scénarios.
- `src/tactical-board/model/scenarioContinuity.ts` : enchaînement des scénarios.
- `src/tactical-board/model/applyScenarioCommand.ts` : application de commandes métier.
- `src/tactical-board/model/boardInteraction.ts` : interactions de plateau.
- `src/tactical-board/model/boardSelection.ts` : sélection simple/multi et dérivations.
- `src/tactical-board/model/objectiveCampaign.ts` : logique de campagne/objectifs.
- `src/tactical-board/model/objectiveCampaignDefinition.ts` : définition des campagnes.
- `src/tactical-board/model/unitCatalog.ts` : catalogue des types d’unités intégrés.

### Persistence

- `src/tactical-board/persistence/tacticalBoardRepository.ts` : accès IndexedDB principal.
- `src/tactical-board/persistence/loadInitialBoardData.ts` : chargement initial hydraté.
- `src/tactical-board/persistence/scenarioAutosave.ts` : écriture autosave de scénarios.
- `src/tactical-board/persistence/recoveryJournal.ts` : journal de récupération.
- `src/tactical-board/persistence/imageAssetRecord.ts` : modèle de stockage des images.

### Import / export

- `src/tactical-board/import-export/scenarioExchange.ts` : import/export JSON de scénarios.
- `src/tactical-board/import-export/imageAssets.ts` : normalisation des images embarquées.
- `src/tactical-board/import-export/exportBoardImage.ts` : export PNG du plateau.
- `src/tactical-board/import-export/fileDownloads.ts` : déclenchement des téléchargements.

### Features métier UI

- `src/tactical-board/features/battlefield/Battlefield.tsx` : surface interactive du plateau.
- `src/tactical-board/features/battlefield/Battlefield.module.css` : styles du plateau.
- `src/tactical-board/features/battlefield/battlefieldGeometry.ts` : géométrie de grille.
- `src/tactical-board/features/battlefield/BattlefieldToolbar.tsx` : barre d’outils du plateau.
- `src/tactical-board/features/battlefield/BattlefieldToolbar.module.css` : styles toolbar.
- `src/tactical-board/features/battlefield/BattlefieldSettingsModal.tsx` : réglages du plateau.
- `src/tactical-board/features/battlefield/BattlefieldSettingsModal.module.css` : styles modal réglages.
- `src/tactical-board/features/battlefield/ArrowLayer.tsx` : couche SVG des flèches.
- `src/tactical-board/features/battlefield/useArrowDrawing.ts` : logique de dessin des flèches.
- `src/tactical-board/features/battlefield/MarkerLayer.tsx` : couche de marqueurs.
- `src/tactical-board/features/battlefield/DragGhostLayer.tsx` : prévisualisation pendant drag.
- `src/tactical-board/features/battlefield/UnitVisual.tsx` : rendu visuel d’une unité.
- `src/tactical-board/features/battlefield/unitVisualModel.ts` : modèle visuel dérivé d’unité.
- `src/tactical-board/features/battlefield/unitDragPreview.ts` : aperçu de déplacement d’unité.
- `src/tactical-board/features/battlefield/BuiltinUnitIcon.tsx` : icône d’unité intégrée.
- `src/tactical-board/features/inspector/InspectorPanel.tsx` : panneau d’inspection/édition.
- `src/tactical-board/features/inspector/InspectorPanel.module.css` : styles inspecteur.
- `src/tactical-board/features/library/LibraryPanel.tsx` : gestion bibliothèque (types/factions).
- `src/tactical-board/features/library/LibraryPanel.module.css` : styles bibliothèque.
- `src/tactical-board/features/scenarios/ScenarioTopBar.tsx` : barre haute des scénarios.
- `src/tactical-board/features/scenarios/ScenarioTopBar.module.css` : styles top bar scénarios.
- `src/tactical-board/features/scenarios/NewScenarioModal.tsx` : création de scénario.
- `src/tactical-board/features/scenarios/NewScenarioModal.module.css` : styles création.
- `src/tactical-board/features/scenarios/ScenarioFlowModals.tsx` : modales de progression de flux.
- `src/tactical-board/features/scenarios/ScenarioFlowModals.module.css` : styles modales de flux.

### UI réutilisable board

- `src/tactical-board/ui/Button.tsx` : bouton réutilisable board.
- `src/tactical-board/ui/Button.module.css` : styles bouton.
- `src/tactical-board/ui/Modal.tsx` : modal générique.
- `src/tactical-board/ui/Modal.module.css` : styles modal.
- `src/tactical-board/ui/PanelShell.tsx` : conteneur standard de panneau.
- `src/tactical-board/ui/PanelShell.module.css` : styles conteneur panneau.
- `src/tactical-board/ui/SaveStatus.tsx` : indicateur de statut de sauvegarde.
- `src/tactical-board/ui/SaveStatus.module.css` : styles statut sauvegarde.
- `src/tactical-board/ui/Tooltip.tsx` : infobulle réutilisable.
- `src/tactical-board/ui/Tooltip.module.css` : styles infobulle.
- `src/tactical-board/ui/UnitGlyph.tsx` : glyphe d’unité.
- `src/tactical-board/ui/UnitGlyph.module.css` : styles glyphe.

### Styles et assets board

- `src/tactical-board/styles/tactical-board.css` : styles globaux board.
- `src/tactical-board/styles/TacticalBoardApp.module.css` : layout racine board.
- `src/tactical-board/styles/FormControls.module.css` : styles des contrôles de formulaire.
- `src/tactical-board/assets/resolveBuiltinUnitIcon.ts` : résolution des icônes intégrées.
- `src/tactical-board/assets/base-icon-game.png` : icône unité de base.
- `src/tactical-board/assets/obstacle-icon-game.png` : icône obstacle.

## Shared

- `src/shared/assets/tactical-terrain.webp` : texture/visuel terrain partagé.

## Tests

- `src/tests/setup.ts` : initialisation commune des tests.
- `src/tests/portfolio.test.tsx` : tests de navigation/affichage portfolio.
- `src/tests/publishedContent.test.ts` : validation du contenu publié.
- `src/tests/routingIsolation.test.tsx` : isolation stricte portfolio vs board.
- `src/tests/screenGlitch.test.tsx` : comportement de l’effet glitch.
- `src/tests/webglFallback.test.tsx` : fallback quand WebGL indisponible.
- `src/tests/tacticalBoardModel.test.ts` : tests du modèle métier board.
- `src/tests/tacticalBoard.test.tsx` : tests UI et interactions Tactical Board.
- `src/tests/persistence.test.ts` : tests IndexedDB/persistance.

## Assets globaux non versionnés logique métier

- `src/assets/effects/signal-glitch.mp4` : média de support effet glitch.
- `src/assets/effects/signal-glitch.webm` : variante webm du média glitch.

## Convention de mise à jour

Quand un fichier est ajouté, renommé ou déplacé :

1. Mettre à jour cette carte.
2. Mettre à jour la documentation API si nécessaire (`npm run docs:api`).
3. Vérifier que le rôle du fichier reste compatible avec la séparation
   portfolio/board.
