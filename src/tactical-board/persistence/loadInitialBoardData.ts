/**
 * @packageDocumentation
 * Persistance locale de Tactical Board.
 *
 * Ce dossier explique comment le board enregistre ses scénarios dans IndexedDB,
 * recharge les données au démarrage et garde un journal de récupération.
 */

/** Prépare les scénarios, assets et réglages avant l'hydratation de Tactical Board. */
import {
  applyObjectiveCampaign,
  findObjectiveCampaignCandidate,
  OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING,
  OBJECTIVE_CAMPAIGN_VERSION_SETTING,
} from '@/tactical-board/model/objectiveCampaign'
import { OBJECTIVE_CAMPAIGN_VERSION } from '@/tactical-board/model/objectiveCampaignDefinition'
import { createDefaultScenario } from '@/tactical-board/model/scenarioDocument'
import type { ScenarioDocumentV1 } from '@/tactical-board/model/tacticalBoardTypes'
import type { ImageAssetRecord } from './imageAssetRecord'
import {
  clearRecoveryJournal,
  readRecoveryJournal,
} from './recoveryJournal'
import { tacticalBoardRepository } from './tacticalBoardRepository'

export interface InitialBoardData {
  activeScenarioId?: string
  assets: ImageAssetRecord[]
  documents: ScenarioDocumentV1[]
}

let initialDataPromise: Promise<InitialBoardData> | null = null

/** Charge et réconcilie les sources durables avant le premier rendu de `/board`. */
export async function loadInitialBoardData(): Promise<InitialBoardData> {
  initialDataPromise ??= (async () => {
    let documents = await tacticalBoardRepository.listScenarios()
    let createdInitial: ScenarioDocumentV1 | null = null
    let recoveryNeedsSaving = false
    let recovery: ScenarioDocumentV1 | null = null
    try {
      recovery = readRecoveryJournal()
    } catch {
      // Le journal reste facultatif si le navigateur bloque localStorage.
    }
    if (recovery) {
      const storedIndex = documents.findIndex((document) => document.id === recovery.id)
      const stored = documents[storedIndex]
      if (!stored || recovery.updatedAt >= stored.updatedAt) {
        documents = stored
          ? documents.map((document) => (document.id === recovery.id ? recovery : document))
          : [recovery, ...documents]
        try {
          await tacticalBoardRepository.saveScenario(recovery)
          clearRecoveryJournal(recovery)
        } catch {
          recoveryNeedsSaving = true
        }
      } else {
        try {
          clearRecoveryJournal(recovery)
        } catch {
          // IndexedDB contient déjà un document valide plus récent.
        }
      }
    }
    if (!documents.length) {
      createdInitial = createDefaultScenario()
      documents = [createdInitial]
    }
    const [seededCampaignVersion, trackedCampaignScenarioId] = await Promise.all([
      tacticalBoardRepository.getSetting<number>(OBJECTIVE_CAMPAIGN_VERSION_SETTING),
      tacticalBoardRepository.getSetting<string>(OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING),
    ])
    if ((seededCampaignVersion ?? 0) < OBJECTIVE_CAMPAIGN_VERSION) {
      const firstSeed = (seededCampaignVersion ?? 0) === 0
      const candidate =
        firstSeed && createdInitial
          ? createdInitial
          : findObjectiveCampaignCandidate(documents, trackedCampaignScenarioId)
      if (candidate) {
        const campaign = applyObjectiveCampaign(candidate)
        await tacticalBoardRepository.saveScenarioWithSettings(campaign, {
          [OBJECTIVE_CAMPAIGN_VERSION_SETTING]: OBJECTIVE_CAMPAIGN_VERSION,
          [OBJECTIVE_CAMPAIGN_SCENARIO_ID_SETTING]: campaign.id,
        })
        documents = documents.map((document) =>
          document.id === campaign.id ? campaign : document,
        )
      } else {
        if (createdInitial) await tacticalBoardRepository.saveScenario(createdInitial)
        await tacticalBoardRepository.setSetting(
          OBJECTIVE_CAMPAIGN_VERSION_SETTING,
          OBJECTIVE_CAMPAIGN_VERSION,
        )
      }
    } else if (createdInitial) {
      await tacticalBoardRepository.saveScenario(createdInitial)
    }
    if (!recoveryNeedsSaving) await tacticalBoardRepository.cleanupOrphanAssets()
    const [activeScenarioId, assets] = await Promise.all([
      tacticalBoardRepository.getSetting<string>('activeScenarioId'),
      tacticalBoardRepository.listAssets(),
    ])
    return { activeScenarioId, assets, documents }
  })()
  const pending = initialDataPromise
  void pending.then(
    () => {
      if (initialDataPromise === pending) initialDataPromise = null
    },
    () => {
      if (initialDataPromise === pending) initialDataPromise = null
    },
  )
  return pending
}
