import { useState } from 'react'
import type { TabItem } from '../../types'
import styles from './Tabs.module.css'

type Props = {
  tabs: TabItem[]
  defaultTab?: string
  onChange?: (id: string) => void
  children: (activeId: string) => React.ReactNode
  size?: 'sm' | 'md'
}

export function Tabs({ tabs, defaultTab, onChange, children, size = 'md' }: Props) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '')

  const handleSelect = (id: string) => {
    setActive(id)
    onChange?.(id)
  }

  return (
    <div className={styles.tabs}>
      <div className={`${styles.tabs__list} ${styles[`tabs__list--${size}`]}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleSelect(tab.id)}
            className={[
              styles.tabs__tab,
              active === tab.id ? styles['tabs__tab--active'] : '',
              tab.disabled ? styles['tabs__tab--disabled'] : '',
            ].filter(Boolean).join(' ')}
          >
            {tab.icon && <span className={styles.tabs__icon}>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${active}`}
        aria-labelledby={`tab-${active}`}
        className={styles.tabs__panel}
      >
        {children(active)}
      </div>
    </div>
  )
}
