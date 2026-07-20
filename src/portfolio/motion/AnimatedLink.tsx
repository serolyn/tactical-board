import { m, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

import { getLinkIndicatorVariants, getLinkVariants } from './motionTokens'

const MotionRouterLink = m.create(Link)

export type AnimatedLinkIndicator = 'arrow' | 'line' | false

type MotionSafeLinkProps = Omit<
  LinkProps,
  'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'
>

export interface AnimatedLinkProps extends MotionSafeLinkProps {
  children: ReactNode
  indicator?: AnimatedLinkIndicator
}

/** La navigation interne reste immédiate ; seule sa présentation utilise Motion. */
export function AnimatedLink({
  children,
  indicator = false,
  ...linkProps
}: AnimatedLinkProps) {
  const reducedMotion = Boolean(useReducedMotion())
  const indicatorVariants = getLinkIndicatorVariants(reducedMotion)

  return (
    <MotionRouterLink
      {...linkProps}
      animate="rest"
      data-animated-link=""
      initial="rest"
      variants={getLinkVariants(reducedMotion)}
      whileFocus="active"
      whileHover="active"
      whileTap="pressed"
    >
      {children}
      {indicator === 'arrow' ? (
        <m.span aria-hidden="true" variants={indicatorVariants}>↘</m.span>
      ) : null}
      {indicator === 'line' ? (
        <m.span
          aria-hidden="true"
          data-animated-link-line=""
          style={{
            background: 'currentColor',
            display: 'block',
            height: 1,
            transformOrigin: 'left center',
            width: '1.5rem',
          }}
          variants={indicatorVariants}
        />
      ) : null}
    </MotionRouterLink>
  )
}
