import { useState, useEffect } from 'react'
import styles from './ExtensionManager.module.css'

interface Extension {
  id: string
  name: string
  version: string
  description: string
  manifestVersion: number
  permissions: string[]
  hostPermissions: string[]
  enabled: boolean
  installedAt: number
  icons: Record<string, string>
}

// Demo extensions for web preview
const DEMO_EXTENSIONS: Extension[] = [
  {
    id: 'ublock-origin',
    name: 'uBlock Origin',
    version: '1.59.0',
    description: 'An efficient blocker. Easy on CPU and memory.',
    manifestVersion: 3,
    permissions: ['storage', 'tabs', 'webRequest'],
    hostPermissions: ['<all_urls>'],
    enabled: true,
    installedAt: Date.now() - 86400000 * 7,
    icons: {},
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden Password Manager',
    version: '2024.10.0',
    description: 'Secure and free password manager for all of your devices.',
    manifestVersion: 3,
    permissions: ['storage', 'tabs', 'contextMenus', 'clipboardWrite'],
    hostPermissions: ['<all_urls>'],
    enabled: true,
    installedAt: Date.now() - 86400000 * 3,
    icons: {},
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    version: '4.9.88',
    description: 'Dark mode for every website. Take care of your eyes.',
    manifestVersion: 3,
    permissions: ['storage', 'tabs'],
    hostPermissions: ['<all_urls>'],
    enabled: false,
    installedAt: Date.now() - 86400000 * 1,
    icons: {},
  },
]

const PERMISSION_LABELS: Record<string, { label: string; risk: 'low' | 'medium' | 'high' }> = {
  storage:       { label: 'Read/write local storage', risk: 'low' },
  tabs:          { label: 'Access browser tabs', risk: 'medium' },
  webRequest:    { label: 'Intercept network requests', risk: 'high' },
  contextMenus:  { label: 'Add context menu items', risk: 'low' },
  clipboardWrite:{ label: 'Write to clipboard', risk: 'medium' },
  cookies:       { label: 'Access cookies', risk: 'high' },
  history:       { label: 'Access browsing history', risk: 'high' },
  bookmarks:     { label: 'Access bookmarks', risk: 'medium' },
  notifications: { label: 'Show notifications', risk: 'low' },
  '<all_urls>':  { label: 'Access all websites', risk: 'high' },
}

