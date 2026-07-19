import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { PortfolioShell } from './portfolio/PortfolioShell'
import { RouteEffects } from './portfolio/RouteEffects'
import { normalizeBasename } from './portfolio/routerBasename'
import { AboutPage } from './portfolio/pages/AboutPage'
import { HomePage } from './portfolio/pages/HomePage'
import { LabPage } from './portfolio/pages/LabPage'
import { MusicPage } from './portfolio/pages/MusicPage'
import { NotFoundPage } from './portfolio/pages/NotFoundPage'
import { ProjectsPage } from './portfolio/pages/ProjectsPage'
import { TacticalBoardProjectPage } from './portfolio/pages/TacticalBoardProjectPage'

const TacticalBoardApp = lazy(() => import('./TacticalBoardApp'))

const boardLoadingStyle = {
  display: 'grid',
  minHeight: '100dvh',
  margin: 0,
  placeItems: 'center',
  color: '#e3e7df',
  background: '#0d1211',
  fontFamily: 'system-ui, sans-serif',
} as const

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
            element={<TacticalBoardProjectPage />}
          />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/lab" element={<LabPage />} />
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
