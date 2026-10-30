// ============================================================================
// CodeCraft — Command Palette Component (Ctrl+Shift+P / ⌘K)
// Quick keyboard-driven workflow for Code Studio actions
// ============================================================================

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search,
  X,
  Keyboard,
} from 'lucide-react'
import styles from './CommandPaletteModal.module.css'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  shortcut?: string
  category: 'execution' | 'editor' | 'navigation'
  icon: React.ReactNode
  action: () => void
}

interface CommandPaletteModalProps {
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Derive resets during render to comply with React Compiler rules
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }

  const [prevQuery, setPrevQuery] = useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    setSelectedIndex(0)
  }

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return commands
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle?.toLowerCase().includes(q) ||
        c.shortcut?.toLowerCase().includes(q)
    )
  }, [commands, query])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 25)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | null
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredCommands[selectedIndex]
      if (selected) {
        selected.action()
        onClose()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Type a command or search action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button
              className={styles.clearBtn}
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <span className={styles.escBadge}>ESC to close</span>
          )}
        </div>

        {/* Command Items List */}
        <div ref={listRef} className={styles.commandList}>
          {filteredCommands.length === 0 ? (
            <div className={styles.emptyResults}>
              <Keyboard size={24} className={styles.emptyIcon} />
              <p>No matching commands found</p>
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={item.id}
                  data-index={idx}
                  className={`${styles.commandItem} ${
                    isSelected ? styles.commandItemActive : ''
                  }`}
                  onClick={() => {
                    item.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={styles.itemIcon}>{item.icon}</div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.subtitle && (
                      <span className={styles.itemSubtitle}>
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                  {item.shortcut && (
                    <kbd className={styles.shortcutKey}>{item.shortcut}</kbd>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className={styles.footerHints}>
          <span className={styles.hintPair}>
            <kbd className={styles.hintKbd}>↑</kbd>
            <kbd className={styles.hintKbd}>↓</kbd>
            <span>Navigate</span>
          </span>
          <span className={styles.hintPair}>
            <kbd className={styles.hintKbd}>↵</kbd>
            <span>Execute</span>
          </span>
          <span className={styles.hintPair}>
            <kbd className={styles.hintKbd}>Esc</kbd>
            <span>Cancel</span>
          </span>
        </div>
      </div>
    </div>
  )
}
