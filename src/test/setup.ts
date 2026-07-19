import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// jsdom logs a noisy "not implemented" error before returning null. Individual
// WebGL tests replace this stub with a capable context when needed.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => null,
  writable: true,
})

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => `test-${Math.random().toString(16).slice(2)}`,
    },
  })
}
