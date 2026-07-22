/**
 * @packageDocumentation
 * Point d'entrée de l'application React.
 *
 * Si tu débutes, commence ici: ce fichier ne contient presque aucune logique
 * métier. Il branche simplement React sur le DOM et lance le routeur racine.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SiteRouter from '@/app/SiteRouter'
import '@/tactical-board/features/battlefield/Battlefield.performance.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteRouter />
  </StrictMode>,
)
