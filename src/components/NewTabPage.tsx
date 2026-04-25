import { useState, useEffect } from 'react'
import { useBrowser } from '../store/browserStore'
import styles from './NewTabPage.module.css'
import VikiioPayCard from './VikiioPayCard'

const QUICK_LINKS = [
  { label: 'Google',    url: 'https://google.com',       icon: '🔍' },
  { label: 'GitHub',    url: 'https://github.com',        icon: '🐙' },
  { label: 'YouTube',   url: 'https://youtube.com',       icon: '▶️' },
  { label: 'Reddit',    url: 'https://reddit.com',        icon: '🤖' },
  { label: 'Twitter',   url: 'https://twitter.com',       icon: '🐦' },
  { label: 'Wikipedia', url: 'https://wikipedia.org',     icon: '📚' },
  { label: 'Maps',      url: 'https://maps.google.com',   icon: '🗺️' },
]

const AI_CHIPS = [
  'Summarize saved articles',
  'Open work tabs',
  'Find flights to Miami',
  "Continue yesterday's research",
]

const RECENT_COLORS = ['#6366f1', '#ef4444', '#4ade80', '#f59e0b', '#4fc3f7']

const SEARCH_ENGINES: Record<string, string> = {
  google:    'https://www.google.com/search?q=',
  bing:      'https://www.bing.com/search?q=',
  duckduckgo:'https://duckduckgo.com/?q=',
  brave:     'https://search.brave.com/search?q=',
}

