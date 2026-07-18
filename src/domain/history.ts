import { applyCommand } from './reducer'
import type { CommandResult, ScenarioCommand, ScenarioDocumentV1 } from './types'

export const DEFAULT_HISTORY_LIMIT = 100

export interface HistoryState<T> {
  readonly past: readonly T[]
  readonly present: T
  readonly future: readonly T[]
}
export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] }
}

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

export function undoHistory<T>(history: HistoryState<T>): HistoryState<T> {
  const previous = history.past.at(-1)
  if (previous === undefined) return history
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

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
