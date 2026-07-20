import type { ButtonHTMLAttributes, ReactNode } from 'react'

import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  iconOnly?: boolean
  loading?: boolean
  variant?: ButtonVariant
}

export function Button({
  children,
  className = '',
  disabled,
  icon,
  iconOnly = false,
  loading = false,
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    iconOnly ? styles.iconOnly : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <span aria-hidden="true" className={styles.spinner} /> : icon}
      {children ? <span className={styles.label}>{children}</span> : null}
    </button>
  )
}
