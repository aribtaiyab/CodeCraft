import styles from './EmptyState.module.css'

type Props = {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({ icon, title, description, action, size = 'md' }: Props) {
  return (
    <div className={`${styles.empty} ${styles[`empty--${size}`]}`}>
      {icon && <div className={styles.empty__icon}>{icon}</div>}
      <h3 className={styles.empty__title}>{title}</h3>
      {description && <p className={styles.empty__desc}>{description}</p>}
      {action && <div className={styles.empty__action}>{action}</div>}
    </div>
  )
}
