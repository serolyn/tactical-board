import { describe, expect, it } from 'vitest'
import { base64ToBlob, blobToBase64, sanitizeFilename } from './downloads'

describe('downloads', () => {
  it('produit un nom de fichier portable', () => {
    expect(sanitizeFilename('  Opération Été / Alpha  ', 'json')).toBe(
      'Operation-Ete-Alpha.json',
    )
    expect(sanitizeFilename('', 'png')).toBe('tactical-board.png')
  })

  it('convertit un blob en Base64 sans perdre les octets', async () => {
    const source = new Blob([new Uint8Array([0, 1, 127, 128, 254, 255])], { type: 'image/png' })
    const encoded = await blobToBase64(source)
    const decoded = base64ToBlob(encoded, 'image/png')

    expect(new Uint8Array(await decoded.arrayBuffer())).toEqual(
      new Uint8Array(await source.arrayBuffer()),
    )
    expect(decoded.type).toBe('image/png')
  })
})
