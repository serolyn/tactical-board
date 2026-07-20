import type { Transition, Variants } from 'motion/react'

export const motionDurations = {
  fast: 0.18,
  interface: 0.32,
  page: 0.48,
  reveal: 0.64,
  reduced: 0.14,
} as const

export const motionDistances = {
  pageEnter: 16,
  pageExit: -6,
  reveal: 18,
  link: 4,
} as const

export const motionStaggers = {
  editorial: 0.065,
  hero: 0.07,
} as const

export const motionEasings = {
  enter: [0.22, 1, 0.36, 1],
  exit: [0.4, 0, 1, 1],
  standard: [0.25, 0.1, 0.25, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

export const motionTransitions = {
  fast: {
    duration: motionDurations.fast,
    ease: motionEasings.standard,
  },
  interface: {
    duration: motionDurations.interface,
    ease: motionEasings.enter,
  },
  page: {
    duration: motionDurations.page,
    ease: motionEasings.enter,
  },
  reveal: {
    duration: motionDurations.reveal,
    ease: motionEasings.enter,
  },
  reduced: {
    duration: motionDurations.reduced,
    ease: motionEasings.standard,
  },
} as const satisfies Record<string, Transition>

/**
 * Les transitions de pages restent sobres. Le mode mouvement réduit ne joue
 * que sur l'opacité, sans demander à Motion de neutraliser des transformations.
 */
export function getPageTransitionVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      initial: { opacity: 0 },
      enter: { opacity: 1, transition: motionTransitions.reduced },
      exit: { opacity: 0, transition: motionTransitions.reduced },
    }
  }

  return {
    initial: {
      opacity: 0,
      y: motionDistances.pageEnter,
      filter: 'blur(3px)',
    },
    enter: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: motionTransitions.page,
    },
    exit: {
      opacity: 0,
      y: motionDistances.pageExit,
      filter: 'blur(2px)',
      transition: {
        duration: motionDurations.interface,
        ease: motionEasings.exit,
      },
    },
  }
}

export function getRevealVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: motionTransitions.reduced },
    }
  }

  return {
    hidden: { opacity: 0, y: motionDistances.reveal },
    visible: {
      opacity: 1,
      y: 0,
      transition: motionTransitions.reveal,
    },
  }
}

export function getStaggerContainerVariants(reducedMotion: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        delayChildren: reducedMotion ? 0 : motionStaggers.editorial,
        staggerChildren: reducedMotion ? 0 : motionStaggers.editorial,
      },
    },
  }
}

export function getStaggerItemVariants(reducedMotion: boolean): Variants {
  return getRevealVariants(reducedMotion)
}

export function getHeroArrivalVariants(
  reducedMotion: boolean,
  order: number,
): Variants {
  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: motionTransitions.reduced },
    }
  }

  return {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ...motionTransitions.page,
        delay: 0.05 + order * motionStaggers.hero,
      },
    },
  }
}

export function getHeroSignalVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) return getHeroArrivalVariants(true, 0)

  return {
    hidden: { opacity: 0, scaleY: 0 },
    visible: {
      opacity: 1,
      scaleY: 1,
      transition: {
        ...motionTransitions.interface,
        delay: 0.05 + 6 * motionStaggers.hero,
      },
    },
  }
}

export function getLinkVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      rest: { opacity: 1 },
      active: { opacity: 0.82, transition: motionTransitions.reduced },
      pressed: { opacity: 0.68, transition: motionTransitions.reduced },
    }
  }

  return {
    rest: { opacity: 1 },
    active: { opacity: 0.9, transition: motionTransitions.fast },
    pressed: { opacity: 0.72, transition: motionTransitions.fast },
  }
}

export function getLinkIndicatorVariants(reducedMotion: boolean): Variants {
  if (reducedMotion) {
    return {
      rest: { opacity: 0.72 },
      active: { opacity: 1, transition: motionTransitions.reduced },
      pressed: { opacity: 1, transition: motionTransitions.reduced },
    }
  }

  return {
    rest: { opacity: 0.72, x: 0, scaleX: 0.72 },
    active: {
      opacity: 1,
      x: motionDistances.link,
      scaleX: 1,
      transition: motionTransitions.fast,
    },
    pressed: {
      opacity: 1,
      x: Math.max(1, motionDistances.link / 2),
      scaleX: 0.9,
      transition: motionTransitions.fast,
    },
  }
}
