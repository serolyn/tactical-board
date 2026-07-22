import { applyCommand } from './applyScenarioCommand'
import type {
  CommandResult,
  ScenarioCommand,
  ScenarioDocumentV1,
} from './tacticalBoardTypes'

export const DEFAULT_HISTORY_LIMIT = 100

export interface HistoryState<T> {
  readonly past: readonly T[]
  readonly present: T
  readonly future: readonly T[]
}

/**
 * Crée un historique vide autour d'un état de départ.
 *
 * C'est le point de départ de l'undo/redo: aucun état n'est encore passé,
 * le scénario courant est le seul présent, et rien n'est prêt à être refait.
 */
export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] }
}

/**
 * Ajoute un nouvel état à l'historique sans perdre la trace des précédents.
 *
 * La limite empêche de garder une mémoire infinie: on conserve seulement les
 * derniers états utiles pour l'utilisateur.
 */
export function pushHistory<T>(
  history: HistoryState<T>,
  next: T,
  limit = DEFAULT_HISTORY_LIMIT,
): HistoryState<T> {
  if (Object.is(history.present, next)) return history
  const normalizedLimit = Math.max(0, Math.trunc(limit))
  const past =
    normalizedLimit === 0
      ? []
      : [...history.past, history.present].slice(-normalizedLimit)
  return { past, present: next, future: [] }
}

/**
 * Revient à l'état précédent quand l'utilisateur annule une action.
 *
 * L'état courant est déplacé vers le futur pour pouvoir être restauré ensuite.
 */
export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  const previous = history.past.at(-1)
  if (previous === undefined) return history
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

/**
 * Restaure l'état qui avait été annulé juste avant.
 *
 * Cette fonction fait l'opération inverse de `undoHistory` et remet l'état
 * dans la pile des états passés.
 */
export function redoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  const next = history.future[0]
  if (next === undefined) return history
  return {
    past: [...history.past, history.present].slice(-DEFAULT_HISTORY_LIMIT),
    present: next,
    future: history.future.slice(1),
  }
}

export interface HistoryCommandResult {
  readonly history: HistoryState<ScenarioDocumentV1>
  readonly commandResult: CommandResult
}

/**
 * Applique une commande métier et n'enregistre l'état que si le document a changé.
 *
 * Cette fonction évite de remplir l'historique avec des actions sans effet.
 */
export function applyCommandToHistory(
  history: HistoryState<ScenarioDocumentV1>,
  command: ScenarioCommand,
): HistoryCommandResult {
  const commandResult = applyCommand(history.present, command)
  return {
    history: commandResult.changed
      ? pushHistory(history, commandResult.document)
      : history,
    commandResult,
  }
}
