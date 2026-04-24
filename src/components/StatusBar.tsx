import { useBrowser } from '../store/browserStore'
import styles from './StatusBar.module.css'

export function StatusBar() {
  const { state } = useBrowser()
  const activeTab = state.tabs.find(t => t.id === state.activeTabId)
  const total = state.privacyStats.trackersBlocked + state.privacyStats.adsBlocked +
    (activeTab?.trackersBlocked ?? 0) + (activeTab?.adsBlocked ?? 0)

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        {activeTab?.isLoading && (
          <span className={styles.loadingText}>Loading {activeTab.url}...</span>
        )}
        {!activeTab?.isLoading && activeTab?.url !== 'newtab' && (
          <span className={styles.urlText}>{activeTab?.url}</span>
        )}
      </div>
      <div className={styles.right}>
        {state.settings.vpnEnabled && (
          <span className={styles.chip} style={{ color: '#4fc3f7' }}>🔒 VPN</span>
        )}
        {state.settings.adBlocking && (
          <span className={styles.chip} style={{ color: '#4caf7d' }}>🛡️ {total} blocked</span>
        )}
        <span className={styles.chip} style={{ color: 'var(--text-muted)' }}>
          {state.tabs.length} tab{state.tabs.length !== 1 ? 's' : ''}
        </span>
        <span className={styles.chip} style={{ color: 'var(--text-muted)' }}>
          Vikiio Browser v1.0
        </span>
      </div>
    </div>
  )
}
