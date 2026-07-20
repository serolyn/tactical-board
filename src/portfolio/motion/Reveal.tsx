import { m, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

import { getRevealVariants } from './motionTokens'
import { useViewportReveal, type ViewportRevealOptions } from './useViewportReveal'

const revealElements = {
  article: m.article,
  aside: m.aside,
  div: m.div,
  figure: m.figure,
  header: m.header,
  li: m.li,
  section: m.section,
} as const

export type RevealElement = keyof typeof revealElements

type RevealMotionProps = Omit<
  HTMLMotionProps<'div'>,
  'animate' | 'children' | 'exit' | 'initial' | 'variants'
>

export interface RevealProps extends RevealMotionProps, ViewportRevealOptions {
  as?: RevealElement
  children: ReactNode
}

/** Révélation éditoriale unique, visible par défaut si l'observation est indisponible. */
export function Reveal({
  as = 'div',
  children,
  disabled,
  onFocusCapture,
  once,
  root,
  rootMargin,
  threshold,
  ...motionProps
}: RevealProps) {
  const reducedMotion = Boolean(useReducedMotion())
  const { isVisible, observerAvailable, revealNow, setTarget } = useViewportReveal({
    disabled,
    once,
    root,
    rootMargin,
    threshold,
  })
  const MotionElement = revealElements[as] as typeof m.div

  return (
    <MotionElement
      {...motionProps}
      animate={isVisible ? 'visible' : 'hidden'}
      data-motion-state={isVisible ? 'visible' : 'hidden'}
      initial={observerAvailable ? 'hidden' : 'visible'}
      onFocusCapture={(event) => {
        revealNow()
        onFocusCapture?.(event)
      }}
      ref={setTarget}
      variants={getRevealVariants(reducedMotion)}
    >
      {children}
    </MotionElement>
  )
}
