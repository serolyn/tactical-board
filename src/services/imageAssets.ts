import DOMPurify from 'dompurify'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 512

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
] as const

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number]

export interface NormalizedImage {
  blob: Blob
  mimeType: 'image/webp' | 'image/png'
  width: number
  height: number
  originalName: string
}

export interface ImageAssetRecord {
  id: string
  blob: Blob
  mimeType: AcceptedImageType | 'image/webp' | 'image/png'
  name: string
  width: number
  height: number
  createdAt: string
}

export interface InspectedImage {
  mimeType: AcceptedImageType
  width: number
  height: number
}

const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp|svg)$/i

function normalizeMimeType(mimeType: string): string {
  return mimeType.toLowerCase().split(';', 1)[0]?.trim() ?? ''
}

function isAcceptedMimeType(value: string): value is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(value)
}

export function validateImageFileMetadata(file: File): void {
  if (file.size === 0) {
    throw new Error('Le fichier image est vide.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('L’image dépasse la limite de 5 Mio.')
  }

  const mimeType = normalizeMimeType(file.type)
  if (mimeType && !isAcceptedMimeType(mimeType)) {
    throw new Error('Format non pris en charge. Utilisez PNG, JPEG, WebP ou SVG.')
  }
  if (!mimeType && !IMAGE_EXTENSION_PATTERN.test(file.name)) {
    throw new Error('Impossible de déterminer le format de l’image.')
  }
}

function looksLikeSvg(text: string): boolean {
  return /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[^]*?-->\s*)*<svg(?:\s|>)/i.test(text)
}

export async function detectImageMimeType(blob: Blob): Promise<AcceptedImageType | null> {
  const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer())

  if (
    header.length >= 8 &&
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a
  ) {
    return 'image/png'
  }

  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return 'image/jpeg'
  }

  if (
    header.length >= 12 &&
    String.fromCharCode(...header.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...header.subarray(8, 12)) === 'WEBP'
  ) {
    return 'image/webp'
  }

  const textSample = await blob.slice(0, Math.min(blob.size, 4096)).text()
  return looksLikeSvg(textSample) ? 'image/svg+xml' : null
}

export async function validateImageBlob(
  blob: Blob,
  declaredMimeType = blob.type,
): Promise<AcceptedImageType> {
  if (blob.size === 0) throw new Error('Le fichier image est vide.')
  if (blob.size > MAX_IMAGE_BYTES) throw new Error('L’image dépasse la limite de 5 Mio.')

  const declared = normalizeMimeType(declaredMimeType)
  if (declared && !isAcceptedMimeType(declared)) {
    throw new Error('Le type MIME de l’image n’est pas pris en charge.')
  }

  const detected = await detectImageMimeType(blob)
  if (!detected) throw new Error('Le contenu du fichier ne correspond pas à une image valide.')
  if (declared && declared !== detected) {
    throw new Error('Le contenu de l’image ne correspond pas à son type MIME.')
  }

  await inspectImageBlob(blob, detected)
  return detected
}

function uint24LittleEndian(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16)
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]! * 0x1000000 +
    (bytes[offset + 1]! << 16) +
    (bytes[offset + 2]! << 8) +
    bytes[offset + 3]!
  )
}

function assertSensibleDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('Les dimensions de l’image sont invalides.')
  }
  if (width > 16_384 || height > 16_384) {
    throw new Error('Les dimensions de l’image sont trop importantes.')
  }
}

function inspectPng(bytes: Uint8Array): { width: number; height: number } {
  if (
    bytes.length < 33 ||
    String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR'
  ) {
    throw new Error('Le fichier PNG est incomplet.')
  }
  const width = uint32BigEndian(bytes, 16)
  const height = uint32BigEndian(bytes, 20)
  let hasEndChunk = false
  for (let index = 8; index <= bytes.length - 8; index += 1) {
    if (String.fromCharCode(...bytes.subarray(index, index + 4)) === 'IEND') {
      hasEndChunk = true
      break
    }
  }
  if (!hasEndChunk) throw new Error('Le fichier PNG est tronqué.')
  return { width, height }
}

function inspectJpeg(bytes: Uint8Array): { width: number; height: number } {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[bytes.length - 2] !== 0xff ||
    bytes[bytes.length - 1] !== 0xd9
  ) {
    throw new Error('Le fichier JPEG est tronqué.')
  }

  let offset = 2
  while (offset + 8 < bytes.length) {
    while (bytes[offset] === 0xff) offset += 1
    const marker = bytes[offset]!
    offset += 1
    if (marker === 0xd9 || marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue

    const segmentLength = (bytes[offset]! << 8) | bytes[offset + 1]!
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    if (isStartOfFrame && segmentLength >= 7) {
      return {
        height: (bytes[offset + 3]! << 8) | bytes[offset + 4]!,
        width: (bytes[offset + 5]! << 8) | bytes[offset + 6]!,
      }
    }
    offset += segmentLength
  }
  throw new Error('Les dimensions du JPEG sont introuvables.')
}

