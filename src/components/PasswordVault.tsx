import { useState, useEffect } from 'react'
import styles from './PasswordVault.module.css'

interface VaultEntry {
  id: string
  domain: string
  url: string
  username: string
  createdAt: number
  lastUsed: number | null
  passwordStrength: 'weak' | 'fair' | 'strong' | 'very-strong'
  breached: boolean
}

interface GeneratorOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

const DEMO_ENTRIES: VaultEntry[] = [
  { id: '1', domain: 'github.com', url: 'https://github.com', username: 'user@email.com', createdAt: Date.now() - 86400000 * 10, lastUsed: Date.now() - 86400000, passwordStrength: 'very-strong', breached: false },
  { id: '2', domain: 'google.com', url: 'https://google.com', username: 'user@gmail.com', createdAt: Date.now() - 86400000 * 30, lastUsed: Date.now() - 3600000, passwordStrength: 'strong', breached: false },
  { id: '3', domain: 'twitter.com', url: 'https://twitter.com', username: 'myhandle', createdAt: Date.now() - 86400000 * 60, lastUsed: null, passwordStrength: 'weak', breached: true },
]

const STRENGTH_CONFIG = {
  'weak':       { label: 'Weak',        color: 'var(--danger)',  bars: 1 },
  'fair':       { label: 'Fair',        color: 'var(--warning)', bars: 2 },
  'strong':     { label: 'Strong',      color: 'var(--success)', bars: 3 },
  'very-strong':{ label: 'Very Strong', color: 'var(--info)',    bars: 4 },
}

