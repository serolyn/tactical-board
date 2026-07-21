import { lazy, Suspense } from 'react'

/*
 * Le moteur page-flip et les images du livre sont chargés uniquement
 * quand la section flipbook est réellement affichée.
 */
const PdfBook = lazy(() =>
  import('./PdfBook').then((module) => ({
    default: module.PdfBook,
  })),
)

export function LazyPdfBook() {
  return (
    <Suspense fallback={null}>
      <PdfBook />
    </Suspense>
  )
}

export default LazyPdfBook
