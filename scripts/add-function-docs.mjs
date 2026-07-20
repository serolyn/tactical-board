#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(scriptDirectory, '..')
const sourceRoot = path.join(projectDirectory, 'src')

const sourceFiles = await collectSourceFiles(sourceRoot)
let updatedCount = 0

for (const filePath of sourceFiles) {
  const sourceText = await fs.readFile(filePath, 'utf8')
  const moduleSourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  const edits = collectEdits(moduleSourceFile, sourceText, filePath)
  if (!edits.length) continue

  const nextText = applyEdits(sourceText, edits)
  await fs.writeFile(filePath, nextText, 'utf8')
  updatedCount += 1
}

console.log(`Fichiers enrichis: ${updatedCount}`)

async function collectSourceFiles(rootDirectory) {
  const entries = await fs.readdir(rootDirectory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(rootDirectory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)))
      continue
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) continue
    files.push(absolutePath)
  }

  return files
}

function collectEdits(moduleSourceFile, sourceText, filePath) {
  const edits = []

  for (const statement of moduleSourceFile.statements) {
    const declarationInfo = getTopLevelDeclaration(statement)
    if (!declarationInfo) continue
    if (hasLeadingJSDoc(sourceText, statement)) continue

    const comment = buildPedagogicalComment(filePath, declarationInfo.kind, declarationInfo.name)
    if (!comment) continue

    edits.push({
      position: statement.getStart(moduleSourceFile),
      text: `${comment}\n`,
    })
  }

  return edits.sort((left, right) => right.position - left.position)
}

function getTopLevelDeclaration(statement) {
  if (ts.isFunctionDeclaration(statement) && statement.name) {
    return { kind: 'function', name: statement.name.text }
  }

  if (ts.isClassDeclaration(statement) && statement.name) {
    return { kind: 'class', name: statement.name.text }
  }

  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue
      const initializer = declaration.initializer
      if (!initializer) continue
      if (!ts.isArrowFunction(initializer) && !ts.isFunctionExpression(initializer)) continue
      return { kind: 'function', name: declaration.name.text }
    }
  }

  return null
}

function hasLeadingJSDoc(sourceText, statement) {
  const ranges = ts.getLeadingCommentRanges(sourceText, statement.getFullStart()) ?? []
  return ranges.some((range) => sourceText.slice(range.pos, range.end).startsWith('/**'))
}

function buildPedagogicalComment(filePath, kind, name) {
  const baseName = path.basename(filePath)
  const area = filePath.includes('/portfolio/')
    ? 'portfolio'
    : filePath.includes('/tactical-board/')
      ? 'tactical-board'
      : filePath.includes('/app/')
        ? 'app'
        : filePath.includes('/tests/')
          ? 'tests'
          : 'module'

  const specific = specificComment(filePath, name, kind)
  if (specific) return specific

  const action = actionFromName(name, kind)
  const subject = subjectFromName(name)

  return `/**\n * Cette ${kind === 'class' ? 'classe' : 'fonction'} ${action} ${subject} dans ${area}.\n *\n * Fichier: ${path.relative(projectDirectory, filePath).replaceAll(path.sep, '/')}\n * ${pedagogicalHint(baseName, name, kind)}\n */`
}

