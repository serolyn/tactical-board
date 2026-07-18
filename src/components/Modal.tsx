import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { Button } from './Button'
import styles from './Modal.module.css'

const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export interface ModalProps {
  children: ReactNode
  description?: ReactNode
  footer?: ReactNode
  labelledBy?: string
  onClose: () => void
  open: boolean
  size?: 'small' | 'medium' | 'large'
  title: ReactNode
}

export function Modal({
  children,
  description,
  footer,
  labelledBy,
  onClose,
  open,
  size = 'medium',
  title,
}: ModalProps) {
  const generatedTitleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = labelledBy ?? generatedTitleId

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panelRef.current)?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab') return
    const elements = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    )
    if (!elements.length) {
      event.preventDefault()
      return
    }

    const first = elements[0]
    const last = elements[elements.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className={styles.backdrop}
      onKeyDown={trapFocus}
      role="dialog"
    >
      <button
        aria-label="Fermer la fenêtre"
        className={styles.dismissArea}
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <div
        className={`${styles.panel} ${styles[size]}`}
        ref={panelRef}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className={styles.description} id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <Button
            aria-label="Fermer"
            icon={<X aria-hidden="true" />}
            iconOnly
            onClick={onClose}
            variant="ghost"
          />
        </header>
        <div className={styles.content}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
