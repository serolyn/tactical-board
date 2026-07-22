import { readFile, writeFile } from 'node:fs/promises'

async function replaceRequired(path, pattern, replacement, label) {
  const source = await readFile(path, 'utf8')
  const next = source.replace(pattern, replacement)
  if (next === source) {
    throw new Error(`${path}: transformation introuvable pour ${label}`)
  }
  await writeFile(path, next, 'utf8')
}

await replaceRequired(
  'src/portfolio/motion/PortfolioMotionProvider.tsx',
  /<MotionConfig reducedMotion="user" transition=\{motionTransitions\.interface\}>/,
  `{/* Le portfolio conserve sa chorégraphie même si Firefox annonce par erreur un mouvement réduit. */}\n    <MotionConfig reducedMotion="never" transition={motionTransitions.interface}>`,
  'MotionConfig',
)

await replaceRequired(
  'src/portfolio/webgl/ghostSignalCapabilities.ts',
  /return capabilities\.webgl2 && !capabilities\.reducedMotion/,
  `// La préférence détectée reste visible dans le diagnostic, mais ne masque plus l’œuvre.\n  return capabilities.webgl2`,
  'éligibilité Ghost Signal',
)

await replaceRequired(
  'src/portfolio/webgl/ghostSignalCapabilities.ts',
  /\s*if \(capabilities\.reducedMotion\) return 'reduced-motion'\n(?=\s*if \(!capabilities\.webgl2\))/,
  '\n',
  'fallback reduced-motion',
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
  const source = await readFile(path, 'utf8')
  const next = source
    .replace(/, useReducedMotion/g, '')
    .replace(/useReducedMotion, /g, '')
    .replace(/\n\s*useReducedMotion,\n/g, '\n')
    .replace(/Boolean\(useReducedMotion\(\)\)/g, 'false')

  if (next === source || next.includes('useReducedMotion')) {
    throw new Error(`${path}: remplacement useReducedMotion incomplet`)
  }
  await writeFile(path, next, 'utf8')
}

await replaceRequired(
  'src/portfolio/content/MusicStory/MusicStoryOverlay.tsx',
  /\n\s*useReducedMotion,?/,
  '',
  'import useReducedMotion de Nemyl',
)

await replaceRequired(
  'src/portfolio/content/MusicStory/MusicStoryOverlay.tsx',
  /  const reducedMotion = useReducedMotion\(\);/,
  `  // Cette scène narrative fait partie de l’œuvre et reste complète dans tous les navigateurs.\n  const reducedMotion = false;`,
  'préférence de mouvement de Nemyl',
)

await replaceRequired(
  'src/portfolio/styles/portfolio.css',
  /@media \(prefers-reduced-motion: reduce\) \{\n  \.portfolio-shell \{[\s\S]*?\n\}\n\n(?=\.music-page__visual)/,
  '',
  'bloc global reduced-motion du portfolio',
)

for (const path of [
  'src/portfolio/content/MusicStory/music-story-overlay.css',
  'src/portfolio/styles/miku.css',
  'src/portfolio/experiences/sro-world/sro-world.css',
]) {
  await replaceRequired(
    path,
    /\n+@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}\s*$/,
    '\n',
    'bloc CSS reduced-motion final',
  )
}

await replaceRequired(
  'src/tests/webglFallback.test.tsx',
  /  it\('reste statique avec mouvement réduit sans évaluer le Canvas',[\s\S]*?\n  \}\)\n\n(?=  it\('utilise le fallback exact)/,
  `  it('garde Ghost Signal actif même si Firefox annonce un mouvement réduit', async () => {\n    installMotionPreference(true)\n    installWebGL(true)\n\n    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)\n\n    expect(await screen.findByTestId('ghost-canvas')).toBeInTheDocument()\n    const slot = container.querySelector('[data-webgl-state]')\n    await waitFor(() => expect(slot).toHaveAttribute('data-webgl-state', 'ready'))\n    expect(slot).toHaveAttribute('data-webgl-fallback-cause', 'none')\n    expect(slot).toHaveAttribute('data-webgl-reduced-motion', 'true')\n    expect(slot).toHaveAttribute('data-webgl2', 'true')\n  })\n\n`,
  'test reduced-motion de Ghost Signal',
)

const packagePath = 'package.json'
const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
delete pkg.scripts['docs:api']
delete pkg.scripts['docs:api:open']
delete pkg.devDependencies.typedoc
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')

await replaceRequired(
  'tsconfig.node.json',
  /"include": \["vite\.config\.ts", "vitest\.config\.ts"\]/,
  '"include": ["vite.config.ts"]',
  'référence au fichier Vitest inexistant',
)

await replaceRequired(
  '.github/workflows/deploy-pages.yml',
  /      - name: Vérifier les types\n        run: npm run typecheck\n\n/,
  `      # Le build lance déjà tsc -b, inutile de vérifier les types deux fois.\n`,
  'double typecheck du déploiement',
)

const gitignorePath = '.gitignore'
const gitignore = await readFile(gitignorePath, 'utf8')
if (!gitignore.includes('/docs/api/')) {
  await writeFile(gitignorePath, `${gitignore.trimEnd()}\n/docs/api/\n`, 'utf8')
}
