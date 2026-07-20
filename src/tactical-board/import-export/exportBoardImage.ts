/**
 * @packageDocumentation
 * Import et export des données Tactical Board.
 *
 * Ce dossier transforme les scénarios en fichiers JSON ou en images, puis les
 * relit en vérifiant qu'ils sont encore valides avant de les réinjecter dans
 * l'application.
 */

/** Prépare une copie hors écran du plateau puis la convertit en PNG téléchargeable. */
import { toBlob } from 'html-to-image'
import { downloadBlob, sanitizeFilename } from './fileDownloads'

export interface BoardPngOptions {
  filename?: string
  width?: number
  height?: number
  pixelRatio?: number
  backgroundColor?: string
}
/**
 * Cette fonction intervient sur le sujet “positive Dimension” dans tactical-board.
 *
 * Fichier: src/tactical-board/import-export/exportBoardImage.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord positiveDimension dans exportBoardImage.ts.
 */


function positiveDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : Math.max(1, Math.ceil(fallback))
}

/** Produit le Blob sans modifier durablement le plateau affiché. */
export async function renderBoardToPng(
  boardElement: HTMLElement,
  options: BoardPngOptions = {},
): Promise<Blob> {
  const bounds = boardElement.getBoundingClientRect()
  const width = positiveDimension(options.width ?? 0, boardElement.scrollWidth || bounds.width)
  const height = positiveDimension(options.height ?? 0, boardElement.scrollHeight || bounds.height)

  const staging = document.createElement('div')
  staging.setAttribute('aria-hidden', 'true')
  Object.assign(staging.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${width}px`,
    height: `${height}px`,
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: '-1',
  })

  const clone = boardElement.cloneNode(true) as HTMLElement
  for (const element of clone.querySelectorAll<HTMLElement>('[data-png-hide]')) {
    element.remove()
  }
  for (const element of clone.querySelectorAll<HTMLElement>('[data-png-remove-class]')) {
    const className = element.dataset.pngRemoveClass
    if (className) element.classList.remove(...className.split(/\s+/).filter(Boolean))
    element.removeAttribute('data-png-remove-class')
  }
  for (const element of clone.querySelectorAll<SVGElement>('[data-png-stroke-width]')) {
    element.setAttribute('stroke-width', element.getAttribute('data-png-stroke-width') ?? '3.5')
    element.removeAttribute('data-png-stroke-width')
  }
  for (const element of clone.querySelectorAll<SVGElement>('[data-png-opacity]')) {
    element.setAttribute('opacity', element.getAttribute('data-png-opacity') ?? '0.84')
    element.removeAttribute('data-png-opacity')
  }
  Object.assign(clone.style, {
    position: 'relative',
    inset: 'auto',
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    overflow: 'visible',
    transform: 'none',
    transformOrigin: 'top left',
    zoom: '1',
  })
  staging.append(clone)
  document.body.append(staging)

  try {
    if (document.fonts) await document.fonts.ready
    const blob = await toBlob(clone, {
      width,
      height,
      pixelRatio: options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2),
      backgroundColor: options.backgroundColor ?? '#111820',
      cacheBust: true,
      style: { transform: 'none', transformOrigin: 'top left' },
    })

    if (!blob) throw new Error('La génération du PNG a échoué.')
    return blob
  } finally {
    staging.remove()
  }
}

/** Génère le PNG puis déclenche son téléchargement dans le navigateur. */
export async function exportBoardToPng(
  boardElement: HTMLElement,
  options: BoardPngOptions = {},
): Promise<Blob> {
  const blob = await renderBoardToPng(boardElement, options)
  downloadBlob(blob, sanitizeFilename(options.filename ?? 'plateau-tactique', 'png'))
  return blob
}
