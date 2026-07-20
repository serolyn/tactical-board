/**
 * @packageDocumentation
 * Hooks de comportement Tactical Board.
 *
 * Ces fonctions réutilisables branchent la logique au cycle de vie React:
 * autosave, raccourcis clavier, mode plein plateau ou URLs des assets.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageAssetRecord } from '@/tactical-board/persistence/imageAssetRecord'
import { tacticalBoardRepository } from '@/tactical-board/persistence/tacticalBoardRepository'
/**
 * Cette fonction intervient sur le sujet “make Asset Url Map” dans tactical-board.
 *
 * Fichier: src/tactical-board/hooks/useBoardAssetUrls.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord makeAssetUrlMap dans useBoardAssetUrls.ts.
 */


function makeAssetUrlMap(assets: readonly ImageAssetRecord[]) {
  return Object.fromEntries(assets.map((asset) => [asset.id, URL.createObjectURL(asset.blob)]))
}

export interface BoardAssetUrlState {
  assetUrls: Readonly<Record<string, string>>
  loadAssets(assets: readonly ImageAssetRecord[]): void
  refreshAssetUrls(): Promise<void>
}

/** Crée et révoque les URL objet associées aux images stockées dans IndexedDB. */
export function useBoardAssetUrls(): BoardAssetUrlState {
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
  const assetUrlsRef = useRef<Record<string, string>>({})

  const loadAssets = useCallback((assets: readonly ImageAssetRecord[]) => {
    const next = makeAssetUrlMap(assets)
    assetUrlsRef.current = next
    setAssetUrls(next)
  }, [])

  const refreshAssetUrls = useCallback(async () => {
    const assets = await tacticalBoardRepository.listAssets()
    const previous = assetUrlsRef.current
    const next: Record<string, string> = {}
    for (const asset of assets) {
      next[asset.id] = previous[asset.id] ?? URL.createObjectURL(asset.blob)
    }
    for (const [id, url] of Object.entries(previous)) {
      if (!next[id]) URL.revokeObjectURL(url)
    }
    assetUrlsRef.current = next
    setAssetUrls(next)
  }, [])

  useEffect(
    () => () => {
      for (const url of Object.values(assetUrlsRef.current)) URL.revokeObjectURL(url)
    },
    [],
  )

  return { assetUrls, loadAssets, refreshAssetUrls }
}
