import styles from './Spinner.module.css'

type Props = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function Spinner({ size = 'md', label = 'Loading…' }: Props) {
  return (
    <div className={`${styles.spinner} ${styles[`spinner--${size}`]}`} role="status">
      <div className={styles.spinner__ring} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  )
}
