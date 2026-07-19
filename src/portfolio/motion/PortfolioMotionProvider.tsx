import { LazyMotion, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

import { motionTransitions } from './motionTokens'

const loadMotionFeatures = () =>
  import('./motionFeatures').then(({ default: features }) => features)

export interface PortfolioMotionProviderProps {
  children: ReactNode
}

/** Motion is scoped to the portfolio shell and never becomes a board dependency. */
export function PortfolioMotionProvider({ children }: PortfolioMotionProviderProps) {
  return (
    <MotionConfig reducedMotion="user" transition={motionTransitions.interface}>
      <LazyMotion features={loadMotionFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}
