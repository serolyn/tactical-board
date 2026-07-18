import type { ReactNode } from 'react'
import { X } from 'lucide-react'

import { Button } from './Button'
import styles from './PanelShell.module.css'

export interface PanelShellProps {
  children: ReactNode
  className?: string
  description?: ReactNode
  id?: string
  onClose?: () => void
  open?: boolean
  side?: 'left' | 'right'
  title: ReactNode
}

export function PanelShell({
  children,
  className = '',
  description,
  id,
  onClose,
  open = true,
  side = 'left',
  title,
}: PanelShellProps) {
  return (
    <>
      {onClose && open ? (
        <button
          aria-label="Fermer le panneau"
          className={styles.backdrop}
          onClick={onClose}
          type="button"
        />
      ) : null}
      <aside
        aria-hidden={!open}
        className={`${styles.panel} ${styles[side]} ${open ? styles.open : ''} ${className}`}
        id={id}
        inert={!open}
      >
        <header className={styles.header}>
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          {onClose ? (
            <Button
              aria-label="Fermer le panneau"
              icon={<X aria-hidden="true" />}
              iconOnly
              onClick={onClose}
              variant="ghost"
            />
          ) : null}
        </header>
        <div className={styles.content}>{children}</div>
      </aside>
    </>
  )
}
