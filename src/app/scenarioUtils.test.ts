import { describe, expect, it } from 'vitest'

import { createDefaultScenario, type ScenarioDocumentV1 } from '../domain'
import { sortScenarios, uniqueScenarioName } from './scenarioUtils'

function scenario(
  id: string,
  name: string,
  createdAt: string,
  periodStart?: string,
): ScenarioDocumentV1 {
  return createDefaultScenario(name, {
    id,
    now: createdAt,
    ...(periodStart ? { period: { start: periodStart } } : {}),
  })
}

describe('uniqueScenarioName', () => {
  it('compare les noms sans tenir compte de la casse et incrémente le suffixe', () => {
    const documents = [
      scenario('1', 'Alpha', '2026-01-01T00:00:00.000Z'),
      scenario('2', 'alpha (copie)', '2026-01-02T00:00:00.000Z'),
      scenario('3', 'ALPHA (COPIE 2)', '2026-01-03T00:00:00.000Z'),
    ]

    expect(uniqueScenarioName('ALPHA', documents)).toBe('ALPHA (copie 3)')
    expect(uniqueScenarioName('Bravo', documents)).toBe('Bravo')
    expect(uniqueScenarioName('Alpha', documents, 'suite')).toBe('Alpha (suite)')
  })
})

describe('sortScenarios', () => {
  it('trie par début de période, puis date de création, puis nom français', () => {
    const alpha = scenario('alpha', 'Alpha', '2026-01-02T00:00:00.000Z', '2026-03-01')
    const bravo = scenario('bravo', 'Bravo', '2026-01-01T00:00:00.000Z', '2026-03-01')
    const charlie = scenario('charlie', 'Charlie', '2026-01-01T00:00:00.000Z', '2026-02-01')
    const delta = scenario('delta', 'Delta', '2026-01-15T00:00:00.000Z')
    const source = [alpha, delta, bravo, charlie]

    expect(sortScenarios(source).map((document) => document.id)).toEqual([
      'delta',
      'charlie',
      'bravo',
      'alpha',
    ])
    expect(source.map((document) => document.id)).toEqual([
      'alpha',
      'delta',
      'bravo',
      'charlie',
    ])
  })

  it('utilise le nom pour départager deux scénarios créés au même instant', () => {
    const createdAt = '2026-04-01T00:00:00.000Z'
    const zulu = scenario('zulu', 'Zulu', createdAt)
    const alpha = scenario('alpha', 'Alpha', createdAt)

    expect(sortScenarios([zulu, alpha]).map((document) => document.name)).toEqual([
      'Alpha',
      'Zulu',
    ])
  })
})
