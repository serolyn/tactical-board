/**
 * @packageDocumentation
 * Effet visuel global utilisé par le routeur.
 *
 * Ce fichier contrôle une couche décorative partagée par le site. Lis-le si
 * tu veux comprendre comment le portfolio ajoute un signal visuel sans toucher
 * au contenu des pages.
 */

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import signalGlitchVideoUrl from '@/assets/effects/signal-glitch.mp4'
import './screen-glitch.css'

const GLITCH_CONFIG = {
  minBurstDelayMs: 7_000,
  maxBurstDelayMs: 16_000,
}

type BurstPhase = {
  durationMs: number
  displacement: number
  frequencyY: number
  redOffset: number
  cyanOffset: number
  videoOpacity: number
  siteShiftX: number
  siteShiftY: number
  siteSkew: number
  scanlineOpacity: number
}

// Chaque phase est une image distincte du signal, volontairement sans interpolation.
const BURST_PHASES: readonly BurstPhase[] = [
  {
    durationMs: 55,
    displacement: 18,
    frequencyY: 0.055,
    redOffset: -3,
    cyanOffset: 3,
    videoOpacity: 0.12,
    siteShiftX: -1,
    siteShiftY: 0,
    siteSkew: -0.03,
    scanlineOpacity: 0.03,
  },
  {
    durationMs: 90,
    displacement: 48,
    frequencyY: 0.1,
    redOffset: -6,
    cyanOffset: 6,
    videoOpacity: 0.12,
    siteShiftX: 4,
    siteShiftY: 0,
    siteSkew: 0.08,
    scanlineOpacity: 0.075,
  },
  {
    durationMs: 125,
    displacement: 72,
    frequencyY: 0.13,
    redOffset: -10,
    cyanOffset: 10,
    videoOpacity: 0.09,
    siteShiftX: -6,
    siteShiftY: -1,
    siteSkew: -0.14,
    scanlineOpacity: 0.12,
  },
  {
    durationMs: 55,
    displacement: 12,
    frequencyY: 0.16,
    redOffset: -2,
    cyanOffset: 2,
    videoOpacity: 0.09,
    siteShiftX: 1,
    siteShiftY: 0,
    siteSkew: 0.02,
    scanlineOpacity: 0.04,
  },
  {
    durationMs: 110,
    displacement: 58,
    frequencyY: 0.08,
    redOffset: 8,
    cyanOffset: -8,
    videoOpacity: 0.26,
    siteShiftX: 5,
    siteShiftY: 1,
    siteSkew: 0.11,
    scanlineOpacity: 0.09,
  },
  {
    durationMs: 65,
    displacement: 0,
    frequencyY: 0.1,
    redOffset: 0,
    cyanOffset: 0,
    videoOpacity: 0.1,
    siteShiftX: 0,
    siteShiftY: 0,
    siteSkew: 0,
    scanlineOpacity: 0.015,
  },
]

const ROOT_PROPERTIES = [
  '--glitch-site-x',
  '--glitch-site-y',
  '--glitch-site-skew',
] as const
/**
 * Cette fonction intervient sur le sujet “clamp” dans app.
 *
 * Fichier: src/app/effects/ScreenGlitch.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord clamp dans ScreenGlitch.tsx.
 */


function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value))
}
/**
 * Cette fonction intervient sur le sujet “random Between” dans app.
 *
 * Fichier: src/app/effects/ScreenGlitch.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord randomBetween dans ScreenGlitch.tsx.
 */


function randomBetween(minimum: number, maximum: number) {
  return minimum + Math.random() * (maximum - minimum)
}
/**
 * Cette fonction teste le sujet “editable Target” dans app.
 *
 * Fichier: src/app/effects/ScreenGlitch.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord isEditableTarget dans ScreenGlitch.tsx.
 */


function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

/**
 * Déclenche de courtes ruptures aléatoires. La vidéo reste en pause entre deux
 * ruptures et le filtre agit directement sur les pixels réels du site.
 */
