import { useState, useEffect } from 'react'
import { useBrowser } from '../store/browserStore'
import styles from './SyncPanel.module.css'

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export function SyncPanel() {
  const { state } = useBrowser()
  const [passphrase, setPassphrase] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [syncItems, setSyncItems] = useState({
    bookmarks: true,
    history: true,
    passwords: true,
    settings: true,
    notes: true,
    containers: true,
  })

  useEffect(() => {
    // Load sync status from Electron IPC if available
    if (window.electronAPI) {
      // @ts-ignore
      window.electronAPI.syncStatus?.().then((s: any) => {
        if (s) {
          setLastSync(s.lastSync)
          setDeviceId(s.deviceId)
        }
      })
    } else {
      setDeviceId('web-' + Math.random().toString(36).slice(2, 10))
    }
  }, [])

  const handleSync = async () => {
    if (!passphrase) {
      setStatusMsg('Please enter a sync passphrase.')
      setStatus('error')
      return
    }
    if (!syncEnabled && passphrase !== confirmPass) {
      setStatusMsg('Passphrases do not match.')
      setStatus('error')
      return
    }

    setStatus('syncing')
    setStatusMsg('Encrypting and syncing your data...')

    try {
      const syncData = {
        bookmarks: syncItems.bookmarks ? state.bookmarks : [],
        history: syncItems.history ? state.history.slice(0, 500) : [],
        settings: syncItems.settings ? state.settings : {},
        notes: syncItems.notes ? state.savedNotes : [],
        containers: syncItems.containers ? state.containers : [],
        workspaces: state.workspaces,
        passwords: [],
        syncedAt: Date.now(),
      }

      if (window.electronAPI) {
        // @ts-ignore
        const result = await window.electronAPI.syncEncrypt?.(syncData, passphrase)
        if (result?.success) {
          setLastSync(Date.now())
          setStatus('success')
          setStatusMsg('Data encrypted and saved locally. Ready to sync to cloud.')
          setSyncEnabled(true)
        } else {
          throw new Error(result?.error || 'Encryption failed')
        }
      } else {
        // Web preview simulation
        await new Promise(r => setTimeout(r, 1200))
        setLastSync(Date.now())
        setStatus('success')
        setStatusMsg('Sync simulation complete (Electron required for full sync).')
        setSyncEnabled(true)
      }
    } catch (err: any) {
      setStatus('error')
      setStatusMsg(err.message || 'Sync failed. Please try again.')
    }
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString()
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>🔄 Encrypted Sync</div>
        <div className={`${styles.statusDot} ${styles[status]}`} />
      </div>

      <div className={styles.description}>
        All data is encrypted on your device using <strong>AES-256-GCM</strong> before syncing.
        Your passphrase never leaves your device — even the sync server cannot read your data.
      </div>

      {/* Device Info */}
      <div className={styles.deviceCard}>
        <div className={styles.deviceIcon}>💻</div>
        <div>
          <div className={styles.deviceName}>This Device</div>
          <div className={styles.deviceId}>{deviceId || 'Loading...'}</div>
          {lastSync && (
            <div className={styles.lastSync}>Last synced: {formatTime(lastSync)}</div>
          )}
        </div>
      </div>

      {/* Sync Items */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>What to Sync</div>
        {Object.entries(syncItems).map(([key, val]) => (
          <div key={key} className={styles.syncItem}>
            <span className={styles.syncItemLabel}>
              {key === 'bookmarks' && '🔖 Bookmarks'}
              {key === 'history' && '🕐 History'}
              {key === 'passwords' && '🔑 Passwords'}
              {key === 'settings' && '⚙️ Settings'}
              {key === 'notes' && '📝 Notes'}
              {key === 'containers' && '📦 Containers'}
            </span>
            <button
              className={`${styles.toggle} ${val ? styles.toggleOn : ''}`}
              onClick={() => setSyncItems(p => ({ ...p, [key]: !val }))}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        ))}
      </div>

      {/* Passphrase */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Sync Passphrase</div>
        <p className={styles.passphraseNote}>
          Choose a strong passphrase. If you forget it, your data cannot be recovered.
        </p>
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            type={showPass ? 'text' : 'password'}
            value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            placeholder="Enter sync passphrase..."
          />
          <button className={styles.eyeBtn} onClick={() => setShowPass(p => !p)}>
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
        {!syncEnabled && (
          <input
            className={styles.input}
            type={showPass ? 'text' : 'password'}
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            placeholder="Confirm passphrase..."
            style={{ marginTop: 6 }}
          />
        )}
      </div>

      {/* Status message */}
      {statusMsg && (
        <div className={`${styles.statusMsg} ${styles[status]}`}>
          {status === 'syncing' && <span className={styles.spinner}>⟳</span>}
          {status === 'success' && '✅ '}
          {status === 'error' && '❌ '}
          {statusMsg}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.syncBtn} ${status === 'syncing' ? styles.syncing : ''}`}
          onClick={handleSync}
          disabled={status === 'syncing'}
        >
          {status === 'syncing' ? 'Syncing...' : syncEnabled ? '🔄 Sync Now' : '🔐 Enable Sync'}
        </button>
        {syncEnabled && (
          <button
            className={styles.resetBtn}
            onClick={() => { setSyncEnabled(false); setPassphrase(''); setConfirmPass(''); setStatus('idle'); setStatusMsg('') }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Security info */}
      <div className={styles.securityInfo}>
        <div className={styles.secBadge}>🔒 AES-256-GCM</div>
        <div className={styles.secBadge}>🔑 PBKDF2 · 100k rounds</div>
        <div className={styles.secBadge}>🚫 Zero-knowledge</div>
      </div>
    </div>
  )
}
