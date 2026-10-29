import type { ButtonVariant, ButtonSize } from '../../types'
import styles from './Button.module.css'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...rest
}: Props) {
  const isDisabled = disabled || loading

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={[
        styles.btn,
        styles[`btn--${variant}`],
        styles[`btn--${size}`],
        fullWidth ? styles['btn--full'] : '',
        loading ? styles['btn--loading'] : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {loading ? (
        <span className={styles.btn__spinner} aria-hidden="true" />
      ) : iconLeft ? (
        <span className={styles.btn__icon}>{iconLeft}</span>
      ) : null}
      {children && <span className={styles.btn__label}>{children}</span>}
      {!loading && iconRight && (
        <span className={styles.btn__icon}>{iconRight}</span>
      )}
    </button>
  )
}
