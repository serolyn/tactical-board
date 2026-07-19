import { m, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

import { getPageTransitionVariants } from './motionTokens'

type PageTransitionMotionProps = Omit<
  HTMLMotionProps<'div'>,
  'animate' | 'children' | 'exit' | 'initial' | 'onAnimationComplete' | 'variants'
>

export interface PageTransitionProps extends PageTransitionMotionProps {
  children: ReactNode
  onEntered?: () => void
  routeKey?: string
}

/** The sole page entrance/exit vocabulary used by portfolio routes. */
export function PageTransition({
  children,
  onEntered,
  routeKey,
  ...motionProps
}: PageTransitionProps) {
  const reducedMotion = Boolean(useReducedMotion())

  return (
    <m.div
      {...motionProps}
      animate="enter"
      data-portfolio-page-transition=""
      data-route-key={routeKey}
      exit="exit"
      initial="initial"
      onAnimationComplete={(definition) => {
        if (definition === 'enter') onEntered?.()
      }}
      variants={getPageTransitionVariants(reducedMotion)}
    >
      {children}
    </m.div>
  )
}