function inspectWebp(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 30) throw new Error('Le fichier WebP est incomplet.')
  const chunk = String.fromCharCode(...bytes.subarray(12, 16))
  if (chunk === 'VP8X') {
    return {
      width: uint24LittleEndian(bytes, 24) + 1,
      height: uint24LittleEndian(bytes, 27) + 1,
    }
  }
  if (chunk === 'VP8L' && bytes[20] === 0x2f) {
    const bits =
      bytes[21]! |
      (bytes[22]! << 8) |
      (bytes[23]! << 16) |
      (bytes[24]! * 0x1000000)
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
  }
  if (
    chunk === 'VP8 ' &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    return {
      width: ((bytes[27]! << 8) | bytes[26]!) & 0x3fff,
      height: ((bytes[29]! << 8) | bytes[28]!) & 0x3fff,
    }
  }
  throw new Error('Le conteneur WebP est invalide.')
}

function inspectSvg(source: string): { width: number; height: number } {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml')
  const root = document.documentElement
  if (root.localName !== 'svg' || document.querySelector('parsererror')) {
    throw new Error('Le fichier SVG est invalide.')
  }
  const viewBox = (root.getAttribute('viewBox') ?? '').trim().split(/[\s,]+/).map(Number)
  const viewBoxWidth = viewBox.length === 4 ? viewBox[2] : undefined
  const viewBoxHeight = viewBox.length === 4 ? viewBox[3] : undefined
  const width = Number.parseFloat(root.getAttribute('width') ?? '') || viewBoxWidth
  const height = Number.parseFloat(root.getAttribute('height') ?? '') || viewBoxHeight
  if (!width || !height) throw new Error('Le SVG doit définir une taille ou une viewBox.')
  return { width: Math.round(width), height: Math.round(height) }
}

export async function inspectImageBlob(
  blob: Blob,
  knownMimeType?: AcceptedImageType,
): Promise<InspectedImage> {
  const mimeType = knownMimeType ?? (await detectImageMimeType(blob))
  if (!mimeType) throw new Error('Le contenu du fichier ne correspond pas à une image valide.')

  const dimensions =
    mimeType === 'image/svg+xml'
      ? inspectSvg(await blob.text())
      : (() => {
          // Images are capped at 5 MiB before this function is reached.
          return blob.arrayBuffer().then((buffer) => {
            const bytes = new Uint8Array(buffer)
            if (mimeType === 'image/png') return inspectPng(bytes)
            if (mimeType === 'image/jpeg') return inspectJpeg(bytes)
            return inspectWebp(bytes)
          })
        })()

  const resolved = await dimensions
  assertSensibleDimensions(resolved.width, resolved.height)
  return { mimeType, ...resolved }
}

export function sanitizeSvg(source: string): string {
  const sanitized = DOMPurify.sanitize(source, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed', 'audio', 'video'],
    FORBID_ATTR: ['style'],
  })

  const parsed = new DOMParser().parseFromString(sanitized, 'image/svg+xml')
  const root = parsed.documentElement
  if (root.localName !== 'svg' || parsed.querySelector('parsererror')) {
    throw new Error('Le fichier SVG est invalide.')
  }

  for (const element of Array.from(root.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (name.startsWith('on')) element.removeAttribute(attribute.name)
      if ((name === 'href' || name === 'xlink:href') && value && !value.startsWith('#')) {
        element.removeAttribute(attribute.name)
      }
      if (/url\s*\(/i.test(value) && !/url\s*\(\s*['"]?#/i.test(value)) {
        element.removeAttribute(attribute.name)
      }
    }
  }

  return new XMLSerializer().serializeToString(root)
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()

    const release = () => URL.revokeObjectURL(url)
    image.onload = () => {
      release()
      resolve(image)
    }
    image.onerror = () => {
      release()
      reject(new Error('Le navigateur ne peut pas décoder cette image.'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: 'image/webp' | 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Impossible de convertir l’image.'))),
      type,
      type === 'image/webp' ? 0.9 : undefined,
    )
  })
}

export async function normalizeImageFile(file: File): Promise<NormalizedImage> {
  validateImageFileMetadata(file)
  const detectedType = await validateImageBlob(file, file.type)

  let source: Blob = file
  if (detectedType === 'image/svg+xml') {
    source = new Blob([sanitizeSvg(await file.text())], { type: 'image/svg+xml' })
  }

  const image = await loadImage(source)
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error('Les dimensions de l’image sont invalides.')
  }

  const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * ratio))
  const height = Math.max(1, Math.round(image.naturalHeight * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('La conversion d’image n’est pas disponible dans ce navigateur.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.clearRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  let blob = await canvasToBlob(canvas, 'image/webp')
  let mimeType: NormalizedImage['mimeType'] = 'image/webp'
  if (blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/png')
    mimeType = 'image/png'
  }

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error('L’image optimisée dépasse encore la limite de 5 Mio.')
  }

  return { blob, mimeType, width, height, originalName: file.name }
}

export async function createImageAsset(file: File): Promise<ImageAssetRecord> {
  const normalized = await normalizeImageFile(file)
  return {
    id: crypto.randomUUID(),
    blob: normalized.blob,
    mimeType: normalized.mimeType,
    name: normalized.originalName,
    width: normalized.width,
    height: normalized.height,
    createdAt: new Date().toISOString(),
  }
}
