import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SiteRouter from '@/app/SiteRouter'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteRouter />
  </StrictMode>,
)
