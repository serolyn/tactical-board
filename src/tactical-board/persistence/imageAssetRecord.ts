/**
 * Forme durable d'une image enregistrée dans IndexedDB.
 * Ce contrat appartient à la persistance : le traitement d'image peut le consommer,
 * mais le dépôt ne dépend ainsi jamais des fonctions d'import/export.
 */
export interface ImageAssetRecord {
  id: string
  blob: Blob
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml'
  name: string
  width: number
  height: number
  createdAt: string
}
