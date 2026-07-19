import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { copyArtDirection } from './copy-art-direction.mjs'

test('copie la planche autonome, son manifeste et remplace une destination obsolète', async (context) => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'tactical-board-art-direction-'))
  context.after(() => rm(temporaryDirectory, { recursive: true, force: true }))

  const sourceDirectory = path.join(temporaryDirectory, 'docs', 'art-direction')
  const destinationDirectory = path.join(temporaryDirectory, 'dist', 'art-direction')
  const manifestSource = path.join(temporaryDirectory, 'docs', 'ASSET_MANIFEST.md')
  const manifestDestination = path.join(temporaryDirectory, 'dist', 'ASSET_MANIFEST.md')

  await mkdir(path.join(sourceDirectory, 'assets', 'fonts'), { recursive: true })
  await mkdir(destinationDirectory, { recursive: true })
  await writeFile(path.join(sourceDirectory, 'index.html'), '<main>SEROLYN</main>')
  await writeFile(path.join(sourceDirectory, 'assets', 'fonts', 'signal.woff2'), 'font-data')
  await writeFile(manifestSource, '# Provenance')
  await writeFile(path.join(destinationDirectory, 'obsolete.txt'), 'ancien build')

  await copyArtDirection({
    sourceDirectory,
    destinationDirectory,
    manifestSource,
    manifestDestination,
  })

  assert.equal(await readFile(path.join(destinationDirectory, 'index.html'), 'utf8'), '<main>SEROLYN</main>')
  assert.equal(
    await readFile(path.join(destinationDirectory, 'assets', 'fonts', 'signal.woff2'), 'utf8'),
    'font-data',
  )
  await assert.rejects(stat(path.join(destinationDirectory, 'obsolete.txt')), { code: 'ENOENT' })
  assert.equal(await readFile(path.join(sourceDirectory, 'index.html'), 'utf8'), '<main>SEROLYN</main>')
  assert.equal(await readFile(manifestDestination, 'utf8'), '# Provenance')
})
