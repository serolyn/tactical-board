/**
 * @packageDocumentation
 * Point d'entrée du routage applicatif.
 *
 * Ce module est l'unique endroit autorisé à choisir entre les deux applications
 * (`portfolio` et `tactical-board`). Il déclare les routes publiques, applique
 * les effets de route communs, et monte `BrowserRouter` avec le basename
 * compatible GitHub Pages.
 */
import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { PortfolioShell } from '@/portfolio/PortfolioShell'
import { AboutPage } from '@/portfolio/pages/PortfolioAboutPage'
import { HomePage } from '@/portfolio/pages/PortfolioHomePage'
import { LabPage } from '@/portfolio/pages/PortfolioLabIndexPage'
import { MusicPage } from '@/portfolio/pages/PortfolioMusicIndexPage'
import { NotFoundPage } from '@/portfolio/pages/PortfolioNotFoundPage'
import { ProjectsPage } from '@/portfolio/pages/PortfolioProjectsIndexPage'
import { ScreenGlitch } from './effects/ScreenGlitch'
import { SiteRouteEffects } from './SiteRouteEffects'
import { normalizeSiteBasename } from './normalizeSiteBasename'

// Le routeur racine est l'unique point autorisé à choisir entre les deux applications.
const TacticalBoardApp = lazy(() => import('@/tactical-board/TacticalBoardApp'))
const ProjectDetailPage = lazy(() => import('@/portfolio/pages/PortfolioProjectDetailPage'))
const MusicDetailPage = lazy(() => import('@/portfolio/pages/PortfolioMusicDetailPage'))
const LabDetailPage = lazy(() => import('@/portfolio/pages/PortfolioLabDetailPage'))
const SroWorldPage = lazy(() => import('@/portfolio/experiences/sro-world/SroWorldPage'))

const tacticalBoardLoadingStyle = {
  display: 'grid',
  minHeight: '100dvh',
  margin: 0,
  placeItems: 'center',
  color: '#e3e7df',
  background: '#0d1211',
  fontFamily: 'system-ui, sans-serif',
} as const

const immersiveWorldLoadingStyle = {
  display: 'grid',
  minHeight: '100dvh',
  margin: 0,
  placeItems: 'center',
  color: '#dddde5',
  background: '#05060a',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: '0.72rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
} as const

/**
 * Cette petite fabrique enveloppe une page portfolio dans un chargement différé,
 * pour que l’interface reste fluide.
 */
function lazyPortfolioPage(page: ReactNode) {
  return (
    <Suspense fallback={<p className="route-loading" role="status">Chargement de l’entrée…</p>}>
      {page}
    </Suspense>
  )
}

/** Déclare les routes sans laisser les deux applications s'importer entre elles. */
export function SiteRouteTree() {
  return (
    <>
      <SiteRouteEffects />
      <ScreenGlitch enabled={false} />
      <Routes>
        <Route
          path="/board"
          element={
            <Suspense
              fallback={
                <p role="status" style={tacticalBoardLoadingStyle}>
                  Chargement du plateau tactique…
                </p>
              }
            >
              <TacticalBoardApp />
            </Suspense>
          }
        />

        <Route
          path="/music/sro-world"
          element={
            <Suspense
              fallback={
                <p role="status" style={immersiveWorldLoadingStyle}>
                  Initialisation du monde SRO…
                </p>
              }
            >
              <SroWorldPage />
            </Suspense>
          }
        />

        <Route element={<PortfolioShell />}>
          <Route index element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route
            path="/projects/tactical-board"
            element={<Navigate replace to="/lab/tactical-board" />}
          />
          <Route path="/projects/:slug" element={lazyPortfolioPage(<ProjectDetailPage />)} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/music/:slug" element={lazyPortfolioPage(<MusicDetailPage />)} />
          <Route path="/lab" element={<LabPage />} />
          <Route path="/lab/:slug" element={lazyPortfolioPage(<LabDetailPage />)} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}

export interface SiteRouterProps {
  basename?: string
}

/** Monte le routeur avec le préfixe fourni par Vite et GitHub Pages. */
export default function SiteRouter({ basename = import.meta.env.BASE_URL }: SiteRouterProps) {
  return (
    <BrowserRouter basename={normalizeSiteBasename(basename)}>
      <SiteRouteTree />
    </BrowserRouter>
  )
}
