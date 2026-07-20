#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(scriptDirectory, '..')
const sourceRoot = path.join(projectDirectory, 'src')

const files = await collectFiles(sourceRoot)
let updated = 0

for (const filePath of files) {
  const content = await readFile(filePath, 'utf8')
  if (content.includes('@packageDocumentation')) continue

  const relativePath = path.relative(projectDirectory, filePath).replaceAll(path.sep, '/')
  const comment = buildModuleComment(relativePath)
  await writeFile(filePath, `${comment}${content}`, 'utf8')
  updated += 1
}

console.log(`Fichiers documentés: ${updated}`)

async function collectFiles(rootDirectory) {
  const entries = await import('node:fs/promises').then(({ readdir }) => readdir(rootDirectory, { withFileTypes: true }))
  const result = []

  for (const entry of entries) {
    const absolutePath = path.join(rootDirectory, entry.name)
    if (entry.isDirectory()) {
      result.push(...(await collectFiles(absolutePath)))
      continue
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) continue
    result.push(absolutePath)
  }

  return result
}

function buildModuleComment(relativePath) {
  const name = path.basename(relativePath)

  if (relativePath === 'src/main.tsx') {
    return `/**
 * @packageDocumentation
 * Point d'entrée de l'application React.
 *
 * Si tu débutes, commence ici: ce fichier ne contient presque aucune logique
 * métier. Il branche simplement React sur le DOM et lance le routeur racine.
 */

`
  }

  if (relativePath === 'src/assets.d.ts') {
    return `/**
 * @packageDocumentation
 * Déclarations de types pour les fichiers non TypeScript importés par Vite.
 *
 * Ce fichier dit à TypeScript comment comprendre les images, sons et autres
 * assets statiques. Il n'affiche rien à l'écran, il évite juste les erreurs.
 */

`
  }

  if (relativePath.startsWith('src/app/effects/')) {
    return `/**
 * @packageDocumentation
 * Effet visuel global utilisé par le routeur.
 *
 * Ce fichier contrôle une couche décorative partagée par le site. Lis-le si
 * tu veux comprendre comment le portfolio ajoute un signal visuel sans toucher
 * au contenu des pages.
 */

`
  }

  if (relativePath.startsWith('src/app/')) {
    const fileHint =
      name === 'SiteRouter.tsx'
        ? 'Il décide quelle application est visible et quelle route ouvre le portfolio ou Tactical Board.'
        : name === 'SiteRouteEffects.tsx'
          ? 'Il met à jour le titre et la description de la page quand l\'URL change.'
          : name === 'siteRouteMetadata.ts'
            ? 'Il centralise le titre et la description de chaque route publique.'
            : name === 'normalizeSiteBasename.ts'
              ? 'Il nettoie le préfixe d\'URL pour que GitHub Pages et Vite restent compatibles.'
              : 'Il prépare le comportement commun de navigation du site.'

    return `/**
 * @packageDocumentation
 * Outils de navigation et de métadonnées du site.
 *
 * ${fileHint} Ce dossier est le bon point d'entrée si tu veux comprendre comment
 * une URL devient une page visible dans le navigateur.
 */

`
  }

  if (relativePath.startsWith('src/portfolio/components/')) {
    return `/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

`
  }

  if (relativePath.startsWith('src/portfolio/pages/')) {
    return `/**
 * @packageDocumentation
 * Page routée du portfolio.
 *
 * Une page assemble plusieurs composants pour former un écran complet. Si tu
 * veux comprendre la structure d'une route comme l'accueil, le lab ou un détail,
 * lis ce fichier en premier.
 */

`
  }

  if (relativePath.startsWith('src/portfolio/content/')) {
    return `/**
 * @packageDocumentation
 * Données éditoriales du portfolio.
 *
 * Ce fichier contient le texte publié, pas la mise en page. C'est ici que tu
 * modifies les titres, résumés, listes et règles de validation du contenu.
 */

`
  }

  if (relativePath.startsWith('src/portfolio/motion/')) {
    return `/**
 * @packageDocumentation
 * Animation du portfolio.
 *
 * Ce fichier explique comment les éléments apparaissent, se déplacent ou se
 * révèlent à l'écran. Lis-le pour comprendre pourquoi certaines transitions sont
 * visibles et d'autres très discrètes.
 */

`
  }

  if (relativePath.startsWith('src/portfolio/webgl/')) {
    return `/**
 * @packageDocumentation
 * Effets WebGL du portfolio.
 *
 * Ce dossier contient la partie visuelle avancée du hero: shaders, scènes et
 * fallback. Si WebGL n'est pas disponible, ces fichiers expliquent aussi quoi
 * faire à la place.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/features/battlefield/')) {
    return `/**
 * @packageDocumentation
 * Interface du plateau tactique.
 *
 * Ce fichier gère la grille, les unités, les flèches et les marqueurs. Si tu
 * veux comprendre ce que voit l'utilisateur quand il manipule le plateau, c'est
 * ici qu'il faut commencer.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/features/inspector/')) {
    return `/**
 * @packageDocumentation
 * Panneau d'inspection Tactical Board.
 *
 * Ce fichier sert à afficher et éditer les détails de ce qui est sélectionné
 * sur le plateau. Il aide l'utilisateur à changer un objet sans quitter le board.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/features/library/')) {
    return `/**
 * @packageDocumentation
 * Bibliothèque d'éléments Tactical Board.
 *
 * Ce fichier regroupe les types, factions et entrées qui peuvent être ajoutés
 * dans un scénario. C'est la partie à lire quand tu veux comprendre d'où viennent
 * les éléments qu'on peut placer.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/features/scenarios/')) {
    return `/**
 * @packageDocumentation
 * Barre et modales de scénario Tactical Board.
 *
 * Ce dossier gère les actions de haut niveau: créer un scénario, passer au
 * suivant, consulter les détails ou suivre la progression. Il relie le métier
 * du board aux actions visibles dans l'interface.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/hooks/')) {
    return `/**
 * @packageDocumentation
 * Hooks de comportement Tactical Board.
 *
 * Ces fonctions réutilisables branchent la logique au cycle de vie React:
 * autosave, raccourcis clavier, mode plein plateau ou URLs des assets.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/import-export/')) {
    return `/**
 * @packageDocumentation
 * Import et export des données Tactical Board.
 *
 * Ce dossier transforme les scénarios en fichiers JSON ou en images, puis les
 * relit en vérifiant qu'ils sont encore valides avant de les réinjecter dans
 * l'application.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/model/')) {
    return `/**
 * @packageDocumentation
 * Modèle métier pur de Tactical Board.
 *
 * Ce dossier décrit les règles du jeu de données: documents, sélection,
 * historique, unités, campagnes et migrations. Il ne dépend pas de React.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/persistence/')) {
    return `/**
 * @packageDocumentation
 * Persistance locale de Tactical Board.
 *
 * Ce dossier explique comment le board enregistre ses scénarios dans IndexedDB,
 * recharge les données au démarrage et garde un journal de récupération.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/ui/')) {
    return `/**
 * @packageDocumentation
 * Petits composants visuels réutilisables du board.
 *
 * Ces fichiers ne portent pas la logique métier: ils dessinent des boutons,
 * modales, infobulles ou panneaux prêts à être réutilisés dans l'interface.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/assets/')) {
    return `/**
 * @packageDocumentation
 * Assets et résolveurs de ressources Tactical Board.
 *
 * Ce dossier aide l'application à retrouver ses icônes et textures locales.
 * Il ne dessine rien directement, il prépare juste les URLs correctes.
 */

`
  }

  if (relativePath.startsWith('src/tactical-board/')) {
    return `/**
 * @packageDocumentation
 * Briques internes de Tactical Board.
 *
 * Ce fichier participe à la construction du board, soit côté état, soit côté
 * affichage, soit côté logique utilitaire. Lis le dossier voisin pour savoir
 * quelle partie du board il alimente.
 */

`
  }

  if (relativePath.startsWith('src/tests/')) {
    return `/**
 * @packageDocumentation
 * Tests automatiques du projet.
 *
 * Ce fichier vérifie un comportement précis pour éviter les régressions.
 * Quand tu modifies le code associé, lis ce test pour comprendre ce qui doit
 * rester vrai.
 */

`
  }

  if (relativePath.startsWith('src/portfolio/')) {
    return `/**
 * @packageDocumentation
 * Brique interne du portfolio.
 *
 * Ce fichier appartient à la partie éditoriale du site. Lis le dossier voisin
 * pour comprendre si tu es dans le contenu, l'animation, les pages ou les effets.
 */

`
  }

  return `/**
 * @packageDocumentation
 * Fichier source du projet.
 *
 * Ce commentaire sert d'entrée de lecture quand aucun cas plus précis n'a été
 * détecté automatiquement.
 */

`
}