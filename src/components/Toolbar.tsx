import { useState, useRef, useEffect } from 'react'
import { useBrowser } from '../store/browserStore'
import { ShieldIcon } from './icons/ShieldIcon'
import styles from './Toolbar.module.css'

const SEARCH_ENGINES: Record<string, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  brave: 'https://search.brave.com/search?q=',
}

const MODE_OPTIONS = [
  { value: 'normal', label: 'Normal', icon: '🌐' },
  { value: 'private', label: 'Private', icon: '🔒' },
  { value: 'work', label: 'Work', icon: '💼' },
  { value: 'anonymous', label: 'Anonymous', icon: '🕵️' },
  { value: 'locked', label: 'Locked', icon: '🔐' },
] as const

export function Toolbar() {
  const { state, dispatch } = useBrowser()
  const activeTab = state.tabs.find(t => t.id === state.activeTabId)
  const [inputValue, setInputValue] = useState(activeTab?.url === 'newtab' ? '' : (activeTab?.url ?? ''))
  const [isFocused, setIsFocused] = useState(false)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [showShieldMenu, setShowShieldMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isFocused) {
      setInputValue(activeTab?.url === 'newtab' ? '' : (activeTab?.url ?? ''))
    }
  }, [activeTab?.url, isFocused])

  const navigate = (url: string) => {
    let finalUrl = url.trim()
    if (!finalUrl) return

    if (finalUrl === 'newtab') {
      dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url: 'newtab', title: 'New Tab' } })
      return
    }

    // Check if it's a URL or search query
    const isUrl = /^https?:\/\//i.test(finalUrl) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(finalUrl)
    if (!isUrl) {
      const engine = SEARCH_ENGINES[state.settings.defaultSearchEngine] || SEARCH_ENGINES.google
      finalUrl = engine + encodeURIComponent(finalUrl)
    } else if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url: finalUrl, isLoading: true, title: 'Loading...' } })
    setInputValue(finalUrl)

    // Add to history
    dispatch({
      type: 'ADD_HISTORY',
      entry: { id: `h-${Date.now()}`, title: finalUrl, url: finalUrl, visitedAt: new Date() }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(inputValue)
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setInputValue(activeTab?.url === 'newtab' ? '' : (activeTab?.url ?? ''))
      inputRef.current?.blur()
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    inputRef.current?.select()
  }

  const shieldColor = state.settings.adBlocking && state.settings.trackerBlocking
    ? 'green' : state.settings.adBlocking || state.settings.trackerBlocking
    ? 'yellow' : 'red'

  const totalBlocked = (activeTab?.trackersBlocked ?? 0) + (activeTab?.adsBlocked ?? 0)

  return (
    <div className={styles.toolbar}>
      {/* Navigation Buttons */}
      <div className={styles.navButtons}>
        <button
          className={styles.navBtn}
          onClick={() => dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url: 'back' } })}
          disabled={!activeTab?.canGoBack}
          title="Back"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className={styles.navBtn}
          onClick={() => dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url: 'forward' } })}
          disabled={!activeTab?.canGoForward}
          title="Forward"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className={styles.navBtn}
          onClick={() => dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { isLoading: false } })}
          title={activeTab?.isLoading ? 'Stop' : 'Reload'}
        >
          {activeTab?.isLoading ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M8 2.5V5.5L10.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <button
          className={styles.navBtn}
          onClick={() => navigate('newtab')}
          title="Home"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 7l6-5 6 5v7H10v-4H6v4H2V7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Shield Button */}
      <button
        className={`${styles.shieldBtn} ${styles[`shield-${shieldColor}`]}`}
        onClick={() => setShowShieldMenu(!showShieldMenu)}
        title={`Privacy Shield: ${totalBlocked} blocked`}
      >
        <ShieldIcon color={shieldColor} />
        {totalBlocked > 0 && <span className={styles.blockedCount}>{totalBlocked}</span>}
      </button>

      {/* Address Bar */}
      <div className={`${styles.addressBarWrapper} ${isFocused ? styles.focused : ''}`}>
        {!isFocused && activeTab?.url.startsWith('https://') && (
          <span className={styles.lockIcon}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </span>
        )}
        <input
          ref={inputRef}
          className={styles.addressBar}
          value={isFocused ? inputValue : (activeTab?.url === 'newtab' ? '' : (activeTab?.url ?? ''))}
          onChange={e => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter URL..."
          spellCheck={false}
          autoComplete="off"
        />
        {isFocused && inputValue && (
          <button className={styles.clearBtn} onMouseDown={e => { e.preventDefault(); setInputValue('') }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className={styles.rightActions}>
        {/* Bookmark current page */}
        <button
          className={styles.actionBtn}
          title="Bookmark this page"
          onClick={() => {
            if (activeTab && activeTab.url !== 'newtab') {
              dispatch({
                type: 'ADD_BOOKMARK',
                bookmark: {
                  id: `bm-${Date.now()}`,
                  title: activeTab.title,
                  url: activeTab.url,
                  tags: [],
                  createdAt: new Date(),
                }
              })
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2h10a1 1 0 0 1 1 1v11l-6-3-6 3V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Mode Switcher */}
        <div className={styles.modeWrapper}>
          <button
            className={styles.modeBtn}
            onClick={() => setShowModeMenu(!showModeMenu)}
            title="Switch browser mode"
          >
            <span>{MODE_OPTIONS.find(m => m.value === state.settings.mode)?.icon}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showModeMenu && (
            <>
              <div className={styles.menuOverlay} onClick={() => setShowModeMenu(false)} />
              <div className={styles.modeMenu}>
                {MODE_OPTIONS.map(m => (
                  <button
                    key={m.value}
                    className={`${styles.modeOption} ${state.settings.mode === m.value ? styles.modeActive : ''}`}
                    onClick={() => { dispatch({ type: 'SET_BROWSER_MODE', mode: m.value }); setShowModeMenu(false) }}
                  >
                    <span className={styles.modeOptionIcon}>{m.icon}</span>
                    <span>{m.label}</span>
                    {state.settings.mode === m.value && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Settings Button */}
        <button
          className={styles.actionBtn}
          title="Settings (Ctrl+,)"
          onClick={() => dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url: 'vikiio://settings', title: '⚙️ Settings', isLoading: false } })}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>

        {/* AI Sidebar Toggle */}
        <button
          className={`${styles.aiBtn} ${state.sidebarOpen ? styles.aiActive : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          title="AI Assistant"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 8c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8" cy="10" r="1" fill="currentColor"/>
          </svg>
          <span className={styles.aiBtnLabel}>AI</span>
        </button>
      </div>

      {/* Shield dropdown */}
      {showShieldMenu && (
        <>
          <div className={styles.menuOverlay} onClick={() => setShowShieldMenu(false)} />
          <div className={styles.shieldMenu}>
            <div className={styles.shieldHeader}>
              <ShieldIcon color={shieldColor} size={20} />
              <div>
                <div className={styles.shieldTitle}>Privacy Shield</div>
                <div className={styles.shieldSubtitle}>{totalBlocked} trackers & ads blocked</div>
              </div>
            </div>
            <div className={styles.shieldToggles}>
              {[
                { key: 'adBlocking', label: 'Ad Blocking' },
                { key: 'trackerBlocking', label: 'Tracker Blocking' },
                { key: 'cookieBlocking', label: 'Cookie Blocking' },
                { key: 'fingerprintProtection', label: 'Fingerprint Protection' },
              ].map(item => (
                <div key={item.key} className={styles.shieldToggle}>
                  <span>{item.label}</span>
                  <button
                    className={`${styles.toggle} ${state.settings[item.key as keyof typeof state.settings] ? styles.toggleOn : ''}`}
                    onClick={() => dispatch({ type: 'UPDATE_SETTINGS', settings: { [item.key]: !state.settings[item.key as keyof typeof state.settings] } })}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
