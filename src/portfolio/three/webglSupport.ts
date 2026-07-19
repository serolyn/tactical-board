interface DataSavingConnection extends EventTarget {
  readonly saveData?: boolean
}

interface NavigatorWithConnection extends Navigator {
  readonly connection?: DataSavingConnection
}

interface DisposableWebGLContext {
  getExtension(name: string): { loseContext?: () => void } | null
}

export interface GhostSignalCapabilities {
  readonly reducedMotion: boolean
  readonly saveData: boolean
  readonly webgl2: boolean
}

type CanvasFactory = () => HTMLCanvasElement

export function supportsWebGL2(
  createCanvas: CanvasFactory = () => document.createElement('canvas'),
): boolean {
  if (typeof document === 'undefined') return false

  try {
    const canvas = createCanvas()
    const context = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    }) as DisposableWebGLContext | null

    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext?.()
    return true
  } catch {
    return false
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function prefersDataSaving(): boolean {
  if (typeof navigator === 'undefined') return false
  return Boolean((navigator as NavigatorWithConnection).connection?.saveData)
}

export function readGhostSignalCapabilities(): GhostSignalCapabilities {
  const reducedMotion = prefersReducedMotion()
  const saveData = prefersDataSaving()

  return {
    reducedMotion,
    saveData,
    webgl2: reducedMotion || saveData ? false : supportsWebGL2(),
  }
}

export function canRunGhostSignal(capabilities: GhostSignalCapabilities): boolean {
  return capabilities.webgl2 && !capabilities.reducedMotion && !capabilities.saveData
}

export function getDataSavingConnection(): DataSavingConnection | undefined {
  if (typeof navigator === 'undefined') return undefined
  return (navigator as NavigatorWithConnection).connection
}
