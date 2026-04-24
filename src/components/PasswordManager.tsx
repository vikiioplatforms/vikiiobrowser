import { useState } from 'react'
import styles from './PasswordManager.module.css'

interface PasswordEntry {
  id: string
  site: string
  username: string
  password: string
  strength: 'weak' | 'medium' | 'strong'
  breached: boolean
  lastUpdated: Date
}

const DEMO_PASSWORDS: PasswordEntry[] = [
  { id: '1', site: 'github.com', username: 'user@email.com', password: '••••••••••••', strength: 'strong', breached: false, lastUpdated: new Date() },
  { id: '2', site: 'google.com', username: 'user@gmail.com', password: '••••••••', strength: 'medium', breached: false, lastUpdated: new Date() },
  { id: '3', site: 'twitter.com', username: 'myhandle', password: '••••••', strength: 'weak', breached: true, lastUpdated: new Date() },
]

function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function PasswordManager() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>(DEMO_PASSWORDS)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [generated, setGenerated] = useState('')
  const [newEntry, setNewEntry] = useState({ site: '', username: '', password: '' })
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  const filtered = passwords.filter(p =>
    p.site.toLowerCase().includes(search.toLowerCase()) ||
    p.username.toLowerCase().includes(search.toLowerCase())
  )

  const strengthColor = { weak: '#e05252', medium: '#f5a623', strong: '#4caf7d' }

  const addPassword = () => {
    if (!newEntry.site || !newEntry.username || !newEntry.password) return
    const strength = newEntry.password.length >= 16 ? 'strong' : newEntry.password.length >= 10 ? 'medium' : 'weak'
    setPasswords(prev => [...prev, {
      id: `pw-${Date.now()}`,
      ...newEntry,
      strength,
      breached: false,
      lastUpdated: new Date(),
    }])
    setNewEntry({ site: '', username: '', password: '' })
    setShowAdd(false)
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <div className={styles.title}>🔑 Password Manager</div>
        <button className={styles.addBtn} onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>

      {/* Health Summary */}
      <div className={styles.healthRow}>
        <div className={styles.healthStat}>
          <span className={styles.healthNum} style={{ color: '#4caf7d' }}>
            {passwords.filter(p => p.strength === 'strong').length}
          </span>
          <span className={styles.healthLabel}>Strong</span>
        </div>
        <div className={styles.healthStat}>
          <span className={styles.healthNum} style={{ color: '#f5a623' }}>
            {passwords.filter(p => p.strength === 'medium').length}
          </span>
          <span className={styles.healthLabel}>Medium</span>
        </div>
        <div className={styles.healthStat}>
          <span className={styles.healthNum} style={{ color: '#e05252' }}>
            {passwords.filter(p => p.strength === 'weak' || p.breached).length}
          </span>
          <span className={styles.healthLabel}>At Risk</span>
        </div>
      </div>

      {/* Password Generator */}
      <div className={styles.generator}>
        <div className={styles.genTitle}>Password Generator</div>
        <div className={styles.genRow}>
          <input
            className={styles.genInput}
            value={generated}
            readOnly
            placeholder="Click Generate..."
          />
          <button className={styles.genBtn} onClick={() => setGenerated(generatePassword())}>Generate</button>
          {generated && (
            <button
              className={styles.copyBtn}
              onClick={() => navigator.clipboard.writeText(generated)}
              title="Copy to clipboard"
            >📋</button>
          )}
        </div>
      </div>

      {/* Search */}
      <input
        className={styles.search}
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search passwords..."
      />

      {/* Add Form */}
      {showAdd && (
        <div className={styles.addForm}>
          <input className={styles.formInput} value={newEntry.site} onChange={e => setNewEntry(p => ({ ...p, site: e.target.value }))} placeholder="Website (e.g. github.com)" />
          <input className={styles.formInput} value={newEntry.username} onChange={e => setNewEntry(p => ({ ...p, username: e.target.value }))} placeholder="Username or email" />
          <div className={styles.pwRow}>
            <input className={styles.formInput} value={newEntry.password} onChange={e => setNewEntry(p => ({ ...p, password: e.target.value }))} placeholder="Password" type="password" style={{ flex: 1 }} />
            <button className={styles.genSmall} onClick={() => setNewEntry(p => ({ ...p, password: generatePassword() }))}>Generate</button>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className={styles.saveBtn} onClick={addPassword}>Save</button>
          </div>
        </div>
      )}

      {/* Password List */}
      <div className={styles.list}>
        {filtered.map(entry => (
          <div key={entry.id} className={styles.entry}>
            <div className={styles.entryLeft}>
              <div className={styles.entryIcon}>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${entry.site}&sz=16`}
                  alt=""
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              </div>
              <div>
                <div className={styles.entrySite}>{entry.site}</div>
                <div className={styles.entryUser}>{entry.username}</div>
              </div>
            </div>
            <div className={styles.entryRight}>
              {entry.breached && <span className={styles.breachBadge}>⚠️ Breached</span>}
              <div
                className={styles.strengthDot}
                style={{ background: strengthColor[entry.strength] }}
                title={`Password strength: ${entry.strength}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
