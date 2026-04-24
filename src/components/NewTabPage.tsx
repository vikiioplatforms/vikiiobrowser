import { useState } from 'react'
import { useBrowser } from '../store/browserStore'
import styles from './NewTabPage.module.css'

const QUICK_LINKS = [
  { label: 'Google', url: 'https://google.com', icon: '🔍' },
  { label: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { label: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
  { label: 'Reddit', url: 'https://reddit.com', icon: '🤖' },
  { label: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
  { label: 'Wikipedia', url: 'https://wikipedia.org', icon: '📚' },
  { label: 'HN', url: 'https://news.ycombinator.com', icon: '🔶' },
  { label: 'Maps', url: 'https://maps.google.com', icon: '🗺️' },
]

const AI_SUGGESTIONS = [
  'Summarize my saved articles',
  'Open my work tabs',
  'Find flights to Miami',
  'Continue research from yesterday',
  'What did I browse last week?',
]

const SEARCH_ENGINES: Record<string, { name: string; url: string }> = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  brave: { name: 'Brave', url: 'https://search.brave.com/search?q=' },
}

export function NewTabPage() {
  const { state, dispatch } = useBrowser()
  const [query, setQuery] = useState('')
  const [aiQuery, setAiQuery] = useState('')

  const navigate = (url: string) => {
    dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url, isLoading: true, title: 'Loading...' } })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const isUrl = /^https?:\/\//i.test(query) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(query)
    if (isUrl) {
      navigate(query.startsWith('http') ? query : 'https://' + query)
    } else {
      const engine = SEARCH_ENGINES[state.settings.defaultSearchEngine] || SEARCH_ENGINES.google
      navigate(engine.url + encodeURIComponent(query))
    }
  }

  const handleAiCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiQuery.trim()) return
    dispatch({ type: 'SET_SIDEBAR_TAB', tab: 'chat' })
    dispatch({
      type: 'ADD_AI_MESSAGE',
      message: { id: `msg-${Date.now()}`, role: 'user', content: aiQuery, timestamp: new Date() }
    })
    setAiQuery('')
  }

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const date = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  const modeColors: Record<string, string> = {
    normal: '#6c63ff', private: '#9c27b0', work: '#4fc3f7', anonymous: '#607d8b', locked: '#e05252'
  }
  const modeColor = modeColors[state.settings.mode] || '#6c63ff'

  return (
    <div className={styles.page} style={{ '--mode-c': modeColor } as React.CSSProperties}>
      {/* Background gradient */}
      <div className={styles.bg} />

      {/* Privacy Mode Banner */}
      {state.settings.mode !== 'normal' && (
        <div className={styles.modeBanner}>
          {state.settings.mode === 'private' && '🔒 Private Mode — No history, cookies, or AI memory saved'}
          {state.settings.mode === 'work' && '💼 Work Mode — AI tab organization and workspace sync enabled'}
          {state.settings.mode === 'anonymous' && '🕵️ Anonymous Mode — VPN routing, no cloud AI, strict shields'}
          {state.settings.mode === 'locked' && '🔐 Locked Mode — No sync, no extensions, auto-wipe on close'}
        </div>
      )}

      <div className={styles.center}>
        {/* Clock */}
        <div className={styles.clock}>
          <div className={styles.time}>{time}</div>
          <div className={styles.dateStr}>{date}</div>
        </div>

        {/* Main Search */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M11.5 11.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              className={styles.searchInput}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search with ${SEARCH_ENGINES[state.settings.defaultSearchEngine]?.name || 'Google'} or enter URL`}
              autoFocus
            />
            {query && (
              <button type="submit" className={styles.searchBtn}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* Quick Links */}
        <div className={styles.quickLinks}>
          {QUICK_LINKS.map(link => (
            <button key={link.url} className={styles.quickLink} onClick={() => navigate(link.url)}>
              <span className={styles.quickIcon}>{link.icon}</span>
              <span className={styles.quickLabel}>{link.label}</span>
            </button>
          ))}
        </div>

        {/* AI Command Bar */}
        {state.settings.mode !== 'locked' && (
          <form onSubmit={handleAiCommand} className={styles.aiBar}>
            <div className={styles.aiBarWrapper}>
              <span className={styles.aiBarIcon}>⚡</span>
              <input
                className={styles.aiBarInput}
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                placeholder="Ask AI anything... e.g. 'Summarize my saved articles'"
              />
              {aiQuery && (
                <button type="submit" className={styles.aiBarBtn}>Ask AI</button>
              )}
            </div>
            <div className={styles.aiSuggestions}>
              {AI_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  className={styles.aiSuggestion}
                  onClick={() => {
                    dispatch({ type: 'SET_SIDEBAR_TAB', tab: 'chat' })
                    dispatch({ type: 'ADD_AI_MESSAGE', message: { id: `msg-${Date.now()}`, role: 'user', content: s, timestamp: new Date() } })
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </form>
        )}
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{state.privacyStats.trackersBlocked + state.privacyStats.adsBlocked}</span>
          <span className={styles.statLabel}>Trackers & Ads Blocked</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{state.history.length}</span>
          <span className={styles.statLabel}>Pages Visited</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{state.bookmarks.length}</span>
          <span className={styles.statLabel}>Bookmarks</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{state.savedNotes.length}</span>
          <span className={styles.statLabel}>Saved Notes</span>
        </div>
      </div>

      {/* Recent History */}
      {state.history.length > 0 && (
        <div className={styles.recentSection}>
          <div className={styles.recentTitle}>Recent</div>
          <div className={styles.recentList}>
            {state.history.slice(0, 6).map(h => (
              <button key={h.id} className={styles.recentItem} onClick={() => navigate(h.url)}>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${new URL(h.url).hostname}&sz=16`}
                  alt=""
                  className={styles.recentFavicon}
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
                <span className={styles.recentLabel}>{h.title || h.url}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
