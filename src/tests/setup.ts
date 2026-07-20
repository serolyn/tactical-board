/**
 * @packageDocumentation
 * Tests automatiques du projet.
 *
 * Ce fichier vérifie un comportement précis pour éviter les régressions.
 * Quand tu modifies le code associé, lis ce test pour comprendre ce qui doit
 * rester vrai.
 */

import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// jsdom journalise une erreur inutile avant de renvoyer null. Les tests WebGL
// remplacent localement ce comportement par le contexte dont ils ont besoin.
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
