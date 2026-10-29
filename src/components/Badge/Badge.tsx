import type { BadgeVariant } from '../../types'
import styles from './Badge.module.css'

type Props = {
  variant?: BadgeVariant
  children: React.ReactNode
  size?: 'sm' | 'md'
}

export function Badge({ variant = 'default', size = 'md', children }: Props) {
  return (
    <span
      className={`${styles.badge} ${styles[`badge--${variant}`]} ${styles[`badge--${size}`]}`}
    >
      {children}
    </span>
  )
}
