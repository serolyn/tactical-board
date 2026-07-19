#!/usr/bin/env node

import { copyFile, cp, mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDirectory = path.dirname(scriptPath)
const projectDirectory = path.resolve(scriptDirectory, '..')

const defaultSourceDirectory = path.join(projectDirectory, 'docs', 'art-direction')
const defaultDestinationDirectory = path.join(projectDirectory, 'dist', 'art-direction')

export async function copyArtDirection({
  sourceDirectory = defaultSourceDirectory,
  destinationDirectory = defaultDestinationDirectory,
  manifestSource = path.join(path.dirname(sourceDirectory), 'ASSET_MANIFEST.md'),
  manifestDestination = path.join(path.dirname(destinationDirectory), 'ASSET_MANIFEST.md'),
} = {}) {
  const source = await stat(sourceDirectory)

  if (!source.isDirectory()) {
    throw new Error(`La source n'est pas un dossier : ${sourceDirectory}`)
  }

  await rm(destinationDirectory, { recursive: true, force: true })
  await mkdir(path.dirname(destinationDirectory), { recursive: true })
  await cp(sourceDirectory, destinationDirectory, { recursive: true })
  await copyFile(manifestSource, manifestDestination)

  console.log(
    `[art-direction] ${path.relative(projectDirectory, sourceDirectory)} copié vers ${path.relative(projectDirectory, destinationDirectory)}.`,
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    await copyArtDirection()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    console.error('[art-direction] Échec de la copie de la planche autonome.')
    console.error(`[art-direction] ${message}`)
    console.error('[art-direction] Vérifiez que docs/art-direction existe avant le build.')
    process.exitCode = 1
  }
}
