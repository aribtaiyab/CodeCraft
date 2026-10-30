import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Code2,
  FlaskConical,
  BookOpen,
  Menu,
  X,
  Cpu,
} from 'lucide-react'
import styles from './Navigation.module.css'

const navItems = [
  { path: '/studio', label: 'Code Studio', icon: Code2 },
  { path: '/testlab', label: 'AI Test Lab', icon: FlaskConical },
  { path: '/learn', label: 'Learn', icon: BookOpen },
]

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  useEffect(() => {
    if (!mobileOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <nav className={styles.nav} aria-label="Main navigation">
        <div className={styles.nav__inner}>
          {/* Logo */}
          <NavLink to="/" className={styles.nav__logo} onClick={closeMobile} aria-label="CodeCraft home">
            <div className={styles.nav__logoMark}>
              <Cpu size={18} strokeWidth={1.75} />
            </div>
            <span className={styles.nav__logoText}>
              Code<span className={styles.nav__logoAccent}>Craft</span>
            </span>
          </NavLink>

          {/* Desktop links */}
          <div className={styles.nav__links} role="menubar">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                role="menuitem"
                className={({ isActive }) =>
                  [styles.nav__link, isActive ? styles['nav__link--active'] : ''].join(' ')
                }
              >
                <Icon size={15} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right slot */}
          <div className={styles.nav__right}>
            <span className={styles.nav__phase}>
              <span className={styles.nav__engineDot} aria-hidden="true" />
              Python 3.12 Engine
            </span>

            {/* Mobile toggle */}
            <button
              className={styles.nav__mobileToggle}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className={styles.nav__mobile}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className={styles.nav__mobileBackdrop} onClick={closeMobile} />
          <div className={styles.nav__mobilePanel}>
            <div className={styles.nav__mobileHeader}>
              <span className={styles.nav__logoText}>
                Code<span className={styles.nav__logoAccent}>Craft</span>
              </span>
              <button
                onClick={closeMobile}
                className={styles.nav__mobileClose}
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            <nav className={styles.nav__mobileLinks}>
              <NavLink
                to="/"
                onClick={closeMobile}
                className={({ isActive }) =>
                  [styles.nav__mobileLink, isActive ? styles['nav__mobileLink--active'] : ''].join(' ')
                }
              >
                Home
              </NavLink>
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    [styles.nav__mobileLink, isActive ? styles['nav__mobileLink--active'] : ''].join(' ')
                  }
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className={styles.nav__mobileMeta}>
              <span className={styles.nav__phase}>Python 3.12 Engine</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
