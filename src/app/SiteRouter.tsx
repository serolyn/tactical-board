import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { PortfolioShell } from '@/portfolio/PortfolioShell'
import { AboutPage } from '@/portfolio/pages/AboutPage'
import { HomePage } from '@/portfolio/pages/HomePage'
import { LabPage } from '@/portfolio/pages/LabPage'
import { MusicPage } from '@/portfolio/pages/MusicPage'
import { NotFoundPage } from '@/portfolio/pages/NotFoundPage'
import { ProjectsPage } from '@/portfolio/pages/ProjectsPage'
import { ScreenGlitch } from './effects/ScreenGlitch'
import { SiteRouteEffects } from './SiteRouteEffects'
import { normalizeSiteBasename } from './normalizeSiteBasename'

// Le routeur racine est l'unique point autorisé à choisir entre les deux applications.
const TacticalBoardApp = lazy(() => import('@/tactical-board/TacticalBoardApp'))
const ProjectDetailPage = lazy(() => import('@/portfolio/pages/ProjectDetailPage'))
const MusicDetailPage = lazy(() => import('@/portfolio/pages/MusicDetailPage'))
const LabDetailPage = lazy(() => import('@/portfolio/pages/LabDetailPage'))

const tacticalBoardLoadingStyle = {
  display: 'grid',
  minHeight: '100dvh',
  margin: 0,
  placeItems: 'center',
  color: '#e3e7df',
  background: '#0d1211',
  fontFamily: 'system-ui, sans-serif',
} as const

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
      <ScreenGlitch enabled={true} /> 
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