export function ExtensionManager() {
  const [extensions, setExtensions] = useState<Extension[]>(DEMO_EXTENSIONS)
  const [selectedExt, setSelectedExt] = useState<Extension | null>(null)
  const [installing, setInstalling] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tab, setTab] = useState<'installed' | 'store'>('installed')

  useEffect(() => {
    // Load from Electron IPC if available
    if (window.electronAPI) {
      // @ts-ignore
      window.electronAPI.extList?.().then((exts: Extension[]) => {
        if (exts?.length) setExtensions(exts)
      })
    }
  }, [])

  const toggleExtension = async (id: string) => {
    if (window.electronAPI) {
      // @ts-ignore
      const result = await window.electronAPI.extToggle?.(id)
      if (result?.success) {
        setExtensions(prev =>
          prev.map(e => e.id === id ? { ...e, enabled: result.enabled } : e)
        )
      }
    } else {
      setExtensions(prev =>
        prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e)
      )
    }
  }

  const uninstallExtension = async (id: string) => {
    if (window.electronAPI) {
      // @ts-ignore
      await window.electronAPI.extUninstall?.(id)
    }
    setExtensions(prev => prev.filter(e => e.id !== id))
    if (selectedExt?.id === id) setSelectedExt(null)
  }

  const installFromFolder = async () => {
    setInstalling(true)
    // In Electron, this would open a folder picker dialog
    // For web preview, simulate
    await new Promise(r => setTimeout(r, 1000))
    setInstalling(false)
    alert('In the Electron app, this opens a folder picker to select an unpacked extension directory.')
  }

  const filtered = extensions.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const riskColor = (risk: 'low' | 'medium' | 'high') => ({
    low: 'var(--success)',
    medium: 'var(--warning)',
    high: 'var(--danger)',
  }[risk])

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>🧩 Extensions</div>
        <button className={styles.installBtn} onClick={installFromFolder} disabled={installing}>
          {installing ? '...' : '+ Load Unpacked'}
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === 'installed' ? styles.tabActive : ''}`}
          onClick={() => setTab('installed')}
        >
          Installed ({extensions.length})
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'store' ? styles.tabActive : ''}`}
          onClick={() => setTab('store')}
        >
          Discover
        </button>
      </div>

      {tab === 'installed' && (
        <>
          {/* Search */}
          <input
            className={styles.search}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search extensions..."
          />

          {/* Extension List */}
          <div className={styles.list}>
            {filtered.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🧩</div>
                <div>No extensions installed</div>
                <div className={styles.emptyHint}>Click "Load Unpacked" to sideload a Chrome extension</div>
              </div>
            )}
            {filtered.map(ext => (
              <div
                key={ext.id}
                className={`${styles.extRow} ${selectedExt?.id === ext.id ? styles.extSelected : ''} ${!ext.enabled ? styles.extDisabled : ''}`}
                onClick={() => setSelectedExt(selectedExt?.id === ext.id ? null : ext)}
              >
                <div className={styles.extIcon}>
                  {ext.icons['48'] || ext.icons['32'] || ext.icons['16']
                    ? <img src={ext.icons['48'] || ext.icons['32']} alt="" className={styles.extIconImg} />
                    : <span className={styles.extIconEmoji}>🧩</span>
                  }
                </div>
                <div className={styles.extInfo}>
                  <div className={styles.extName}>{ext.name}</div>
                  <div className={styles.extMeta}>
                    v{ext.version} · MV{ext.manifestVersion}
                    {!ext.enabled && <span className={styles.disabledBadge}>Disabled</span>}
                  </div>
                </div>
                <div className={styles.extActions} onClick={e => e.stopPropagation()}>
                  <button
                    className={`${styles.toggle} ${ext.enabled ? styles.toggleOn : ''}`}
                    onClick={() => toggleExtension(ext.id)}
                    title={ext.enabled ? 'Disable' : 'Enable'}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          {selectedExt && (
            <div className={styles.detail}>
              <div className={styles.detailName}>{selectedExt.name}</div>
              <div className={styles.detailDesc}>{selectedExt.description}</div>

              <div className={styles.detailSection}>Permissions</div>
              <div className={styles.permList}>
                {[...selectedExt.permissions, ...selectedExt.hostPermissions].map(perm => {
                  const info = PERMISSION_LABELS[perm]
                  return (
                    <div key={perm} className={styles.permItem}>
                      <span
                        className={styles.permDot}
                        style={{ background: info ? riskColor(info.risk) : 'var(--text-muted)' }}
                      />
                      <span className={styles.permLabel}>
                        {info ? info.label : perm}
                      </span>
                      {info && (
                        <span className={styles.permRisk} style={{ color: riskColor(info.risk) }}>
                          {info.risk}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                className={styles.uninstallBtn}
                onClick={() => uninstallExtension(selectedExt.id)}
              >
                🗑️ Remove Extension
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'store' && (
        <div className={styles.storeNote}>
          <div className={styles.storeIcon}>🏪</div>
          <div className={styles.storeTitle}>Chrome Web Store</div>
          <div className={styles.storeDesc}>
            Vikiio supports all Chrome Manifest V3 extensions. To install:
          </div>
          <ol className={styles.storeSteps}>
            <li>Download the extension as a <code>.crx</code> or unpack it as a folder</li>
            <li>Click <strong>"Load Unpacked"</strong> and select the extension folder</li>
            <li>The extension will be loaded into all browser sessions</li>
          </ol>
          <a
            href="https://chrome.google.com/webstore"
            className={styles.storeLink}
            onClick={e => { e.preventDefault() }}
          >
            Browse Chrome Web Store →
          </a>
        </div>
      )}
    </div>
  )
}
