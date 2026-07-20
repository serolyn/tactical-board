/**
 * @packageDocumentation
 * Animation du portfolio.
 *
 * Ce fichier explique comment les éléments apparaissent, se déplacent ou se
 * révèlent à l'écran. Lis-le pour comprendre pourquoi certaines transitions sont
 * visibles et d'autres très discrètes.
 */

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

/** Vocabulaire unique des entrées et sorties de pages du portfolio. */
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
