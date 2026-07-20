/**
 * @packageDocumentation
 * Déclarations de types pour les fichiers non TypeScript importés par Vite.
 *
 * Ce fichier dit à TypeScript comment comprendre les images, sons et autres
 * assets statiques. Il n'affiche rien à l'écran, il évite juste les erreurs.
 */

declare module '*.glb' {
  const assetUrl: string
  export default assetUrl
}