const FALLBACK_FILENAME = 'tactical-board'

export function sanitizeFilename(value: string, extension?: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .replace(/-{2,}/g, '-')

  const basename = normalized || FALLBACK_FILENAME
  if (!extension) return basename

  const cleanExtension = extension.replace(/^\.+/, '').toLowerCase()
  return basename.toLowerCase().endsWith(`.${cleanExtension}`)
    ? basename
    : `${basename}.${cleanExtension}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.hidden = true

  document.body.append(link)
  link.click()
  link.remove()

  // Firefox needs the URL to remain alive until after the synthetic click.
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function downloadJson(value: unknown, filename: string): void {
  const json = JSON.stringify(value, null, 2)
  downloadBlob(
    new Blob([json], { type: 'application/json;charset=utf-8' }),
    sanitizeFilename(filename, 'json'),
  )
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.rel = 'noopener'
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer =
    typeof blob.arrayBuffer === 'function'
      ? await blob.arrayBuffer()
      : await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as ArrayBuffer)
          reader.onerror = () => reject(reader.error ?? new Error('Impossible de lire le fichier.'))
          reader.readAsArrayBuffer(blob)
        })
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return btoa(binary)
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  let binary: string
  try {
    binary = atob(base64)
  } catch {
    throw new Error('Les données de l’image ne sont pas un Base64 valide.')
  }

  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}
