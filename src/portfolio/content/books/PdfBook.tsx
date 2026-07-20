import { useEffect, useRef, useState } from 'react'
import { PageFlip } from 'page-flip'

import cover from '../../../assets/effects/book/cover.webp'
import page01 from '../../../assets/effects/book/page-01.webp'
import page02 from '../../../assets/effects/book/page-02.webp'
import page03 from '../../../assets/effects/book/page-03.webp'
import page04 from '../../../assets/effects/book/page-04.webp'
import backCover from '../../../assets/effects/book/back-cover.webp'

import './pdf-book.css'

/*
 * Les images sont rangées dans l'ordre réel du livre.
 */
const pages = [
  cover,
  page01,
  page02,
  page03,
  page04,
  backCover,
]

export function PdfBook() {
  /*
   * Référence vers le conteneur HTML dans lequel le livre sera créé.
   */
  const containerRef = useRef<HTMLDivElement>(null)

  /*
   * Référence vers le moteur PageFlip.
   * Elle permet aux boutons de contrôler le livre.
   */
  const bookRef = useRef<PageFlip | null>(null)

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let book: PageFlip | null = null
    let animationFrameId = window.requestAnimationFrame(() => {
      if (bookRef.current || !container.isConnected) {
        return
      }

      /*
       * Une page mesure ici 550 × 778.
       * Ce ratio correspond approximativement à une page A4.
       */
      book = new PageFlip(container, {
        width: 1300,
        height: 1920,

        /*
         * Le livre adapte automatiquement sa taille à l'écran.
         */
        size: 'stretch',
        minWidth: 260,
        maxWidth: 1300,
        minHeight: 368,
        maxHeight: 1920,

        /*
         * Réglages visuels et interactifs.
         */
        showCover: true,
        drawShadow: true,
        maxShadowOpacity: 0.38,
        flippingTime: 900,
        usePortrait: true,
        autoSize: true,
        swipeDistance: 30,

        /*
         * Le livre ne doit pas empêcher le scroll général du site sur mobile.
         */
        mobileScrollSupport: false,
      })

      bookRef.current = book

      /*
       * Met à jour le numéro affiché lorsqu'une page est tournée.
       */
      book.on('flip', (event: { data: number }) => {
        const pageIndex = Number(event.data)
        setCurrentPage(pageIndex + 1)
      })

      /*
       * Donne les URLs des pages au moteur; il crée ses propres éléments.
       */
      book.loadFromImages(pages)
    })

    /*
     * Détruit correctement le livre lorsque la page React est quittée.
     */
    return () => {
      window.cancelAnimationFrame(animationFrameId)

      book?.destroy()
      bookRef.current = null
    }
  }, [])

  return (
    <section className="pdf-book">
      <header className="pdf-book__header">
        <div>
          <p className="pdf-book__eyebrow">ARCHIVE / LIVRE</p>
          <h2 className="pdf-book__title">MON LIVRE</h2>
        </div>

        <p className="pdf-book__counter">
          {currentPage} / {pages.length}
        </p>
      </header>

      <div className="pdf-book__stage">
        <div ref={containerRef} className="pdf-book__pages" aria-label="Livre interactif" />
      </div>
    </section>
  )
}