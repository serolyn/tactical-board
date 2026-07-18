// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import {
  detectImageMimeType,
  MAX_IMAGE_BYTES,
  sanitizeSvg,
  validateImageBlob,
  validateImageFileMetadata,
} from './imageAssets'

describe('imageAssets', () => {
  it('détecte les signatures PNG, JPEG, WebP et SVG', async () => {
    const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10])])
    const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])])
    const webp = new Blob([new TextEncoder().encode('RIFF0000WEBP')])
    const svg = new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'])

    await expect(detectImageMimeType(png)).resolves.toBe('image/png')
    await expect(detectImageMimeType(jpeg)).resolves.toBe('image/jpeg')
    await expect(detectImageMimeType(webp)).resolves.toBe('image/webp')
    await expect(detectImageMimeType(svg)).resolves.toBe('image/svg+xml')
  })

  it('refuse les incohérences entre MIME déclaré et contenu', async () => {
    const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10])])
    await expect(validateImageBlob(png, 'image/jpeg')).rejects.toThrow('type MIME')
  })

  it('nettoie les scripts, événements et ressources externes des SVG', () => {
    const cleaned = sanitizeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
        <script>alert(1)</script>
        <image href="https://example.com/tracker.png" />
        <path onclick="alert(1)" d="M0 0" />
      </svg>
    `)

    expect(cleaned).not.toMatch(/script|onload|onclick|https:\/\//i)
    expect(cleaned).toContain('<path')
  })

  it('applique la limite de 5 Mio dès la sélection du fichier', () => {
    const file = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'trop-grand.png', {
      type: 'image/png',
    })
    expect(() => validateImageFileMetadata(file)).toThrow('5 Mio')
  })
})
