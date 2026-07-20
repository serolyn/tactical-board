#!/usr/bin/env node

import { copyFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(scriptDirectory, '..')
const sourcePath = path.join(projectDirectory, 'dist', 'index.html')
const fallbackPath = path.join(projectDirectory, 'dist', '404.html')

try {
  const source = await stat(sourcePath)

  if (!source.isFile()) {
    throw new Error(`Le fichier source n'est pas un fichier régulier : ${sourcePath}`)
  }

  await copyFile(sourcePath, fallbackPath)
  console.log('[spa-fallback] dist/404.html créé à partir de dist/index.html.')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)

  console.error('[spa-fallback] Échec de la création du fallback GitHub Pages.')
  console.error(`[spa-fallback] ${message}`)
  console.error('[spa-fallback] Exécutez d’abord le build Vite pour générer dist/index.html.')
  process.exitCode = 1
}
