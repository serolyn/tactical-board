/**
 * @packageDocumentation
 * Effets WebGL du portfolio.
 *
 * Ce dossier contient la partie visuelle avancée du hero: shaders, scènes et
 * fallback. Si WebGL n'est pas disponible, ces fichiers expliquent aussi quoi
 * faire à la place.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface HeroWebGLErrorBoundaryProps {
  readonly children: ReactNode
  readonly onError: () => void
}
interface HeroWebGLErrorBoundaryState {
  readonly failed: boolean
}

/** Isole les erreurs React du canvas pour préserver l'image statique du hero. */
export class HeroWebGLErrorBoundary extends Component<
  HeroWebGLErrorBoundaryProps,
  HeroWebGLErrorBoundaryState
> {
  state: HeroWebGLErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): HeroWebGLErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
