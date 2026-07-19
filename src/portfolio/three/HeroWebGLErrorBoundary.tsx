import { Component, type ErrorInfo, type ReactNode } from 'react'

interface HeroWebGLErrorBoundaryProps {
  readonly children: ReactNode
  readonly onError: () => void
}
interface HeroWebGLErrorBoundaryState {
  readonly failed: boolean
}

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