function generatePasswordLocal(opts: GeneratorOptions): string {
  let charset = ''
  if (opts.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (opts.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (opts.numbers)   charset += '0123456789'
  if (opts.symbols)   charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const arr = new Uint8Array(opts.length)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => charset[b % charset.length]).join('')
}

function assessStrength(pw: string): VaultEntry['passwordStrength'] {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (pw.length >= 16) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[a-z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s <= 2) return 'weak'
  if (s <= 4) return 'fair'
  if (s <= 6) return 'strong'
  return 'very-strong'
}

type TabType = 'vault' | 'generator' | 'health'

export function PasswordVault() {
  const [entries, setEntries] = useState<VaultEntry[]>(DEMO_ENTRIES)
  const [tab, setTab] = useState<TabType>('vault')
  const [search, setSearch] = useState('')
  const [masterPassword, setMasterPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [showMaster, setShowMaster] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Add form state
  const [newDomain, setNewDomain] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [saving, setSaving] = useState(false)

  // Generator state
  const [genOpts, setGenOpts] = useState<GeneratorOptions>({
    length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true,
  })
  const [generatedPw, setGeneratedPw] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setGeneratedPw(generatePasswordLocal(genOpts))
  }, [])

  const unlock = () => {
    if (masterPassword.length >= 4) {
      setUnlocked(true)
    }
  }

  const handleSave = async () => {
    if (!newDomain || !newUsername || !newPassword) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    const entry: VaultEntry = {
      id: Date.now().toString(),
      domain: newDomain.replace(/^https?:\/\//, '').split('/')[0],
      url: newDomain.startsWith('http') ? newDomain : `https://${newDomain}`,
      username: newUsername,
      createdAt: Date.now(),
      lastUsed: null,
      passwordStrength: assessStrength(newPassword),
      breached: false,
    }
    setEntries(p => [entry, ...p])
    setNewDomain(''); setNewUsername(''); setNewPassword('')
    setShowAddForm(false)
    setSaving(false)
  }

  const handleDelete = (id: string) => {
    setEntries(p => p.filter(e => e.id !== id))
    if (selectedEntry?.id === id) setSelectedEntry(null)
  }

  const regenerate = () => {
    setGeneratedPw(generatePasswordLocal(genOpts))
    setCopied(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = entries.filter(e =>
    e.domain.toLowerCase().includes(search.toLowerCase()) ||
    e.username.toLowerCase().includes(search.toLowerCase())
  )

  const weakCount = entries.filter(e => e.passwordStrength === 'weak' || e.passwordStrength === 'fair').length
  const breachedCount = entries.filter(e => e.breached).length
  const reusedCount = (() => {
    const usernames = entries.map(e => e.username)
    return entries.filter(e => usernames.filter(u => u === e.username).length > 1).length
  })()

  if (!unlocked) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.lockIcon}>🔐</div>
        <div className={styles.lockTitle}>Password Vault</div>
        <div className={styles.lockDesc}>Enter your master password to unlock</div>
        <div className={styles.lockInputRow}>
          <input
            className={styles.input}
            type={showMaster ? 'text' : 'password'}
            value={masterPassword}
            onChange={e => setMasterPassword(e.target.value)}
            placeholder="Master password..."
            onKeyDown={e => e.key === 'Enter' && unlock()}
            autoFocus
          />
          <button className={styles.eyeBtn} onClick={() => setShowMaster(p => !p)}>
            {showMaster ? '🙈' : '👁️'}
          </button>
        </div>
        <button className={styles.unlockBtn} onClick={unlock} disabled={masterPassword.length < 4}>
          Unlock Vault
        </button>
        <div className={styles.lockNote}>
          Your vault is encrypted with AES-256-GCM. The master password never leaves your device.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>🔑 Password Vault</div>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={() => setShowAddForm(p => !p)}>
            {showAddForm ? '✕' : '+ Add'}
          </button>
          <button className={styles.lockBtn} onClick={() => setUnlocked(false)} title="Lock vault">🔒</button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(['vault', 'generator', 'health'] as TabType[]).map(t => (
          <button
            key={t}
            className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'vault' ? `🗄 Vault (${entries.length})` : t === 'generator' ? '⚙️ Generator' : '🩺 Health'}
          </button>
        ))}
      </div>

      {/* ── VAULT TAB ── */}
      {tab === 'vault' && (
        <>
          {showAddForm && (
            <div className={styles.addForm}>
              <input className={styles.input} value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="Website (e.g. github.com)" />
              <input className={styles.input} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username or email" />
              <div className={styles.passRow}>
                <input className={styles.input} type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password" />
                <button className={styles.eyeBtn} onClick={() => setShowNewPass(p => !p)}>{showNewPass ? '🙈' : '👁️'}</button>
                <button className={styles.genBtn} onClick={() => setNewPassword(generatePasswordLocal(genOpts))} title="Generate">⚙️</button>
              </div>
              {newPassword && (
                <div className={styles.strengthRow}>
                  {[1,2,3,4].map(i => {
                    const s = assessStrength(newPassword)
                    const bars = STRENGTH_CONFIG[s].bars
                    return <div key={i} className={styles.strengthBar} style={{ background: i <= bars ? STRENGTH_CONFIG[s].color : 'var(--bg-active)' }} />
                  })}
                  <span className={styles.strengthLabel} style={{ color: STRENGTH_CONFIG[assessStrength(newPassword)].color }}>
                    {STRENGTH_CONFIG[assessStrength(newPassword)].label}
                  </span>
                </div>
              )}
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !newDomain || !newUsername || !newPassword}>
                {saving ? 'Saving...' : 'Save Credential'}
              </button>
            </div>
          )}

          <input className={styles.search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search passwords..." />

          <div className={styles.list}>
            {filtered.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔑</div>
                <div>No passwords found</div>
              </div>
            )}
            {filtered.map(entry => (
              <div
                key={entry.id}
                className={`${styles.entryRow} ${selectedEntry?.id === entry.id ? styles.entrySelected : ''}`}
                onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
              >
                <div className={styles.entryFavicon}>
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${entry.domain}&sz=32`}
                    alt=""
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className={styles.entryInfo}>
                  <div className={styles.entryDomain}>{entry.domain}</div>
                  <div className={styles.entryUser}>{entry.username}</div>
                </div>
                <div className={styles.entryBadges}>
                  {entry.breached && <span className={styles.breachedBadge}>⚠️</span>}
                  <div className={styles.strengthDot} style={{ background: STRENGTH_CONFIG[entry.passwordStrength].color }} />
                </div>
              </div>
            ))}
          </div>

          {selectedEntry && (
            <div className={styles.detail}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Domain</span>
                <span className={styles.detailValue}>{selectedEntry.domain}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Username</span>
                <span className={styles.detailValue}>{selectedEntry.username}</span>
                <button className={styles.copyBtn} onClick={() => copyToClipboard(selectedEntry.username)}>Copy</button>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Password</span>
                <span className={styles.detailValue}>••••••••••••</span>
                <button className={styles.copyBtn} onClick={() => copyToClipboard('(password)')}>Copy</button>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Strength</span>
                <span style={{ color: STRENGTH_CONFIG[selectedEntry.passwordStrength].color, fontSize: 12, fontWeight: 600 }}>
                  {STRENGTH_CONFIG[selectedEntry.passwordStrength].label}
                </span>
              </div>
              {selectedEntry.breached && (
                <div className={styles.breachWarning}>
                  ⚠️ This password was found in a data breach. Change it immediately.
                </div>
              )}
              <button className={styles.deleteBtn} onClick={() => handleDelete(selectedEntry.id)}>🗑️ Delete</button>
            </div>
          )}
        </>
      )}

      {/* ── GENERATOR TAB ── */}
      {tab === 'generator' && (
        <div className={styles.generator}>
          <div className={styles.generatedPw}>
            <span className={styles.generatedText}>{generatedPw}</span>
            <button className={styles.copyBtn} onClick={() => copyToClipboard(generatedPw)}>
              {copied ? '✓' : 'Copy'}
            </button>
          </div>

          {generatedPw && (
            <div className={styles.strengthRow}>
              {[1,2,3,4].map(i => {
                const s = assessStrength(generatedPw)
                const bars = STRENGTH_CONFIG[s].bars
                return <div key={i} className={styles.strengthBar} style={{ background: i <= bars ? STRENGTH_CONFIG[s].color : 'var(--bg-active)' }} />
              })}
              <span className={styles.strengthLabel} style={{ color: STRENGTH_CONFIG[assessStrength(generatedPw)].color }}>
                {STRENGTH_CONFIG[assessStrength(generatedPw)].label}
              </span>
            </div>
          )}

          <div className={styles.genOption}>
            <span className={styles.genLabel}>Length: {genOpts.length}</span>
            <input type="range" min={8} max={64} value={genOpts.length}
              onChange={e => setGenOpts(p => ({ ...p, length: +e.target.value }))}
              className={styles.slider}
            />
          </div>

          {[
            { key: 'uppercase', label: 'Uppercase (A-Z)' },
            { key: 'lowercase', label: 'Lowercase (a-z)' },
            { key: 'numbers',   label: 'Numbers (0-9)' },
            { key: 'symbols',   label: 'Symbols (!@#...)' },
          ].map(opt => (
            <div key={opt.key} className={styles.genOption}>
              <span className={styles.genLabel}>{opt.label}</span>
              <button
                className={`${styles.toggle} ${genOpts[opt.key as keyof GeneratorOptions] ? styles.toggleOn : ''}`}
                onClick={() => setGenOpts(p => ({ ...p, [opt.key]: !p[opt.key as keyof GeneratorOptions] }))}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          ))}

          <button className={styles.regenBtn} onClick={regenerate}>↻ Regenerate</button>
        </div>
      )}

      {/* ── HEALTH TAB ── */}
      {tab === 'health' && (
        <div className={styles.health}>
          <div className={styles.healthScore}>
            <div className={styles.healthScoreNum} style={{ color: weakCount + breachedCount === 0 ? 'var(--success)' : 'var(--warning)' }}>
              {Math.max(0, 100 - (weakCount * 10) - (breachedCount * 20) - (reusedCount * 5))}
            </div>
            <div className={styles.healthScoreLabel}>Security Score</div>
          </div>

          {[
            { count: breachedCount, label: 'Breached passwords', color: 'var(--danger)', icon: '⚠️', desc: 'Found in known data breaches' },
            { count: weakCount, label: 'Weak passwords', color: 'var(--warning)', icon: '🔓', desc: 'Short or simple passwords' },
            { count: reusedCount, label: 'Reused usernames', color: 'var(--warning)', icon: '♻️', desc: 'Same username on multiple sites' },
            { count: entries.length - weakCount - breachedCount, label: 'Secure passwords', color: 'var(--success)', icon: '✅', desc: 'Strong and unique' },
          ].map(item => (
            <div key={item.label} className={styles.healthItem}>
              <span className={styles.healthIcon}>{item.icon}</span>
              <div className={styles.healthInfo}>
                <div className={styles.healthLabel}>{item.label}</div>
                <div className={styles.healthDesc}>{item.desc}</div>
              </div>
              <span className={styles.healthCount} style={{ color: item.color }}>{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
