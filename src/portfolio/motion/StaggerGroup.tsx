import { m, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

import {
  getStaggerContainerVariants,
  getStaggerItemVariants,
} from './motionTokens'
import { useViewportReveal, type ViewportRevealOptions } from './useViewportReveal'

const groupElements = {
  div: m.div,
  ol: m.ol,
  section: m.section,
  ul: m.ul,
} as const

const itemElements = {
  article: m.article,
  div: m.div,
  li: m.li,
} as const

export type StaggerGroupElement = keyof typeof groupElements
export type StaggerItemElement = keyof typeof itemElements

type StaggerMotionProps = Omit<
  HTMLMotionProps<'div'>,
  'animate' | 'children' | 'exit' | 'initial' | 'variants'
>

export interface StaggerGroupProps
  extends StaggerMotionProps,
    ViewportRevealOptions {
  as?: StaggerGroupElement
  children: ReactNode
}

export interface StaggerItemProps extends StaggerMotionProps {
  as?: StaggerItemElement
  children: ReactNode
}

/** Container variants coordinate direct StaggerItem descendants. */
export function StaggerGroup({
  as = 'div',
  children,
  disabled,
  onFocusCapture,
  once,
  root,
  rootMargin,
  threshold,
  ...motionProps
}: StaggerGroupProps) {
  const reducedMotion = Boolean(useReducedMotion())
  const { isVisible, observerAvailable, revealNow, setTarget } = useViewportReveal({
    disabled,
    once,
    root,
    rootMargin,
    threshold,
  })
  const MotionElement = groupElements[as] as typeof m.div

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
      variants={getStaggerContainerVariants(reducedMotion)}
    >
      {children}
    </MotionElement>
  )
}

export function StaggerItem({
  as = 'div',
  children,
  ...motionProps
}: StaggerItemProps) {
  const reducedMotion = Boolean(useReducedMotion())
  const MotionElement = itemElements[as] as typeof m.div

  return (
    <MotionElement
      {...motionProps}
      variants={getStaggerItemVariants(reducedMotion)}
    >
      {children}
    </MotionElement>
  )
}
