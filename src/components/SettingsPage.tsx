import { useState } from 'react'
import { useBrowser } from '../store/browserStore'
import styles from './SettingsPage.module.css'

type SettingsCategory =
  | 'appearance'
  | 'privacy'
  | 'ai'
  | 'search'
  | 'tabs'
  | 'downloads'
  | 'shortcuts'
  | 'about'

const CATEGORIES: { id: SettingsCategory; label: string; icon: string; desc: string }[] = [
  { id: 'appearance', label: 'Appearance', icon: '🎨', desc: 'Theme, fonts, layout' },
  { id: 'privacy',    label: 'Privacy & Security', icon: '🛡️', desc: 'Shields, cookies, VPN' },
  { id: 'ai',         label: 'AI Assistant', icon: '🤖', desc: 'Models, API keys, memory' },
  { id: 'search',     label: 'Search', icon: '🔍', desc: 'Default engine, suggestions' },
  { id: 'tabs',       label: 'Tabs & Workspaces', icon: '🗂️', desc: 'Tab behaviour, groups' },
  { id: 'downloads',  label: 'Downloads', icon: '⬇️', desc: 'Save location, auto-open' },
  { id: 'shortcuts',  label: 'Keyboard Shortcuts', icon: '⌨️', desc: 'View all shortcuts' },
  { id: 'about',      label: 'About', icon: 'ℹ️', desc: 'Version, licenses, updates' },
]

/* ── Reusable primitives ─────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLabel}>
        <span className={styles.rowTitle}>{label}</span>
        {desc && <span className={styles.rowDesc}>{desc}</span>}
      </div>
      <div className={styles.rowControl}>{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select className={styles.select} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

/* ── Category panels ─────────────────────────────────────────────────────── */

