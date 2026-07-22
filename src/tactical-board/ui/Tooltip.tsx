import {
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from 'react'

import styles from './Tooltip.module.css'

export interface TooltipProps {
  children: ReactElement
  label: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ children, label, side = 'bottom' }: TooltipProps) {
  const tooltipId = useId()

  if (!isValidElement(children)) return children

  const child = children as ReactElement<Record<string, unknown>>
  const describedBy = [child.props['aria-describedby'], tooltipId]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={styles.anchor}>
      {cloneElement(child, { 'aria-describedby': describedBy })}
      <span
        className={`${styles.tooltip} ${styles[side]}`}
        id={tooltipId}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  )
}