function specificComment(filePath, name, kind) {
  const relativePath = path.relative(projectDirectory, filePath).replaceAll(path.sep, '/')

  const map = {
    'src/app/normalizeSiteBasename.ts': {
      normalizeSiteBasename: 'Cette fonction nettoie le préfixe d’URL pour que Vite et GitHub Pages parlent le même langage.',
    },
    'src/app/SiteRouter.tsx': {
      lazyPortfolioPage: 'Cette petite fabrique enveloppe une page portfolio dans un chargement différé, pour que l’interface reste fluide.',
      SiteRouteTree: 'Cette fonction construit l’arbre des routes et décide quelle application est affichée.',
      SiteRouter: 'Cette fonction monte le routeur React avec le bon basename pour le déploiement.',
    },
    'src/app/SiteRouteEffects.tsx': {
      SiteRouteEffects: 'Ce composant applique les métadonnées de route dans le document HTML à chaque navigation.',
    },
    'src/portfolio/PortfolioShell.tsx': {
      PortfolioShell: 'Ce composant pose le cadre visuel commun à toutes les pages du portfolio.',
    },
    'src/portfolio/content/validation.ts': {
      isBlank: 'Cette petite fonction teste si un texte est vide ou ne contient que des espaces.',
      addMissingField: 'Cette fonction prépare un message d’erreur quand un champ obligatoire manque.',
      validateImage: 'Cette fonction vérifie qu’une image possède bien une source et un texte alternatif.',
      isValidLink: 'Cette fonction contrôle si un lien correspond bien au type attendu.',
      validateLink: 'Cette fonction transforme un lien invalide en erreur lisible pour le contenu éditorial.',
      validateSections: 'Cette fonction parcourt toutes les sections d’une entrée pour vérifier qu’elles sont complètes.',
      validateCommonFields: 'Cette fonction vérifie les champs partagés par tous les contenus publiés.',
      validateProject: 'Cette fonction ajoute les règles propres à un projet du portfolio.',
      validateMusic: 'Cette fonction ajoute les règles propres à une scène sonore.',
      validateLab: 'Cette fonction ajoute les règles propres à une entrée de laboratoire.',
    },
    'src/portfolio/content/index.ts': {
      getPublishedContent: 'Cette fonction rassemble les contenus publiés pour les rendre faciles à consommer par les pages.',
    },
    'src/portfolio/content/lab.ts': {},
    'src/portfolio/content/music.ts': {},
    'src/portfolio/content/projects.ts': {},
    'src/portfolio/content/types.ts': {},
    'src/tactical-board/model/scenarioHistory.ts': {
      createHistory: 'Cette fonction crée un historique vide à partir d’un état initial.',
      pushHistory: 'Cette fonction ajoute un nouvel état à l’historique sans écraser l’ancienne trace.',
      undoHistory: 'Cette fonction remonte d’un pas en arrière dans l’historique.',
      redoHistory: 'Cette fonction rejoue l’état qui avait été annulé.',
      applyCommandToHistory: 'Cette fonction applique une commande puis n’enregistre l’état que si le document a vraiment changé.',
    },
    'src/tactical-board/model/scenarioDocument.ts': {
      createEntityId: 'Cette fonction fabrique un identifiant unique pour un scénario, une unité ou une entité métier.',
      createDefaultScenario: 'Cette fonction construit un scénario neuf avec ses valeurs de départ.',
      migrateScenarioDocumentV1: 'Cette fonction convertit un ancien document de scénario vers le format courant.',
      isLegacyScenarioDocumentV1: 'Cette fonction détecte si un document appartient à l’ancien format.',
    },
    'src/tactical-board/persistence/tacticalBoardRepository.ts': {
      migrateStoredScenario: 'Cette fonction relit un scénario sauvegardé et le remet dans le format attendu par l’application.',
      openTacticalBoardDatabase: 'Cette fonction ouvre la base IndexedDB utilisée par Tactical Board.',
      resetTacticalBoardDatabase: 'Cette fonction efface complètement les données locales du board.',
      collectReferencedAssetIds: 'Cette fonction repère quels assets sont encore utilisés dans les scénarios.',
    },
    'src/tactical-board/import-export/scenarioExchange.ts': {
      exportScenarioJson: 'Cette fonction transforme un scénario en fichier JSON téléchargeable.',
      exportAllScenariosJson: 'Cette fonction exporte tous les scénarios du board d’un seul coup.',
      importScenario: 'Cette fonction lit un fichier importé et le reconstruit en scénario valide.',
    },
    'src/tactical-board/features/battlefield/Battlefield.tsx': {
      Battlefield: 'Ce composant dessine et pilote le plateau tactique que l’utilisateur manipule.',
    },
    'src/tactical-board/TacticalBoardApp.tsx': {
      saveStateFor: 'Cette fonction traduit l’état interne d’autosauvegarde en libellé visible par l’interface.',
      errorMessage: 'Cette fonction transforme une erreur brute en message lisible pour l’utilisateur.',
      formatScenarioDate: 'Cette fonction affiche une date de scénario dans un format humain.',
      useDesktopLayout: 'Ce hook détecte si l’écran est assez large pour afficher la version bureau du board.',
      TacticalBoardApp: 'Ce composant assemble tout le board: état, panneaux, plateau, import/export et autosauvegarde.',
    },
  }

  const fileMap = map[relativePath]
  const comment = fileMap?.[name]
  if (!comment) return null

  return `/**\n * ${comment}\n */`
}

function actionFromName(name, kind) {
  if (kind === 'class') return 'structure'
  if (name.startsWith('create')) return 'construit'
  if (name.startsWith('validate')) return 'vérifie'
  if (name.startsWith('is')) return 'teste'
  if (name.startsWith('has')) return 'détecte'
  if (name.startsWith('load')) return 'charge'
  if (name.startsWith('save')) return 'enregistre'
  if (name.startsWith('undo')) return 'revient en arrière sur'
  if (name.startsWith('redo')) return 'rejoue'
  if (name.startsWith('apply')) return 'applique'
  if (name.startsWith('migrate')) return 'convertit'
  if (name.startsWith('normalize')) return 'nettoie'
  if (name.startsWith('derive')) return 'calcule'
  if (name.startsWith('format')) return 'formate'
  if (name.startsWith('collect')) return 'rassemble'
  if (name.startsWith('select')) return 'extrait'
  if (name.startsWith('toggle')) return 'bascule'
  if (name.startsWith('open')) return 'ouvre'
  if (name.startsWith('close')) return 'ferme'
  if (name.startsWith('export')) return 'prépare'
  if (name.startsWith('import')) return 'lit'
  if (name.startsWith('handle')) return 'gère'
  return 'intervient sur'
}

function subjectFromName(name) {
  const stripped = name
    .replace(/^(create|validate|is|has|load|save|undo|redo|apply|migrate|normalize|derive|format|collect|select|toggle|open|close|export|import|handle)/, '')
    .replace(/^([A-Z])/, (_, letter) => letter.toLowerCase())
  const words = stripped
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()

  return words ? `le sujet “${words}”` : 'le comportement du module'
}

function pedagogicalHint(fileName, name, kind) {
  return `Si tu lis ce fichier pour apprendre, regarde d’abord ${name} dans ${fileName}.` 
}

function applyEdits(sourceText, edits) {
  let nextText = sourceText
  for (const edit of edits) {
    nextText = `${nextText.slice(0, edit.position)}${edit.text}${nextText.slice(edit.position)}`
  }
  return nextText
}