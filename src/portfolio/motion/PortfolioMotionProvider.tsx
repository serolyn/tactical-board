import { LazyMotion, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

import { motionTransitions } from './motionTokens'

const loadMotionFeatures = () =>
  import('./domAnimationFeatures').then(({ default: features }) => features)

export interface PortfolioMotionProviderProps {
  children: ReactNode
}

/** Limite Motion au portfolio afin que le plateau n'en dépende jamais. */
export function PortfolioMotionProvider({ children }: PortfolioMotionProviderProps) {
  return (
    <MotionConfig reducedMotion="user" transition={motionTransitions.interface}>
      <LazyMotion features={loadMotionFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}
