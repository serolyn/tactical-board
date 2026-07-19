import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { PortfolioShell } from './portfolio/PortfolioShell'
import { RouteEffects } from './portfolio/RouteEffects'
import { normalizeBasename } from './portfolio/routerBasename'
import { AboutPage } from './portfolio/pages/AboutPage'
import { HomePage } from './portfolio/pages/HomePage'
import { LabPage } from './portfolio/pages/LabPage'
import { MusicPage } from './portfolio/pages/MusicPage'
import { NotFoundPage } from './portfolio/pages/NotFoundPage'
import { ProjectsPage } from './portfolio/pages/ProjectsPage'

const TacticalBoardApp = lazy(() => import('./TacticalBoardApp'))
const ProjectDetailPage = lazy(() => import('./portfolio/pages/ProjectDetailPage'))
const MusicDetailPage = lazy(() => import('./portfolio/pages/MusicDetailPage'))
const LabDetailPage = lazy(() => import('./portfolio/pages/LabDetailPage'))

const boardLoadingStyle = {
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

export function PortfolioRouteTree() {
  return (
    <>
      <RouteEffects />
      <Routes>
        <Route
          path="/board"
          element={
            <Suspense
              fallback={
                <p role="status" style={boardLoadingStyle}>
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

export interface AppProps {
  basename?: string
}

export default function App({ basename = import.meta.env.BASE_URL }: AppProps) {
  return (
    <BrowserRouter basename={normalizeBasename(basename)}>
      <PortfolioRouteTree />
    </BrowserRouter>
  )
}