function useClock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      let h = now.getHours()
      const m = String(now.getMinutes()).padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      setTime(`${h}:${m} ${ampm}`)

      const days   = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
      const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
      setDate(`${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return { time, date }
}

export function NewTabPage() {
  const { state, dispatch } = useBrowser()
  const { time, date } = useClock()
  const [searchQuery, setSearchQuery] = useState('')
  const [aiQuery, setAiQuery] = useState('')

  const navigate = (url: string) => {
    dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url, isLoading: true, title: 'Loading...' } })
  }

  const handleSearch = (q: string) => {
    if (!q.trim()) return
    const isUrl = /^https?:\/\//i.test(q) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(q)
    if (isUrl) {
      navigate(q.startsWith('http') ? q : 'https://' + q)
    } else {
      const engine = SEARCH_ENGINES[state.settings.defaultSearchEngine] || SEARCH_ENGINES.google
      navigate(engine + encodeURIComponent(q))
    }
  }

  const handleChipClick = (chip: string) => {
    dispatch({ type: 'SET_SIDEBAR_TAB', tab: 'chat' })
    if (!state.isSidebarOpen) dispatch({ type: 'TOGGLE_SIDEBAR' })
    dispatch({
      type: 'ADD_AI_MESSAGE',
      message: { id: `msg-${Date.now()}`, role: 'user', content: chip, timestamp: new Date() }
    })
  }

  const recentHistory = state.history.slice(0, 3)

  const modeColors: Record<string, string> = {
    normal: '#6366f1', private: '#9c27b0', work: '#4fc3f7', anonymous: '#607d8b', locked: '#e05252'
  }
  const modeColor = modeColors[state.settings.mode] || '#6366f1'

  return (
    <div className={styles.page}>
      {/* Dot-grid overlay */}
      <div className={styles.dotGrid} />
      {/* Indigo radial glow */}
      <div className={styles.glow} />

      {/* Mode banner */}
      {state.settings.mode !== 'normal' && (
        <div className={styles.modeBanner} style={{ '--mode-c': modeColor } as React.CSSProperties}>
          {state.settings.mode === 'private'   && '🔒 Private Mode — No history, cookies, or AI memory saved'}
          {state.settings.mode === 'work'       && '💼 Work Mode — AI tab organization and workspace sync enabled'}
          {state.settings.mode === 'anonymous'  && '🕵️ Anonymous Mode — VPN routing, no cloud AI, strict shields'}
          {state.settings.mode === 'locked'     && '🔐 Locked Mode — No sync, no extensions, auto-wipe on close'}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.centerCol}>

          {/* ── Clock ── */}
          <div className={styles.clockBlock}>
            <div className={styles.clockTime}>{time}</div>
            <div className={styles.clockDate}>{date}</div>
          </div>

          {/* ── Search Bar ── */}
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              className={styles.searchInput}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(searchQuery)}
              placeholder="Search with Google or enter URL"
              autoFocus
            />
            <button
              className={styles.searchAiPill}
              onClick={() => { if (!state.isSidebarOpen) dispatch({ type: 'TOGGLE_SIDEBAR' }) }}
            >
              ✦ AI
            </button>
          </div>

          {/* ── AI Prompt Chips ── */}
          <div className={styles.chipsRow}>
            {AI_CHIPS.map(chip => (
              <button key={chip} className={styles.chip} onClick={() => handleChipClick(chip)}>
                {chip}
              </button>
            ))}
          </div>

          {/* ── Site Shortcuts ── */}
          <div className={styles.shortcuts}>
            {QUICK_LINKS.map(link => (
              <button key={link.url} className={styles.shortcut} onClick={() => navigate(link.url)}>
                <div className={styles.shortcutIcon}>{link.icon}</div>
                <span className={styles.shortcutLabel}>{link.label}</span>
              </button>
            ))}
          </div>

          {/* ── Two-Column Cards ── */}
          <div className={styles.cardsRow}>
            {/* Ask AI card */}
            <div
              className={`${styles.card} ${styles.cardAi}`}
              onClick={() => { if (!state.isSidebarOpen) dispatch({ type: 'TOGGLE_SIDEBAR' }); dispatch({ type: 'SET_SIDEBAR_TAB', tab: 'chat' }) }}
            >
              <div className={styles.cardLabel}>Ask AI</div>
              <div className={styles.cardTitle}>Your AI assistant</div>
              <div className={styles.cardDesc}>Summarize tabs, research topics, draft messages, and more — all in context.</div>
            </div>

            {/* Recent card */}
            <div className={styles.card}>
              <div className={styles.cardLabel}>Recent</div>
              {recentHistory.length > 0 ? (
                <div className={styles.recentList}>
                  {recentHistory.map((h, i) => (
                    <button key={h.id} className={styles.recentItem} onClick={() => navigate(h.url)}>
                      <div className={styles.recentDot} style={{ background: RECENT_COLORS[i % RECENT_COLORS.length] }} />
                      <span className={styles.recentDomain}>
                        {(() => { try { return new URL(h.url).hostname } catch { return h.url } })()}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.recentList}>
                  {[
                    { domain: 'github.com',    color: '#6366f1' },
                    { domain: 'youtube.com',   color: '#ef4444' },
                    { domain: 'wikipedia.org', color: '#4ade80' },
                  ].map(r => (
                    <button key={r.domain} className={styles.recentItem} onClick={() => navigate('https://' + r.domain)}>
                      <div className={styles.recentDot} style={{ background: r.color }} />
                      <span className={styles.recentDomain}>{r.domain}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Vikiio Pay Card ── */}
          <VikiioPayCard
            onOpenPay={() => {
              dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url: 'https://pay.vikiio.com', isLoading: true, title: 'Vikiio Pay' } })
            }}
          />

          {/* ── Stats Bar ── */}
          <div className={styles.statsBar}>
            <div className={styles.statCol}>
              <span className={`${styles.statVal} ${styles.statGreen}`}>
                {state.privacyStats.trackersBlocked + state.privacyStats.adsBlocked}
              </span>
              <span className={styles.statLbl}>Trackers Blocked</span>
            </div>
            <div className={styles.statCol}>
              <span className={styles.statVal}>{state.history.length}</span>
              <span className={styles.statLbl}>Pages Visited</span>
            </div>
            <div className={styles.statCol}>
              <span className={styles.statVal}>{state.bookmarks.length}</span>
              <span className={styles.statLbl}>Bookmarks</span>
            </div>
            <div className={styles.statCol}>
              <span className={styles.statVal}>{state.savedNotes.length}</span>
              <span className={styles.statLbl}>Saved Notes</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
