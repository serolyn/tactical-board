import { readFile, writeFile } from 'node:fs/promises'

async function replaceExact(path, before, after) {
  const source = await readFile(path, 'utf8')
  const count = source.split(before).length - 1
  if (count !== 1) {
    throw new Error(`${path}: remplacement attendu une fois, trouvé ${count}`)
  }
  await writeFile(path, source.replace(before, after), 'utf8')
}

await replaceExact(
  'src/portfolio/motion/PortfolioMotionProvider.tsx',
  '<MotionConfig reducedMotion="user" transition={motionTransitions.interface}>',
  `{/* Le portfolio conserve sa chorégraphie même si Firefox annonce par erreur un mouvement réduit. */}\n    <MotionConfig reducedMotion="never" transition={motionTransitions.interface}>`,
)

await replaceExact(
  'src/portfolio/webgl/ghostSignalCapabilities.ts',
  'return capabilities.webgl2 && !capabilities.reducedMotion',
  `// La préférence détectée reste visible dans le diagnostic, mais ne masque plus l’œuvre.\n  return capabilities.webgl2`,
)

await replaceExact(
  'src/portfolio/webgl/ghostSignalCapabilities.ts',
  `  if (capabilities.reducedMotion) return 'reduced-motion'\n  if (!capabilities.webgl2) return 'webgl2-unavailable'`,
  `  if (!capabilities.webgl2) return 'webgl2-unavailable'`,
)

const motionFiles = [
  'src/portfolio/motion/AnimatedLink.tsx',
  'src/portfolio/motion/PageTransition.tsx',
  'src/portfolio/motion/Reveal.tsx',
  'src/portfolio/motion/StaggerGroup.tsx',
  'src/portfolio/motion/AnimatedRoutes.tsx',
  'src/portfolio/pages/PortfolioHomePage.tsx',
]

for (const path of motionFiles) {
  let source = await readFile(path, 'utf8')
  if (!source.includes('useReducedMotion')) {
    throw new Error(`${path}: useReducedMotion introuvable`)
  }
  source = source
    .replace(/, useReducedMotion/g, '')
    .replace(/useReducedMotion, /g, '')
    .replace(/\n\s*useReducedMotion,\n/g, '\n')
    .replace(/Boolean\(useReducedMotion\(\)\)/g, 'false')

  if (source.includes('useReducedMotion')) {
    throw new Error(`${path}: une référence useReducedMotion subsiste`)
  }
  await writeFile(path, source, 'utf8')
}

await replaceExact(
  'src/portfolio/content/MusicStory/MusicStoryOverlay.tsx',
  `import {\n  useAnimate,\n  useInView,\n  useReducedMotion,\n} from "motion/react";`,
  `import {\n  useAnimate,\n  useInView,\n} from "motion/react";`,
)

await replaceExact(
  'src/portfolio/content/MusicStory/MusicStoryOverlay.tsx',
  '  const reducedMotion = useReducedMotion();',
  `  // Cette scène narrative fait partie de l’œuvre et reste complète dans tous les navigateurs.\n  const reducedMotion = false;`,
)

await replaceExact(
  'src/portfolio/styles/portfolio.css',
  `@media (prefers-reduced-motion: reduce) {\n  .portfolio-shell {\n    scroll-behavior: auto;\n  }\n\n  .portfolio-shell *,\n  .portfolio-shell *::before,\n  .portfolio-shell *::after {\n    scroll-behavior: auto !important;\n    transition-duration: 0.01ms !important;\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n  }\n\n  .hero-visual-slot__future {\n    display: none;\n  }\n}\n\n`,
  '',
)

await replaceExact(
  'src/portfolio/content/MusicStory/music-story-overlay.css',
  `\n@media (prefers-reduced-motion: reduce) {\n  .arrow-flight,\n  .crow-impact {\n    display: none;\n  }\n\n  .rose,\n  .crow {\n    will-change: auto;\n  }\n}\n`,
  '\n',
)

await replaceExact(
  'src/portfolio/styles/miku.css',
  `\n@media (prefers-reduced-motion: reduce) {\n  .music-glb-scene__grain,\n  .music-glb-loading-signal {\n    animation: none;\n  }\n}\n`,
  '\n',
)

await replaceExact(
  'src/portfolio/experiences/sro-world/sro-world.css',
  `\n@media (prefers-reduced-motion: reduce) {\n  .sro-world-page__grain,\n  .sro-world-page__loading span {\n    animation: none;\n  }\n}\n`,
  '\n',
)

await replaceExact(
  'src/tests/webglFallback.test.tsx',
  `  it('reste statique avec mouvement réduit sans évaluer le Canvas', async () => {\n    installMotionPreference(true)\n    installWebGL(true)\n\n    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)\n    const slot = container.querySelector('[data-webgl-state]')\n\n    await waitFor(() => expect(slot).toHaveAttribute('data-webgl-state', 'fallback'))\n    expect(slot).toHaveAttribute('data-webgl-fallback-cause', 'reduced-motion')\n    expect(slot).toHaveAttribute('data-webgl2', 'true')\n    expect(screen.getByRole('img', { name: 'Ciel nocturne' })).toBeInTheDocument()\n    expect(dynamicModuleEvaluated).not.toHaveBeenCalled()\n  })`,
  `  it('garde Ghost Signal actif même si Firefox annonce un mouvement réduit', async () => {\n    installMotionPreference(true)\n    installWebGL(true)\n\n    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)\n\n    expect(await screen.findByTestId('ghost-canvas')).toBeInTheDocument()\n    const slot = container.querySelector('[data-webgl-state]')\n    await waitFor(() => expect(slot).toHaveAttribute('data-webgl-state', 'ready'))\n    expect(slot).toHaveAttribute('data-webgl-fallback-cause', 'none')\n    expect(slot).toHaveAttribute('data-webgl-reduced-motion', 'true')\n    expect(slot).toHaveAttribute('data-webgl2', 'true')\n  })`,
)

const packagePath = 'package.json'
const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
delete pkg.scripts['docs:api']
delete pkg.scripts['docs:api:open']
delete pkg.devDependencies.typedoc
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')

const tsconfigPath = 'tsconfig.node.json'
const tsconfig = await readFile(tsconfigPath, 'utf8')
if (!tsconfig.includes('"include": ["vite.config.ts", "vitest.config.ts"]')) {
  throw new Error('tsconfig.node.json: include attendu introuvable')
}
await writeFile(
  tsconfigPath,
  tsconfig.replace(
    '"include": ["vite.config.ts", "vitest.config.ts"]',
    '"include": ["vite.config.ts"]',
  ),
  'utf8',
)

const workflowPath = '.github/workflows/deploy-pages.yml'
const workflow = await readFile(workflowPath, 'utf8')
const duplicateTypecheck = `      - name: Vérifier les types\n        run: npm run typecheck\n\n`
if (!workflow.includes(duplicateTypecheck)) {
  throw new Error('deploy-pages.yml: double typecheck introuvable')
}
await writeFile(
  workflowPath,
  workflow.replace(
    duplicateTypecheck,
    `      # Le build lance déjà tsc -b, inutile de vérifier les types deux fois.\n`,
  ),
  'utf8',
)

const gitignorePath = '.gitignore'
const gitignore = await readFile(gitignorePath, 'utf8')
if (!gitignore.includes('/docs/api/')) {
  await writeFile(gitignorePath, `${gitignore.trimEnd()}\n/docs/api/\n`, 'utf8')
}
