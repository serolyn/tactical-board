import { readFile, writeFile } from 'node:fs/promises'

const checks = []

async function count(path, label, expected) {
  const source = await readFile(path, 'utf8')
  checks.push(`${label}: ${source.split(expected).length - 1}`)
}

await count(
  'src/portfolio/motion/PortfolioMotionProvider.tsx',
  'motion config',
  '<MotionConfig reducedMotion="user" transition={motionTransitions.interface}>',
)
await count(
  'src/portfolio/webgl/ghostSignalCapabilities.ts',
  'ghost eligibility',
  'return capabilities.webgl2 && !capabilities.reducedMotion',
)
await count(
  'src/portfolio/webgl/ghostSignalCapabilities.ts',
  'ghost fallback',
  `  if (capabilities.reducedMotion) return 'reduced-motion'\n  if (!capabilities.webgl2) return 'webgl2-unavailable'`,
)

for (const path of [
  'src/portfolio/motion/AnimatedLink.tsx',
  'src/portfolio/motion/PageTransition.tsx',
  'src/portfolio/motion/Reveal.tsx',
  'src/portfolio/motion/StaggerGroup.tsx',
  'src/portfolio/motion/AnimatedRoutes.tsx',
  'src/portfolio/pages/PortfolioHomePage.tsx',
]) {
  const source = await readFile(path, 'utf8')
  checks.push(`${path} useReducedMotion: ${(source.match(/useReducedMotion/g) ?? []).length}`)
}

await count(
  'src/portfolio/content/MusicStory/MusicStoryOverlay.tsx',
  'music story import',
  `import {\n  useAnimate,\n  useInView,\n  useReducedMotion,\n} from "motion/react";`,
)
await count(
  'src/portfolio/content/MusicStory/MusicStoryOverlay.tsx',
  'music story reduced constant',
  '  const reducedMotion = useReducedMotion();',
)
await count(
  'src/portfolio/styles/portfolio.css',
  'portfolio reduced css',
  `@media (prefers-reduced-motion: reduce) {\n  .portfolio-shell {\n    scroll-behavior: auto;\n  }\n\n  .portfolio-shell *,\n  .portfolio-shell *::before,\n  .portfolio-shell *::after {\n    scroll-behavior: auto !important;\n    transition-duration: 0.01ms !important;\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n  }\n\n  .hero-visual-slot__future {\n    display: none;\n  }\n}\n\n`,
)
await count(
  'src/portfolio/content/MusicStory/music-story-overlay.css',
  'music story reduced css',
  `\n@media (prefers-reduced-motion: reduce) {\n  .arrow-flight,\n  .crow-impact {\n    display: none;\n  }\n\n  .rose,\n  .crow {\n    will-change: auto;\n  }\n}\n`,
)
await count(
  'src/portfolio/styles/miku.css',
  'miku reduced css',
  `\n@media (prefers-reduced-motion: reduce) {\n  .music-glb-scene__grain,\n  .music-glb-loading-signal {\n    animation: none;\n  }\n}\n`,
)
await count(
  'src/portfolio/experiences/sro-world/sro-world.css',
  'sro reduced css',
  `\n@media (prefers-reduced-motion: reduce) {\n  .sro-world-page__grain,\n  .sro-world-page__loading span {\n    animation: none;\n  }\n}\n`,
)
await count(
  'src/tests/webglFallback.test.tsx',
  'webgl reduced test',
  `  it('reste statique avec mouvement réduit sans évaluer le Canvas', async () => {\n    installMotionPreference(true)\n    installWebGL(true)\n\n    const { container } = render(<HeroVisualSlot alt="Ciel nocturne" src="/sky.webp" />)\n    const slot = container.querySelector('[data-webgl-state]')\n\n    await waitFor(() => expect(slot).toHaveAttribute('data-webgl-state', 'fallback'))\n    expect(slot).toHaveAttribute('data-webgl-fallback-cause', 'reduced-motion')\n    expect(slot).toHaveAttribute('data-webgl2', 'true')\n    expect(screen.getByRole('img', { name: 'Ciel nocturne' })).toBeInTheDocument()\n    expect(dynamicModuleEvaluated).not.toHaveBeenCalled()\n  })`,
)

await writeFile('visual-cleanup-diagnostic.txt', `${checks.join('\n')}\n`, 'utf8')
