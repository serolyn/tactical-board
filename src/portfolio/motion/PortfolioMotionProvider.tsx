/**
 * @packageDocumentation
 * Animation du portfolio.
 *
 * Ce fichier explique comment les éléments apparaissent, se déplacent ou se
 * révèlent à l'écran. Lis-le pour comprendre pourquoi certaines transitions sont
 * visibles et d'autres très discrètes.
 */

import { LazyMotion, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

import { motionTransitions } from './motionTokens'
/**
 * Cette fonction charge le sujet “motion Features” dans portfolio.
 *
 * Fichier: src/portfolio/motion/PortfolioMotionProvider.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord loadMotionFeatures dans PortfolioMotionProvider.tsx.
 */


const loadMotionFeatures = () =>
  import('./domAnimationFeatures').then(({ default: features }) => features)

export interface PortfolioMotionProviderProps {
  children: ReactNode
}

/** Limite Motion au portfolio afin que le plateau n'en dépende jamais. */
export function PortfolioMotionProvider({ children }: PortfolioMotionProviderProps) {
  return (
    <MotionConfig reducedMotion="never" transition={motionTransitions.interface}>
      <LazyMotion features={loadMotionFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}