export type ScreenGlitchProps = {
  enabled?: boolean
}
/**
 * Cette fonction intervient sur le sujet “screen Glitch” dans app.
 *
 * Fichier: src/app/effects/ScreenGlitch.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord ScreenGlitch dans ScreenGlitch.tsx.
 */


export function ScreenGlitch({ enabled = true }: ScreenGlitchProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const turbulenceRef = useRef<SVGFETurbulenceElement | null>(null)
  const displacementRef = useRef<SVGFEDisplacementMapElement | null>(null)
  const redOffsetRef = useRef<SVGFEOffsetElement | null>(null)
  const cyanOffsetRef = useRef<SVGFEOffsetElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    const overlay = overlayRef.current
    const video = videoRef.current
    const turbulence = turbulenceRef.current
    const displacement = displacementRef.current
    const redOffset = redOffsetRef.current
    const cyanOffset = cyanOffsetRef.current
    const appRoot = document.getElementById('root')
    const portfolioSurface = document.querySelector<HTMLElement>('[data-portfolio-scroll]')

    if (
      !overlay
      || !video
      || !turbulence
      || !displacement
      || !redOffset
      || !cyanOffset
      || !appRoot
    ) return

    const visualSurface = portfolioSurface ?? appRoot
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let mounted = true
    let running = false
    let sourceAssigned = false
    let sourceReady = false
    let burstId = 0
    let phaseTimer = 0
    let nextBurstTimer = 0
    let burstDirection = 1

    const environmentAllowsGlitch = () => (
      mounted
      && Boolean(portfolioSurface)
      && document.visibilityState === 'visible'
      && !reducedMotion.matches
    )

    const clearTimer = (timer: number) => {
      if (timer) window.clearTimeout(timer)
    }

    const resetFilter = () => {
      displacement.setAttribute('scale', '0')
      redOffset.setAttribute('dx', '0')
      cyanOffset.setAttribute('dx', '0')
    }

    const clearRootVisuals = () => {
      visualSurface.classList.remove('screen-glitch-filtering')

      for (const property of ROOT_PROPERTIES) {
        visualSurface.style.removeProperty(property)
      }
    }

    const applyPhase = (
      phase: BurstPhase,
      strength: number,
      phaseIndex: number,
    ) => {
      const visualStrength = 0.72 + strength * 0.28
      const direction = burstDirection
      const seed = Math.floor(Math.random() * 900 + phaseIndex * 37)

      turbulence.setAttribute(
        'baseFrequency',
        `0.0015 ${(phase.frequencyY * visualStrength).toFixed(4)}`,
      )
      turbulence.setAttribute('seed', String(seed))
      displacement.setAttribute(
        'scale',
        (phase.displacement * visualStrength).toFixed(2),
      )
      redOffset.setAttribute(
        'dx',
        (phase.redOffset * visualStrength * direction).toFixed(2),
      )
      cyanOffset.setAttribute(
        'dx',
        (phase.cyanOffset * visualStrength * direction).toFixed(2),
      )

      visualSurface.style.setProperty(
        '--glitch-site-x',
        `${(phase.siteShiftX * visualStrength * direction).toFixed(2)}px`,
      )
      visualSurface.style.setProperty(
        '--glitch-site-y',
        `${(phase.siteShiftY * visualStrength).toFixed(2)}px`,
      )
      visualSurface.style.setProperty(
        '--glitch-site-skew',
        `${(phase.siteSkew * visualStrength * direction).toFixed(3)}deg`,
      )

      overlay.style.setProperty(
        '--glitch-video-opacity',
        (phase.videoOpacity * visualStrength).toFixed(3),
      )
      overlay.style.setProperty(
        '--glitch-scanline-opacity',
        (phase.scanlineOpacity * visualStrength).toFixed(3),
      )
    }

    const finishBurst = (finishedBurstId: number) => {
      if (!mounted || finishedBurstId !== burstId) return

      clearTimer(phaseTimer)
      phaseTimer = 0
      running = false
      resetFilter()
      visualSurface.classList.remove('screen-glitch-filtering')
      overlay.classList.remove('screen-glitch--active')
      overlay.style.setProperty('--glitch-video-opacity', '0')
      overlay.style.setProperty('--glitch-scanline-opacity', '0')

      visualSurface.style.removeProperty('--glitch-site-x')
      visualSurface.style.removeProperty('--glitch-site-y')
      visualSurface.style.removeProperty('--glitch-site-skew')

      scheduleNextBurst()
    }

    const runPhase = (
      phaseIndex: number,
      strength: number,
      currentBurstId: number,
    ) => {
      if (!mounted || currentBurstId !== burstId || !running) return

      if (phaseIndex >= BURST_PHASES.length) {
        finishBurst(currentBurstId)
        return
      }

      const phase = BURST_PHASES[phaseIndex]
      applyPhase(phase, strength, phaseIndex)
      phaseTimer = window.setTimeout(
        () => runPhase(phaseIndex + 1, strength, currentBurstId),
        phase.durationMs,
      )
    }

    const triggerBurst = (strength: number) => {
      if (
        !environmentAllowsGlitch()
        || running
        || !sourceReady
      ) return

      clearTimer(nextBurstTimer)
      nextBurstTimer = 0
      running = true
      burstDirection = Math.random() < 0.5 ? -1 : 1
      const currentBurstId = ++burstId
      visualSurface.classList.add('screen-glitch-filtering')

      video.playbackRate = 0.88 + strength * 0.24
      overlay.style.setProperty(
        '--glitch-video-mirror',
        Math.random() < 0.5 ? '-1' : '1',
      )
      overlay.style.setProperty(
        '--glitch-video-position',
        `${[45, 50, 55][Math.floor(Math.random() * 3)]}%`,
      )
      overlay.classList.add('screen-glitch--active')
      void video.play().catch(() => {
        // Le filtre du site reste fonctionnel même si la vidéo ne démarre pas.
      })

      runPhase(0, clamp(strength, 0.55, 1), currentBurstId)
    }

    const scheduleNextBurst = () => {
      clearTimer(nextBurstTimer)
      nextBurstTimer = 0
      if (
        !environmentAllowsGlitch()
        || running
        || !sourceReady
      ) return

      nextBurstTimer = window.setTimeout(() => {
        nextBurstTimer = 0
        triggerBurst(randomBetween(0.65, 1))
      }, randomBetween(
        GLITCH_CONFIG.minBurstDelayMs,
        GLITCH_CONFIG.maxBurstDelayMs,
      ))
    }

    const stopEverything = () => {
      burstId += 1
      running = false
      clearTimer(phaseTimer)
      clearTimer(nextBurstTimer)
      phaseTimer = 0
      nextBurstTimer = 0
      resetFilter()
      clearRootVisuals()
      overlay.classList.remove('screen-glitch--active')
      overlay.style.setProperty('--glitch-video-opacity', '0')
      overlay.style.setProperty('--glitch-scanline-opacity', '0')
      video.pause()
    }
    const prepareNextVideoFragment = () => {
    video.pause()

    if (Number.isFinite(video.duration) && video.duration > 1) {
    // Garde une marge pour éviter que la vidéo se termine pendant le glitch.
    const latestStart = Math.max(0, video.duration - 0.8)
    video.currentTime = randomBetween(0, latestStart)
  }
}
    const assignVideoSource = () => {
      if (!mounted || sourceAssigned || reducedMotion.matches) return

      sourceAssigned = true
      sourceReady = false
      video.preload = 'auto'
      video.loop = false
      video.src = signalGlitchVideoUrl
      video.load()
    }

    const unloadVideo = () => {
      sourceAssigned = false
      sourceReady = false
      video.pause()
      video.removeAttribute('src')
      video.preload = 'none'
      video.load()
    }

    const handleVideoReady = () => {
      const becameReady = !sourceReady
      sourceReady = true
      if (becameReady) {prepareNextVideoFragment()
        scheduleNextBurst()
      } 
    }

    const handleVideoError = () => {
      sourceReady = false
      overlay.classList.remove('screen-glitch--active')
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        stopEverything()
        return
      }

      if (!sourceAssigned) assignVideoSource()
      else {
        void video.play().catch(() => {
          // La vidéo muette reste préchargée entre deux rafales.
        })
        scheduleNextBurst()
      }
    }

    const handleReducedMotionChange = () => {
      stopEverything()
      if (reducedMotion.matches) unloadVideo()
      else {
        if (!sourceAssigned) assignVideoSource()
        else {
          void video.play().catch(() => {
            // La vidéo muette reste préchargée entre deux rafales.
          })
          scheduleNextBurst()
        }
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !import.meta.env.DEV
        || event.repeat
        || event.key.toLowerCase() !== 'g'
        || isEditableTarget(event.target)
      ) return

      triggerBurst(1)
    }

    video.addEventListener('canplay', handleVideoReady)
    video.addEventListener('error', handleVideoError)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('keydown', handleKeyDown)
    reducedMotion.addEventListener('change', handleReducedMotionChange)

    resetFilter()
    if (portfolioSurface && !reducedMotion.matches) {
      assignVideoSource()
    }

    return () => {
      mounted = false
      stopEverything()
      video.removeEventListener('canplay', handleVideoReady)
      video.removeEventListener('error', handleVideoError)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('keydown', handleKeyDown)
      reducedMotion.removeEventListener('change', handleReducedMotionChange)
      clearRootVisuals()
      unloadVideo()
    }
  }, [enabled])

  if (!enabled) return null

  return createPortal(
    <>
      <svg
        aria-hidden="true"
        className="screen-glitch__filters"
        focusable="false"
        height="0"
        width="0"
      >
        <defs>
          <filter
            id="screen-glitch-filter"
            x="-12%"
            y="-8%"
            width="124%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              ref={turbulenceRef}
              type="fractalNoise"
              baseFrequency="0.0015 0.1"
              numOctaves={1}
              seed={1}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values={`
                1 0 0 0 0
                0 0 0 0 0.5
                0 0 0 0 0
                0 0 0 1 0
              `}
              result="horizontalNoise"
            />
            <feComponentTransfer in="horizontalNoise" result="steppedNoise">
              <feFuncR
                type="discrete"
                tableValues="0 0.12 0.33 0.5 0.68 0.88 1"
              />
              <feFuncG type="identity" />
            </feComponentTransfer>
            <feDisplacementMap
              ref={displacementRef}
              in="SourceGraphic"
              in2="steppedNoise"
              scale={0}
              xChannelSelector="R"
              yChannelSelector="G"
              result="tornImage"
            />
            <feColorMatrix
              in="tornImage"
              type="matrix"
              values={`
                1 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 1 0
              `}
              result="redChannel"
            />
            <feOffset
              ref={redOffsetRef}
              in="redChannel"
              dx={0}
              dy={0}
              result="shiftedRed"
            />
            <feColorMatrix
              in="tornImage"
              type="matrix"
              values={`
                0 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 1 0
              `}
              result="cyanChannel"
            />
            <feOffset
              ref={cyanOffsetRef}
              in="cyanChannel"
              dx={0}
              dy={0}
              result="shiftedCyan"
            />
            <feBlend in="shiftedRed" in2="shiftedCyan" mode="screen" />
          </filter>
        </defs>
      </svg>

      <div ref={overlayRef} aria-hidden="true" className="screen-glitch">
        <video
          ref={videoRef}
          aria-hidden="true"
          className="screen-glitch__video"
          muted
          playsInline
          preload="none"
          tabIndex={-1}
        />
        <div className="screen-glitch__scanlines" />
      </div>
    </>,
    document.body,
  )
}
