import { AlertTriangle, Check, CloudOff, LoaderCircle } from 'lucide-react'

import styles from './SaveStatus.module.css'

export type SaveState = 'saved' | 'saving' | 'error' | 'offline'

const SAVE_LABELS: Record<SaveState, string> = {
  saved: 'Sauvegardé',
  saving: 'Sauvegarde…',
  error: 'Échec de sauvegarde',
  offline: 'Hors connexion',
}

export interface SaveStatusProps {
  className?: string
  detail?: string
  state: SaveState
}

export function SaveStatus({ className = '', detail, state }: SaveStatusProps) {
  const Icon =
    state === 'saved'
      ? Check
      : state === 'saving'
        ? LoaderCircle
        : state === 'offline'
          ? CloudOff
          : AlertTriangle

  return (
    <span
      aria-label={detail ? `${SAVE_LABELS[state]} : ${detail}` : SAVE_LABELS[state]}
      className={`${styles.saveStatus} ${styles[state]} ${className}`}
      role="status"
    >
      <Icon aria-hidden="true" className={state === 'saving' ? styles.spin : ''} />
      <span>{SAVE_LABELS[state]}</span>
    </span>
  )
}

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export interface ToastMessage {
  actionLabel?: string
  id: string
  message: string
  title?: string
  tone?: ToastTone
}

export interface ToastRegionProps {
  onAction?: (toast: ToastMessage) => void
  onDismiss: (id: string) => void
  toasts: ToastMessage[]
}

export function ToastRegion({ onAction, onDismiss, toasts }: ToastRegionProps) {
  return (
    <div
      aria-atomic="false"
      aria-live="polite"
      className={styles.toastRegion}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          className={`${styles.toast} ${styles[toast.tone ?? 'info']}`}
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
        >
          <div className={styles.toastBody}>
            {toast.title ? <strong>{toast.title}</strong> : null}
            <span>{toast.message}</span>
          </div>
          {toast.actionLabel && onAction ? (
            <button onClick={() => onAction(toast)} type="button">
              {toast.actionLabel}
            </button>
          ) : null}
          <button
            aria-label="Fermer la notification"
            className={styles.dismiss}
            onClick={() => onDismiss(toast.id)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

export interface LiveAnnouncementProps {
  message: string
  priority?: 'polite' | 'assertive'
}

export function LiveAnnouncement({
  message,
  priority = 'polite',
}: LiveAnnouncementProps) {
  return (
    <div aria-live={priority} className={styles.srOnly} role="status">
      {message}
    </div>
  )
}