function AppearancePanel() {
  const { state, dispatch } = useBrowser()
  const s = state.settings
  const update = (patch: Partial<typeof s>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch })

  return (
    <>
      <Section title="Theme">
        <Row label="Color theme" desc="Choose how Vikiio Browser looks">
          <div className={styles.themeCards}>
            {(['dark', 'light', 'system'] as const).map(t => (
              <button
                key={t}
                className={`${styles.themeCard} ${s.theme === t ? styles.themeCardActive : ''}`}
                onClick={() => update({ theme: t })}
              >
                <div className={`${styles.themePreview} ${styles[`themePreview_${t}`]}`}>
                  <div className={styles.themePreviewBar} />
                  <div className={styles.themePreviewContent} />
                </div>
                <span className={styles.themeCardLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Layout">
        <Row label="Show bookmark bar" desc="Display bookmarks below the toolbar">
          <Toggle on={s.showBookmarkBar} onChange={v => update({ showBookmarkBar: v })} />
        </Row>
        <Row label="Compact mode" desc="Reduce padding and spacing throughout the UI">
          <Toggle on={false} onChange={() => {}} />
        </Row>
        <Row label="Show status bar" desc="Show URL preview and connection info at the bottom">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Sidebar position" desc="Which side the AI sidebar opens on">
          <Select value="right" onChange={() => {}} options={[
            { value: 'right', label: 'Right' },
            { value: 'left', label: 'Left' },
          ]} />
        </Row>
      </Section>

      <Section title="New Tab Page">
        <Row label="Show clock" desc="Display the current time on the new tab page">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Show Vikiio Pay card" desc="Display your wallet balance on the new tab page">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Show privacy stats" desc="Show trackers blocked and pages visited">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Background style" desc="New tab page background appearance">
          <Select value="gradient" onChange={() => {}} options={[
            { value: 'gradient', label: 'Gradient' },
            { value: 'solid', label: 'Solid dark' },
            { value: 'custom', label: 'Custom image' },
          ]} />
        </Row>
      </Section>

      <Section title="Font">
        <Row label="UI font size" desc="Scale the browser interface text">
          <Select value="medium" onChange={() => {}} options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium (default)' },
            { value: 'large', label: 'Large' },
          ]} />
        </Row>
      </Section>
    </>
  )
}

function PrivacyPanel() {
  const { state, dispatch } = useBrowser()
  const s = state.settings
  const update = (patch: Partial<typeof s>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch })

  return (
    <>
      <Section title="Privacy Shields">
        <Row label="Shield level" desc="Preset protection level">
          <div className={styles.shieldLevelBtns}>
            {(['standard', 'strict', 'custom'] as const).map(lvl => (
              <button
                key={lvl}
                className={`${styles.levelBtn} ${s.shieldLevel === lvl ? styles.levelBtnActive : ''}`}
                onClick={() => update({ shieldLevel: lvl })}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Ad blocking" desc="Block advertisements across all websites">
          <Toggle on={s.adBlocking} onChange={v => update({ adBlocking: v })} />
        </Row>
        <Row label="Tracker blocking" desc="Prevent third-party trackers from following you">
          <Toggle on={s.trackerBlocking} onChange={v => update({ trackerBlocking: v })} />
        </Row>
        <Row label="Cookie blocking" desc="Block third-party cookies">
          <Toggle on={s.cookieBlocking} onChange={v => update({ cookieBlocking: v })} />
        </Row>
        <Row label="Fingerprint protection" desc="Randomise browser fingerprint to prevent tracking">
          <Toggle on={s.fingerprintProtection} onChange={v => update({ fingerprintProtection: v })} />
        </Row>
      </Section>

      <Section title="VPN & Network">
        <Row label="VPN" desc="Route traffic through Vikiio's encrypted VPN">
          <Toggle on={s.vpnEnabled} onChange={v => update({ vpnEnabled: v })} />
        </Row>
        <Row label="HTTPS-only mode" desc="Automatically upgrade connections to HTTPS">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="DNS over HTTPS" desc="Encrypt DNS queries to prevent snooping">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="DoH provider" desc="DNS-over-HTTPS resolver">
          <Select value="cloudflare" onChange={() => {}} options={[
            { value: 'cloudflare', label: 'Cloudflare (1.1.1.1)' },
            { value: 'google', label: 'Google (8.8.8.8)' },
            { value: 'quad9', label: 'Quad9 (9.9.9.9)' },
            { value: 'custom', label: 'Custom…' },
          ]} />
        </Row>
      </Section>

      <Section title="Data & History">
        <Row label="Save browsing history" desc="Keep a local record of visited pages">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Save form data" desc="Remember information entered in forms">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Clear data on close" desc="Wipe history, cookies, and cache when the browser closes">
          <Toggle on={s.mode === 'anonymous' || s.mode === 'locked'} onChange={() => {}} />
        </Row>
        <Row label="Clear browsing data" desc="Delete history, cookies, and cached files now">
          <button className={styles.dangerBtn} onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}>
            Clear now
          </button>
        </Row>
      </Section>
    </>
  )
}

function AIPanel() {
  const { state, dispatch } = useBrowser()
  const s = state.settings
  const update = (patch: Partial<typeof s>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch })
  const [showKey, setShowKey] = useState(false)

  return (
    <>
      <Section title="AI Provider">
        <Row label="Enable AI assistant" desc="Show the AI sidebar and AI features throughout the browser">
          <Toggle on={s.aiEnabled} onChange={v => update({ aiEnabled: v })} />
        </Row>
        <Row label="AI provider" desc="Which AI service to use for the assistant">
          <Select value="openai" onChange={() => {}} options={[
            { value: 'openai', label: 'OpenAI (cloud)' },
            { value: 'ollama', label: 'Ollama (local)' },
            { value: 'anthropic', label: 'Anthropic Claude' },
          ]} />
        </Row>
        <Row label="OpenAI API key" desc="Required for cloud AI features">
          <div className={styles.apiKeyRow}>
            <input
              type={showKey ? 'text' : 'password'}
              className={styles.apiKeyInput}
              value={s.aiApiKey}
              onChange={e => update({ aiApiKey: e.target.value })}
              placeholder="sk-..."
              spellCheck={false}
            />
            <button className={styles.iconBtn} onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide' : 'Show'}>
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
        </Row>
        <Row label="AI model" desc="Which model to use for chat and summarisation">
          <Select value="gpt-4o-mini" onChange={() => {}} options={[
            { value: 'gpt-4o-mini', label: 'GPT-4o Mini (fast)' },
            { value: 'gpt-4o', label: 'GPT-4o (powerful)' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          ]} />
        </Row>
      </Section>

      <Section title="AI Behaviour">
        <Row label="Page-aware context" desc="Allow AI to read the current page content for better answers">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="AI memory" desc="Remember context across conversations">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Proactive suggestions" desc="Show AI suggestions while browsing">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Auto-summarise pages" desc="Automatically generate a summary when you open a new page">
          <Toggle on={false} onChange={() => {}} />
        </Row>
        <Row label="AI in private mode" desc="Allow AI features when browsing in private mode">
          <Toggle on={false} onChange={() => {}} />
        </Row>
      </Section>

      <Section title="Local AI (Ollama)">
        <Row label="Ollama endpoint" desc="URL where Ollama is running locally">
          <input
            type="text"
            className={styles.textInput}
            defaultValue="http://localhost:11434"
            placeholder="http://localhost:11434"
          />
        </Row>
        <Row label="Preferred local model" desc="Default model to use when Ollama is available">
          <Select value="llama3.2" onChange={() => {}} options={[
            { value: 'llama3.2', label: 'Llama 3.2' },
            { value: 'mistral', label: 'Mistral 7B' },
            { value: 'phi3', label: 'Phi-3 Mini' },
            { value: 'gemma2', label: 'Gemma 2' },
          ]} />
        </Row>
        <Row label="Fallback to cloud AI" desc="Use OpenAI if Ollama is unavailable">
          <Toggle on={true} onChange={() => {}} />
        </Row>
      </Section>
    </>
  )
}

function SearchPanel() {
  const { state, dispatch } = useBrowser()
  const s = state.settings
  const update = (patch: Partial<typeof s>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch })

  const engines = [
    { value: 'google',     label: 'Google',     url: 'https://google.com/search?q=' },
    { value: 'bing',       label: 'Bing',        url: 'https://bing.com/search?q=' },
    { value: 'duckduckgo', label: 'DuckDuckGo',  url: 'https://duckduckgo.com/?q=' },
    { value: 'brave',      label: 'Brave Search', url: 'https://search.brave.com/search?q=' },
    { value: 'ecosia',     label: 'Ecosia',      url: 'https://ecosia.org/search?q=' },
    { value: 'startpage',  label: 'Startpage',   url: 'https://startpage.com/search?q=' },
  ]

  return (
    <>
      <Section title="Default Search Engine">
        <div className={styles.engineGrid}>
          {engines.map(e => (
            <button
              key={e.value}
              className={`${styles.engineCard} ${s.defaultSearchEngine === e.value ? styles.engineCardActive : ''}`}
              onClick={() => update({ defaultSearchEngine: e.value })}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(e.url).hostname}&sz=32`}
                alt=""
                className={styles.engineFavicon}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              <span>{e.label}</span>
              {s.defaultSearchEngine === e.value && <span className={styles.engineCheck}>✓</span>}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Search Behaviour">
        <Row label="Search suggestions" desc="Show search suggestions as you type in the address bar">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Address bar search" desc="Use the address bar as a search box">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="AI search enhancement" desc="Augment search results with AI summaries">
          <Toggle on={s.aiEnabled} onChange={() => {}} />
        </Row>
        <Row label="Safe search" desc="Filter explicit content from search results">
          <Select value="moderate" onChange={() => {}} options={[
            { value: 'off', label: 'Off' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'strict', label: 'Strict' },
          ]} />
        </Row>
      </Section>

      <Section title="Homepage">
        <Row label="Homepage" desc="What to show when you open a new tab or click Home">
          <Select value={s.homepage} onChange={v => update({ homepage: v })} options={[
            { value: 'newtab', label: 'Vikiio New Tab' },
            { value: 'blank', label: 'Blank page' },
            { value: 'custom', label: 'Custom URL…' },
          ]} />
        </Row>
      </Section>
    </>
  )
}

function TabsPanel() {
  return (
    <>
      <Section title="Tab Behaviour">
        <Row label="Open links in new tab" desc="Middle-click or Ctrl+click opens a new tab">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Confirm before closing multiple tabs" desc="Ask before closing a window with multiple tabs">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Restore tabs on startup" desc="Reopen tabs from the last session when the browser starts">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Tab preview on hover" desc="Show a preview thumbnail when hovering over a tab">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Mute new tabs by default" desc="New tabs start with audio muted">
          <Toggle on={false} onChange={() => {}} />
        </Row>
      </Section>

      <Section title="Tab Groups">
        <Row label="Enable tab groups" desc="Organise tabs into colour-coded groups">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Auto-group by domain" desc="Automatically group tabs from the same website">
          <Toggle on={false} onChange={() => {}} />
        </Row>
        <Row label="Collapse groups by default" desc="Start with tab groups collapsed">
          <Toggle on={false} onChange={() => {}} />
        </Row>
      </Section>

      <Section title="Workspaces">
        <Row label="Enable workspaces" desc="Organise tabs into separate workspace contexts">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Sync workspaces" desc="Sync workspace layout across devices (requires E2E sync)">
          <Toggle on={false} onChange={() => {}} />
        </Row>
      </Section>
    </>
  )
}

function DownloadsPanel() {
  return (
    <>
      <Section title="Download Location">
        <Row label="Default download folder" desc="Where downloaded files are saved">
          <div className={styles.folderRow}>
            <input type="text" className={styles.textInput} defaultValue="~/Downloads" readOnly />
            <button className={styles.secondaryBtn}>Browse…</button>
          </div>
        </Row>
        <Row label="Ask where to save" desc="Prompt for a location before each download">
          <Toggle on={false} onChange={() => {}} />
        </Row>
      </Section>

      <Section title="Download Behaviour">
        <Row label="Auto-open after download" desc="Automatically open files when the download completes">
          <Toggle on={false} onChange={() => {}} />
        </Row>
        <Row label="Show download shelf" desc="Show the download bar at the bottom of the window">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Scan downloads for malware" desc="Check downloaded files for threats before opening">
          <Toggle on={true} onChange={() => {}} />
        </Row>
        <Row label="Maximum concurrent downloads" desc="How many files can download simultaneously">
          <Select value="3" onChange={() => {}} options={[
            { value: '1', label: '1' },
            { value: '3', label: '3 (default)' },
            { value: '5', label: '5' },
            { value: '10', label: '10' },
          ]} />
        </Row>
      </Section>
    </>
  )
}

function ShortcutsPanel() {
  const shortcuts = [
    { action: 'New tab',                  keys: ['Ctrl', 'T'] },
    { action: 'Close tab',                keys: ['Ctrl', 'W'] },
    { action: 'Reopen closed tab',        keys: ['Ctrl', 'Shift', 'T'] },
    { action: 'Next tab',                 keys: ['Ctrl', 'Tab'] },
    { action: 'Previous tab',             keys: ['Ctrl', 'Shift', 'Tab'] },
    { action: 'Switch to tab 1–9',        keys: ['Ctrl', '1–9'] },
    { action: 'Reload page',              keys: ['Ctrl', 'R'] },
    { action: 'Hard reload',              keys: ['Ctrl', 'Shift', 'R'] },
    { action: 'Focus address bar',        keys: ['Ctrl', 'L'] },
    { action: 'Open AI sidebar',          keys: ['Ctrl', 'Shift', 'A'] },
    { action: 'Toggle bookmark bar',      keys: ['Ctrl', 'Shift', 'B'] },
    { action: 'Bookmark this page',       keys: ['Ctrl', 'D'] },
    { action: 'Open downloads',           keys: ['Ctrl', 'J'] },
    { action: 'Open history',             keys: ['Ctrl', 'H'] },
    { action: 'Open settings',            keys: ['Ctrl', ','] },
    { action: 'Find in page',             keys: ['Ctrl', 'F'] },
    { action: 'Zoom in',                  keys: ['Ctrl', '+'] },
    { action: 'Zoom out',                 keys: ['Ctrl', '-'] },
    { action: 'Reset zoom',               keys: ['Ctrl', '0'] },
    { action: 'Toggle full screen',       keys: ['F11'] },
    { action: 'Developer tools',          keys: ['F12'] },
    { action: 'Private mode tab',         keys: ['Ctrl', 'Shift', 'P'] },
  ]

  return (
    <Section title="Keyboard Shortcuts">
      <div className={styles.shortcutList}>
        {shortcuts.map(s => (
          <div key={s.action} className={styles.shortcutRow}>
            <span className={styles.shortcutAction}>{s.action}</span>
            <div className={styles.shortcutKeys}>
              {s.keys.map((k, i) => (
                <span key={i} className={styles.key}>{k}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function AboutPanel() {
  return (
    <>
      <Section title="Vikiio Browser">
        <div className={styles.aboutCard}>
          <div className={styles.aboutLogo}>
            <img src="/favicon.png" alt="Vikiio" style={{ width: 56, height: 56 }} />
          </div>
          <div className={styles.aboutInfo}>
            <div className={styles.aboutName}>Vikiio Browser</div>
            <div className={styles.aboutVersion}>Version 1.0.0 (Build 2026.04.25)</div>
            <div className={styles.aboutDesc}>
              An AI-powered privacy browser built on Chromium. Fast, private, and intelligent.
            </div>
          </div>
        </div>
        <Row label="Check for updates" desc="You are on the latest version">
          <button className={styles.secondaryBtn}>Check now</button>
        </Row>
        <Row label="Release notes" desc="See what's new in this version">
          <button className={styles.secondaryBtn} onClick={() => window.open('https://github.com/vikiioplatforms/vikiiobrowser/releases', '_blank')}>
            View on GitHub
          </button>
        </Row>
      </Section>

      <Section title="Engine">
        <Row label="Chromium version" desc="Underlying browser engine">
          <span className={styles.infoValue}>Chromium 124.0.6367.82</span>
        </Row>
        <Row label="Electron version" desc="Desktop framework">
          <span className={styles.infoValue}>Electron 30.0.0</span>
        </Row>
        <Row label="Node.js version" desc="JavaScript runtime">
          <span className={styles.infoValue}>Node.js 20.11.0</span>
        </Row>
        <Row label="V8 version" desc="JavaScript engine">
          <span className={styles.infoValue}>V8 12.4.254.14</span>
        </Row>
      </Section>

      <Section title="Legal">
        <Row label="Privacy policy" desc="How Vikiio handles your data">
          <button className={styles.secondaryBtn} onClick={() => window.open('https://vikiiobrowser.com/privacy', '_blank')}>
            Read policy
          </button>
        </Row>
        <Row label="Open source licenses" desc="Third-party libraries used in this app">
          <button className={styles.secondaryBtn}>View licenses</button>
        </Row>
        <Row label="GitHub repository" desc="View and contribute to the source code">
          <button className={styles.secondaryBtn} onClick={() => window.open('https://github.com/vikiioplatforms/vikiiobrowser', '_blank')}>
            Open GitHub
          </button>
        </Row>
      </Section>

      <Section title="Diagnostics">
        <Row label="Export diagnostic report" desc="Generate a report to help debug issues">
          <button className={styles.secondaryBtn}>Export report</button>
        </Row>
        <Row label="Reset all settings" desc="Restore all settings to their defaults">
          <button className={styles.dangerBtn}>Reset settings</button>
        </Row>
      </Section>
    </>
  )
}

/* ── Main SettingsPage ───────────────────────────────────────────────────── */
export function SettingsPage() {
  const [active, setActive] = useState<SettingsCategory>('appearance')

  const panels: Record<SettingsCategory, React.ReactNode> = {
    appearance: <AppearancePanel />,
    privacy:    <PrivacyPanel />,
    ai:         <AIPanel />,
    search:     <SearchPanel />,
    tabs:       <TabsPanel />,
    downloads:  <DownloadsPanel />,
    shortcuts:  <ShortcutsPanel />,
    about:      <AboutPanel />,
  }

  const current = CATEGORIES.find(c => c.id === active)!

  return (
    <div className={styles.settings}>
      {/* Sidebar nav */}
      <nav className={styles.nav}>
        <div className={styles.navHeader}>
          <span className={styles.navTitle}>Settings</span>
        </div>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`${styles.navItem} ${active === cat.id ? styles.navItemActive : ''}`}
            onClick={() => setActive(cat.id)}
          >
            <span className={styles.navIcon}>{cat.icon}</span>
            <div className={styles.navItemText}>
              <span className={styles.navItemLabel}>{cat.label}</span>
              <span className={styles.navItemDesc}>{cat.desc}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* Main panel */}
      <main className={styles.main}>
        <div className={styles.mainHeader}>
          <span className={styles.mainIcon}>{current.icon}</span>
          <div>
            <h2 className={styles.mainTitle}>{current.label}</h2>
            <p className={styles.mainDesc}>{current.desc}</p>
          </div>
        </div>
        <div className={styles.mainBody}>
          {panels[active]}
        </div>
      </main>
    </div>
  )
}
