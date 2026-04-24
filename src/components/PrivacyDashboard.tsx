import { useBrowser } from '../store/browserStore'
import styles from './PrivacyDashboard.module.css'

const TRACKER_CATEGORIES = [
  { name: 'Analytics', icon: '📊', color: '#f5a623', examples: ['Google Analytics', 'Mixpanel', 'Amplitude'] },
  { name: 'Advertising', icon: '📢', color: '#e05252', examples: ['DoubleClick', 'AdSense', 'AppNexus'] },
  { name: 'Social', icon: '💬', color: '#4fc3f7', examples: ['Facebook Pixel', 'Twitter Tag', 'LinkedIn'] },
  { name: 'Fingerprinting', icon: '🔍', color: '#9c27b0', examples: ['Canvas API', 'WebGL', 'AudioContext'] },
]

export function PrivacyDashboard() {
  const { state, dispatch } = useBrowser()
  const { settings, privacyStats } = state
  const activeTab = state.tabs.find(t => t.id === state.activeTabId)

  const totalBlocked = privacyStats.trackersBlocked + privacyStats.adsBlocked +
    (activeTab?.trackersBlocked ?? 0) + (activeTab?.adsBlocked ?? 0)

  const shieldLevel = settings.adBlocking && settings.trackerBlocking && settings.fingerprintProtection
    ? 'strict' : settings.adBlocking || settings.trackerBlocking ? 'standard' : 'off'

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.shieldScore}>
          <div className={`${styles.scoreCircle} ${styles[shieldLevel]}`}>
            <span className={styles.scoreIcon}>🛡️</span>
            <span className={styles.scoreLabel}>{shieldLevel.toUpperCase()}</span>
          </div>
          <div>
            <div className={styles.scoreTitle}>Privacy Shield</div>
            <div className={styles.scoreSubtitle}>{totalBlocked} threats blocked total</div>
          </div>
        </div>
      </div>

      {/* Shield Level Selector */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Shield Level</div>
        <div className={styles.levelButtons}>
          {[
            { value: 'standard', label: 'Standard', desc: 'Balanced protection' },
            { value: 'strict', label: 'Strict', desc: 'Maximum blocking' },
            { value: 'custom', label: 'Custom', desc: 'Manual control' },
          ].map(level => (
            <button
              key={level.value}
              className={`${styles.levelBtn} ${settings.shieldLevel === level.value ? styles.levelActive : ''}`}
              onClick={() => {
                dispatch({ type: 'UPDATE_SETTINGS', settings: { shieldLevel: level.value as any } })
                if (level.value === 'standard') {
                  dispatch({ type: 'UPDATE_SETTINGS', settings: { adBlocking: true, trackerBlocking: true, cookieBlocking: false, fingerprintProtection: true } })
                } else if (level.value === 'strict') {
                  dispatch({ type: 'UPDATE_SETTINGS', settings: { adBlocking: true, trackerBlocking: true, cookieBlocking: true, fingerprintProtection: true } })
                }
              }}
            >
              <div className={styles.levelLabel}>{level.label}</div>
              <div className={styles.levelDesc}>{level.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Blocking Controls */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Blocking Controls</div>
        {[
          { key: 'adBlocking', label: 'Ad Blocking', icon: '🚫', desc: 'Block display and video ads' },
          { key: 'trackerBlocking', label: 'Tracker Blocking', icon: '🔍', desc: 'Block analytics and tracking scripts' },
          { key: 'cookieBlocking', label: 'Cookie Blocking', icon: '🍪', desc: 'Block third-party cookies' },
          { key: 'fingerprintProtection', label: 'Fingerprint Protection', icon: '👆', desc: 'Mask browser fingerprint' },
          { key: 'vpnEnabled', label: 'VPN Protection', icon: '🔒', desc: 'Route traffic through VPN' },
        ].map(item => (
          <div key={item.key} className={styles.controlRow}>
            <div className={styles.controlInfo}>
              <span className={styles.controlIcon}>{item.icon}</span>
              <div>
                <div className={styles.controlLabel}>{item.label}</div>
                <div className={styles.controlDesc}>{item.desc}</div>
              </div>
            </div>
            <button
              className={`${styles.toggle} ${settings[item.key as keyof typeof settings] ? styles.toggleOn : ''}`}
              onClick={() => dispatch({ type: 'UPDATE_SETTINGS', settings: { [item.key]: !settings[item.key as keyof typeof settings] } })}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        ))}
      </div>

      {/* Tracker Categories */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>What We Block</div>
        <div className={styles.categories}>
          {TRACKER_CATEGORIES.map(cat => (
            <div key={cat.name} className={styles.category}>
              <div className={styles.catHeader}>
                <span>{cat.icon}</span>
                <span className={styles.catName}>{cat.name}</span>
              </div>
              <div className={styles.catExamples}>
                {cat.examples.map(e => (
                  <span key={e} className={styles.catChip} style={{ borderColor: cat.color, color: cat.color }}>{e}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
