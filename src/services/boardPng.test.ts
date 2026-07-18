// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { toBlobMock } = vi.hoisted(() => ({ toBlobMock: vi.fn() }))
vi.mock('html-to-image', () => ({ toBlob: toBlobMock }))

import { renderBoardToPng } from './boardPng'

describe('renderBoardToPng', () => {
  beforeEach(() => {
    toBlobMock.mockReset()
    toBlobMock.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
  })

  it('rend une copie hors écran, sans le zoom de l’éditeur', async () => {
    const board = document.createElement('section')
    board.style.transform = 'scale(1.5)'
    board.innerHTML = `
      <div data-png-hide="true">Aide de l’éditeur</div>
      <button class="unit selected" data-png-remove-class="selected">Unité</button>
      <svg><line data-png-stroke-width="3.5" data-png-opacity="0.84" stroke-width="5" opacity="1" /></svg>
    `
    Object.defineProperties(board, {
      scrollWidth: { value: 640 },
      scrollHeight: { value: 480 },
    })
    document.body.append(board)

    const result = await renderBoardToPng(board, { pixelRatio: 1 })

    expect(result.type).toBe('image/png')
    expect(toBlobMock).toHaveBeenCalledTimes(1)
    const [clone, options] = toBlobMock.mock.calls[0] as [HTMLElement, Record<string, unknown>]
    expect(clone).not.toBe(board)
    expect(clone.style.transform).toBe('none')
    expect(clone.textContent).not.toContain('Aide de l’éditeur')
    expect(clone.querySelector('button')).not.toHaveClass('selected')
    expect(clone.querySelector('line')).toHaveAttribute('stroke-width', '3.5')
    expect(clone.querySelector('line')).toHaveAttribute('opacity', '0.84')
    expect(options).toMatchObject({ width: 640, height: 480, pixelRatio: 1 })
    expect(document.body.contains(clone)).toBe(false)
  })
})
