import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SiteRouter from '@/app/SiteRouter'
import '@/tactical-board/features/battlefield/Battlefield.performance.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteRouter />
  </StrictMode>,
)
