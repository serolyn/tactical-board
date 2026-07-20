/**
 * @packageDocumentation
 * Modèle métier pur de Tactical Board.
 *
 * Ce dossier décrit les règles du jeu de données: documents, sélection,
 * historique, unités, campagnes et migrations. Il ne dépend pas de React.
 */

/** Règles pures de nommage et de classement de la bibliothèque de scénarios. */
import type { ScenarioDocumentV1 } from './tacticalBoardTypes'
/**
 * Cette fonction intervient sur le sujet “unique Scenario Name” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/scenarioNaming.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord uniqueScenarioName dans scenarioNaming.ts.
 */


export function uniqueScenarioName(
  baseName: string,
  documents: readonly ScenarioDocumentV1[],
  suffix = 'copie',
): string {
  const names = new Set(documents.map((document) => document.name.toLocaleLowerCase('fr')))
  if (!names.has(baseName.toLocaleLowerCase('fr'))) return baseName

  let index = 1
  let candidate = `${baseName} (${suffix})`
  while (names.has(candidate.toLocaleLowerCase('fr'))) {
    index += 1
    candidate = `${baseName} (${suffix} ${index})`
  }
  return candidate
}
/**
 * Cette fonction intervient sur le sujet “sort Scenarios” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/scenarioNaming.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord sortScenarios dans scenarioNaming.ts.
 */


export function sortScenarios(
  documents: readonly ScenarioDocumentV1[],
): ScenarioDocumentV1[] {
  return [...documents].sort((left, right) => {
    const leftDate = left.period?.start ?? left.createdAt
    const rightDate = right.period?.start ?? right.createdAt
    return (
      leftDate.localeCompare(rightDate) ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.name.localeCompare(right.name, 'fr')
    )
  })
}
