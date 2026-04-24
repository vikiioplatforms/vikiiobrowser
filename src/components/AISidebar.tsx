import { useState, useRef, useEffect } from 'react'
import { useBrowser } from '../store/browserStore'
import type { AIMessage } from '../types'
import styles from './AISidebar.module.css'

const PANEL_TABS = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'summary', label: 'Summary', icon: '📄' },
  { id: 'actions', label: 'Actions', icon: '⚡' },
  { id: 'tabs', label: 'Tabs', icon: '📑' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'history', label: 'History', icon: '🕐' },
  { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
  { id: 'downloads', label: 'Downloads', icon: '⬇️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const

export function AISidebar() {
  const { state, dispatch } = useBrowser()
  const { sidebarTab, currentConversation, isAiLoading, settings } = state

  return (
    <div className={styles.sidebar}>
      {/* Sidebar Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.aiLogo}>⚡</span>
          <span>Vikiio AI</span>
        </div>
        <button
          className={styles.closeBtn}
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          title="Close sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        {PANEL_TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${sidebarTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => dispatch({ type: 'SET_SIDEBAR_TAB', tab: tab.id })}
            title={tab.label}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className={styles.panelContent}>
        {sidebarTab === 'chat' && <ChatPanel />}
        {sidebarTab === 'summary' && <SummaryPanel />}
        {sidebarTab === 'actions' && <ActionsPanel />}
        {sidebarTab === 'tabs' && <TabsPanel />}
        {sidebarTab === 'notes' && <NotesPanel />}
        {sidebarTab === 'history' && <HistoryPanel />}
        {sidebarTab === 'bookmarks' && <BookmarksPanel />}
        {sidebarTab === 'downloads' && <DownloadsPanel />}
        {sidebarTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}

/* ─── Chat Panel ─────────────────────────────────────────── */
function ChatPanel() {
  const { state, dispatch } = useBrowser()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messages = state.currentConversation?.messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || state.isAiLoading) return
    const userMsg: AIMessage = { id: `msg-${Date.now()}`, role: 'user', content: input, timestamp: new Date() }
    dispatch({ type: 'ADD_AI_MESSAGE', message: userMsg })
    setInput('')
    dispatch({ type: 'SET_AI_LOADING', loading: true })

    try {
      const activeTab = state.tabs.find(t => t.id === state.activeTabId)
      const systemPrompt = `You are Vikiio AI, a privacy-first browser assistant. 
Browser mode: ${state.settings.mode}. 
Current page: ${activeTab?.title || 'New Tab'} (${activeTab?.url || 'newtab'}).
Be helpful, concise, and privacy-aware. Never store or reveal sensitive data.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.settings.aiApiKey || import.meta.env.VITE_OPENAI_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input },
          ],
          max_tokens: 600,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const reply = data.choices?.[0]?.message?.content || 'I could not generate a response.'
        dispatch({
          type: 'ADD_AI_MESSAGE',
          message: { id: `msg-${Date.now()}`, role: 'assistant', content: reply, timestamp: new Date() }
        })
      } else {
        throw new Error('API error')
      }
    } catch {
      dispatch({
        type: 'ADD_AI_MESSAGE',
        message: {
          id: `msg-${Date.now()}`, role: 'assistant',
          content: state.settings.aiApiKey
            ? 'Sorry, I encountered an error. Please check your API key in Settings.'
            : 'Please add your OpenAI API key in Settings → AI Assistant to enable chat.',
          timestamp: new Date()
        }
      })
    } finally {
      dispatch({ type: 'SET_AI_LOADING', loading: false })
    }
  }

  return (
    <div className={styles.chatPanel}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatIcon}>⚡</div>
            <div className={styles.emptyChatTitle}>Vikiio AI Assistant</div>
            <div className={styles.emptyChatDesc}>Ask me anything about the current page, your tabs, or the web.</div>
            <div className={styles.chatSuggestions}>
              {['Summarize this page', 'Compare open tabs', 'Extract key points', 'Translate this page'].map(s => (
                <button key={s} className={styles.chatSuggestion} onClick={() => setInput(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.message} ${styles[msg.role]}`}>
            {msg.role === 'assistant' && <div className={styles.msgAvatar}>⚡</div>}
            <div className={styles.msgBubble}>
              <div className={styles.msgContent}>{msg.content}</div>
              <div className={styles.msgTime}>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
        {state.isAiLoading && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.msgAvatar}>⚡</div>
            <div className={styles.msgBubble}>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.chatInput}>
        <textarea
          className={styles.chatTextarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Ask AI anything..."
          rows={2}
        />
        <div className={styles.chatActions}>
          <button className={styles.clearChat} onClick={() => dispatch({ type: 'CLEAR_AI_CONVERSATION' })}>Clear</button>
          <button
            className={`${styles.sendBtn} ${(!input.trim() || state.isAiLoading) ? styles.sendDisabled : ''}`}
            onClick={sendMessage}
            disabled={!input.trim() || state.isAiLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Summary Panel ──────────────────────────────────────── */
function SummaryPanel() {
  const { state, dispatch } = useBrowser()
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const activeTab = state.tabs.find(t => t.id === state.activeTabId)

  const summarize = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.settings.aiApiKey || ''}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a browser assistant. Summarize the given webpage URL in 3-5 bullet points.' },
            { role: 'user', content: `Summarize this page: ${activeTab?.url}\nTitle: ${activeTab?.title}` },
          ],
          max_tokens: 300,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setSummary(data.choices?.[0]?.message?.content || 'Could not summarize.')
      }
    } catch {
      setSummary(state.settings.aiApiKey ? 'Error generating summary.' : 'Add your OpenAI API key in Settings to use AI features.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Current Page</div>
        <div className={styles.pageInfo}>
          <div className={styles.pageTitle}>{activeTab?.title || 'New Tab'}</div>
          <div className={styles.pageUrl}>{activeTab?.url === 'newtab' ? '—' : activeTab?.url}</div>
        </div>
        <div className={styles.pageStats}>
          <span className={styles.statChip}>🛡️ {(activeTab?.trackersBlocked ?? 0) + (activeTab?.adsBlocked ?? 0)} blocked</span>
        </div>
      </div>

      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>AI Summary</div>
        {summary ? (
          <div className={styles.summaryText}>{summary}</div>
        ) : (
          <div className={styles.emptyState}>No summary yet. Click below to generate one.</div>
        )}
        <button
          className={styles.actionButton}
          onClick={summarize}
          disabled={loading || !activeTab || activeTab.url === 'newtab'}
        >
          {loading ? 'Summarizing...' : '✨ Summarize This Page'}
        </button>
        {summary && (
          <button
            className={styles.secondaryButton}
            onClick={() => {
              dispatch({
                type: 'ADD_NOTE',
                note: { id: `note-${Date.now()}`, title: activeTab?.title || 'Page Summary', content: summary, url: activeTab?.url, createdAt: new Date(), updatedAt: new Date() }
              })
            }}
          >
            💾 Save as Note
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Actions Panel ──────────────────────────────────────── */
function ActionsPanel() {
  const { state, dispatch } = useBrowser()
  const activeTab = state.tabs.find(t => t.id === state.activeTabId)

  const sendAiAction = (prompt: string) => {
    dispatch({ type: 'SET_SIDEBAR_TAB', tab: 'chat' })
    dispatch({ type: 'ADD_AI_MESSAGE', message: { id: `msg-${Date.now()}`, role: 'user', content: prompt, timestamp: new Date() } })
  }

  const PAGE_ACTIONS = [
    { icon: '📄', label: 'Summarize Page', prompt: `Summarize this page: ${activeTab?.url}` },
    { icon: '💡', label: 'Explain Page', prompt: `Explain the main content of: ${activeTab?.url}` },
    { icon: '🌍', label: 'Translate Page', prompt: `Translate the content of this page to English: ${activeTab?.url}` },
    { icon: '📊', label: 'Extract Data', prompt: `Extract all structured data (tables, lists, key facts) from: ${activeTab?.url}` },
    { icon: '🔑', label: 'Find Key Points', prompt: `List the 5 most important key points from: ${activeTab?.url}` },
    { icon: '✅', label: 'Convert to Checklist', prompt: `Convert the content of this page into an actionable checklist: ${activeTab?.url}` },
  ]

  const TAB_ACTIONS = [
    { icon: '🔀', label: 'Compare Open Tabs', prompt: `Compare these open tabs: ${state.tabs.filter(t => t.url !== 'newtab').map(t => t.url).join(', ')}` },
    { icon: '📁', label: 'Group Tabs by Topic', prompt: `Suggest how to group these tabs by topic: ${state.tabs.map(t => t.title).join(', ')}` },
    { icon: '📋', label: 'Summarize All Tabs', prompt: `Provide a brief summary of what each of these tabs is about: ${state.tabs.map(t => `${t.title} (${t.url})`).join('\n')}` },
  ]

  const RESEARCH_ACTIONS = [
    { icon: '📑', label: 'Build Research Brief', prompt: `Create a research brief based on: ${activeTab?.url}` },
    { icon: '📎', label: 'Extract Citations', prompt: `Extract all citations and references from: ${activeTab?.url}` },
    { icon: '🛒', label: 'Compare Prices', prompt: `Help me compare prices for products on: ${activeTab?.url}` },
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Page Actions</div>
        <div className={styles.actionGrid}>
          {PAGE_ACTIONS.map(a => (
            <button key={a.label} className={styles.actionChip} onClick={() => sendAiAction(a.prompt)}>
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Tab Actions</div>
        <div className={styles.actionGrid}>
          {TAB_ACTIONS.map(a => (
            <button key={a.label} className={styles.actionChip} onClick={() => sendAiAction(a.prompt)}>
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Research Actions</div>
        <div className={styles.actionGrid}>
          {RESEARCH_ACTIONS.map(a => (
            <button key={a.label} className={styles.actionChip} onClick={() => sendAiAction(a.prompt)}>
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Tabs Panel ─────────────────────────────────────────── */
function TabsPanel() {
  const { state, dispatch } = useBrowser()

  return (
    <div className={styles.panel}>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Open Tabs ({state.tabs.length})</div>
        <div className={styles.tabList}>
          {state.tabs.map(tab => (
            <div
              key={tab.id}
              className={`${styles.tabListItem} ${tab.id === state.activeTabId ? styles.tabListActive : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', id: tab.id })}
            >
              <div className={styles.tabListIcon}>
                {tab.url === 'newtab' ? '⚡' : '🌐'}
              </div>
              <div className={styles.tabListInfo}>
                <div className={styles.tabListTitle}>{tab.title}</div>
                <div className={styles.tabListUrl}>{tab.url === 'newtab' ? 'New Tab' : tab.url}</div>
              </div>
              <button
                className={styles.tabListClose}
                onClick={e => { e.stopPropagation(); dispatch({ type: 'CLOSE_TAB', id: tab.id }) }}
              >×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Notes Panel ────────────────────────────────────────── */
function NotesPanel() {
  const { state, dispatch } = useBrowser()
  const [newNote, setNewNote] = useState('')
  const [newTitle, setNewTitle] = useState('')

  const addNote = () => {
    if (!newNote.trim()) return
    dispatch({
      type: 'ADD_NOTE',
      note: {
        id: `note-${Date.now()}`,
        title: newTitle || 'Untitled Note',
        content: newNote,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
    setNewNote('')
    setNewTitle('')
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>New Note</div>
        <input
          className={styles.noteInput}
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Note title..."
        />
        <textarea
          className={styles.noteTextarea}
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Write your note..."
          rows={4}
        />
        <button className={styles.actionButton} onClick={addNote}>💾 Save Note</button>
      </div>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Saved Notes ({state.savedNotes.length})</div>
        {state.savedNotes.length === 0 && <div className={styles.emptyState}>No notes yet.</div>}
        {state.savedNotes.map(note => (
          <div key={note.id} className={styles.noteCard}>
            <div className={styles.noteCardTitle}>{note.title}</div>
            <div className={styles.noteCardContent}>{note.content}</div>
            <div className={styles.noteCardMeta}>{note.createdAt.toLocaleDateString()}</div>
            <button className={styles.deleteBtn} onClick={() => dispatch({ type: 'DELETE_NOTE', id: note.id })}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── History Panel ──────────────────────────────────────── */
function HistoryPanel() {
  const { state, dispatch } = useBrowser()

  return (
    <div className={styles.panel}>
      <div className={styles.panelSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Browsing History</div>
          {state.history.length > 0 && (
            <button className={styles.clearBtn2} onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}>Clear All</button>
          )}
        </div>
        {state.history.length === 0 && <div className={styles.emptyState}>No history yet.</div>}
        {state.history.map(h => (
          <div
            key={h.id}
            className={styles.historyItem}
            onClick={() => dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url: h.url, title: h.title, isLoading: true } })}
          >
            <div className={styles.historyTitle}>{h.title}</div>
            <div className={styles.historyUrl}>{h.url}</div>
            <div className={styles.historyTime}>{h.visitedAt.toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Bookmarks Panel ────────────────────────────────────── */
function BookmarksPanel() {
  const { state, dispatch } = useBrowser()

  return (
    <div className={styles.panel}>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Bookmarks ({state.bookmarks.length})</div>
        {state.bookmarks.map(bm => (
          <div key={bm.id} className={styles.bookmarkItem}>
            <div
              className={styles.bookmarkInfo}
              onClick={() => dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url: bm.url, title: bm.title, isLoading: true } })}
            >
              <div className={styles.bookmarkTitle}>{bm.title}</div>
              <div className={styles.bookmarkUrl}>{bm.url}</div>
            </div>
            <button className={styles.deleteBtn} onClick={() => dispatch({ type: 'REMOVE_BOOKMARK', id: bm.id })}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Downloads Panel ────────────────────────────────────── */
function DownloadsPanel() {
  const { state } = useBrowser()

  return (
    <div className={styles.panel}>
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Downloads</div>
        {state.downloads.length === 0 && <div className={styles.emptyState}>No downloads yet.</div>}
        {state.downloads.map(d => (
          <div key={d.id} className={styles.downloadItem}>
            <div className={styles.downloadName}>{d.filename}</div>
            <div className={styles.downloadProgress}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${(d.downloaded / d.size) * 100}%` }} />
              </div>
              <span className={styles.downloadStatus}>{d.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Settings Panel ─────────────────────────────────────── */
function SettingsPanel() {
  const { state, dispatch } = useBrowser()
  const { settings } = state
  const [apiKey, setApiKey] = useState(settings.aiApiKey)

  const update = (updates: Partial<typeof settings>) => dispatch({ type: 'UPDATE_SETTINGS', settings: updates })

  return (
    <div className={styles.panel}>
      {/* General */}
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>General</div>
        <div className={styles.settingRow}>
          <span>Default Search Engine</span>
          <select
            className={styles.select}
            value={settings.defaultSearchEngine}
            onChange={e => update({ defaultSearchEngine: e.target.value })}
          >
            <option value="google">Google</option>
            <option value="bing">Bing</option>
            <option value="duckduckgo">DuckDuckGo</option>
            <option value="brave">Brave Search</option>
          </select>
        </div>
        <div className={styles.settingRow}>
          <span>Show Bookmark Bar</span>
          <button
            className={`${styles.toggle} ${settings.showBookmarkBar ? styles.toggleOn : ''}`}
            onClick={() => update({ showBookmarkBar: !settings.showBookmarkBar })}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Privacy & Security</div>
        {[
          { key: 'adBlocking', label: 'Ad Blocking' },
          { key: 'trackerBlocking', label: 'Tracker Blocking' },
          { key: 'cookieBlocking', label: 'Cookie Blocking' },
          { key: 'fingerprintProtection', label: 'Fingerprint Protection' },
          { key: 'vpnEnabled', label: 'VPN (Simulated)' },
        ].map(item => (
          <div key={item.key} className={styles.settingRow}>
            <span>{item.label}</span>
            <button
              className={`${styles.toggle} ${settings[item.key as keyof typeof settings] ? styles.toggleOn : ''}`}
              onClick={() => update({ [item.key]: !settings[item.key as keyof typeof settings] })}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        ))}
      </div>

      {/* AI */}
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>AI Assistant</div>
        <div className={styles.settingRow}>
          <span>Enable AI</span>
          <button
            className={`${styles.toggle} ${settings.aiEnabled ? styles.toggleOn : ''}`}
            onClick={() => update({ aiEnabled: !settings.aiEnabled })}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>
        <div className={styles.settingGroup}>
          <label className={styles.settingLabel}>OpenAI API Key</label>
          <div className={styles.apiKeyRow}>
            <input
              type="password"
              className={styles.apiKeyInput}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <button
              className={styles.saveBtn}
              onClick={() => update({ aiApiKey: apiKey })}
            >Save</button>
          </div>
          <p className={styles.settingHint}>Required for AI chat, summaries, and actions.</p>
        </div>
      </div>

      {/* Browser Mode */}
      <div className={styles.panelSection}>
        <div className={styles.sectionTitle}>Browser Mode</div>
        {[
          { value: 'normal', label: 'Normal', desc: 'Default browsing' },
          { value: 'private', label: 'Private', desc: 'No history, no cookies' },
          { value: 'work', label: 'Work', desc: 'Productivity focused' },
          { value: 'anonymous', label: 'Anonymous', desc: 'High privacy, no cloud AI' },
          { value: 'locked', label: 'Locked', desc: 'Ultra-secure, auto-wipe' },
        ].map(m => (
          <div
            key={m.value}
            className={`${styles.modeCard} ${settings.mode === m.value ? styles.modeCardActive : ''}`}
            onClick={() => dispatch({ type: 'SET_BROWSER_MODE', mode: m.value as any })}
          >
            <div className={styles.modeCardLabel}>{m.label}</div>
            <div className={styles.modeCardDesc}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
