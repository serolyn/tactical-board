import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: '/tactical-board/',

  assetsInclude: [
    '**/*.glb',
  ],

  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(
        new URL(
          './src',
          import.meta.url,
        ),
      ),
    },

    /*
     * Empêche Vite de créer plusieurs instances de React
     * ou de React Three Fiber pendant le pré-bundling.
     *
     * Deux instances différentes entraîneraient exactement :
     * "Hooks can only be used within the Canvas component".
     */
    dedupe: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },

  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
  },
})