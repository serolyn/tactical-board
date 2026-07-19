import { describe, expect, it } from 'vitest'

import {
  getLinkIndicatorVariants,
  getPageTransitionVariants,
  getRevealVariants,
  getStaggerContainerVariants,
  motionDurations,
  motionStaggers,
} from './motionTokens'

function target(
  variants: ReturnType<typeof getPageTransitionVariants>,
  name: string,
) {
  const value = variants[name]
  if (!value || typeof value === 'function') {
    throw new Error(`La variante ${name} doit être un objet statique.`)
  }
  return value as Record<string, unknown>
}

describe('tokens Motion du portfolio', () => {
  it('reste dans les plages de durée sobres du cahier des charges', () => {
    expect(motionDurations.fast).toBeGreaterThanOrEqual(0.16)
    expect(motionDurations.fast).toBeLessThanOrEqual(0.22)
    expect(motionDurations.interface).toBeGreaterThanOrEqual(0.28)
    expect(motionDurations.interface).toBeLessThanOrEqual(0.36)
    expect(motionDurations.page).toBeGreaterThanOrEqual(0.42)
    expect(motionDurations.page).toBeLessThanOrEqual(0.52)
    expect(motionDurations.reveal).toBeGreaterThanOrEqual(0.55)
    expect(motionDurations.reveal).toBeLessThanOrEqual(0.75)
    expect(motionStaggers.editorial).toBeGreaterThanOrEqual(0.05)
    expect(motionStaggers.editorial).toBeLessThanOrEqual(0.08)
  })

  it('limite la transition de page au déplacement et au flou autorisés', () => {
    const variants = getPageTransitionVariants(false)

    expect(target(variants, 'initial')).toMatchObject({
      filter: 'blur(3px)',
      opacity: 0,
      y: 16,
    })
    expect(target(variants, 'exit')).toMatchObject({
      filter: 'blur(2px)',
      opacity: 0,
      y: -6,
    })
  })

  it('emploie exclusivement de courts fondus quand le mouvement est réduit', () => {
    const page = getPageTransitionVariants(true)
    const reveal = getRevealVariants(true)
    const indicator = getLinkIndicatorVariants(true)

    for (const state of ['initial', 'enter', 'exit']) {
      expect(target(page, state)).not.toHaveProperty('y')
      expect(target(page, state)).not.toHaveProperty('filter')
    }
    expect(target(reveal, 'hidden')).not.toHaveProperty('y')
    expect(target(indicator, 'active')).not.toHaveProperty('x')
    expect(target(indicator, 'active')).not.toHaveProperty('scaleX')
  })

  it('supprime le stagger avec reduced-motion sans le supprimer en mode normal', () => {
    const regular = target(getStaggerContainerVariants(false), 'visible')
    const reduced = target(getStaggerContainerVariants(true), 'visible')

    expect(regular.transition).toMatchObject({
      staggerChildren: motionStaggers.editorial,
    })
    expect(reduced.transition).toMatchObject({
      delayChildren: 0,
      staggerChildren: 0,
    })
  })
})
