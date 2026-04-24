import { useBrowser } from '../store/browserStore'
import styles from './TitleBar.module.css'

const MODE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  normal:    { label: 'Normal',    icon: '🌐', color: '#6c63ff' },
  private:   { label: 'Private',   icon: '🔒', color: '#9c27b0' },
  work:      { label: 'Work',      icon: '💼', color: '#4fc3f7' },
  anonymous: { label: 'Anonymous', icon: '🕵️', color: '#607d8b' },
  locked:    { label: 'Locked',    icon: '🔐', color: '#e05252' },
}

declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
    }
  }
}

export function TitleBar() {
  const { state, dispatch } = useBrowser()
  const mode = MODE_LABELS[state.settings.mode]
  const isDark = (state.settings.theme ?? 'dark') === 'dark'

  const toggleTheme = () => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { theme: isDark ? 'light' : 'dark' } })
  }

  const minimize = () => window.electronAPI?.minimizeWindow()
  const maximize = () => window.electronAPI?.maximizeWindow()
  const close    = () => window.electronAPI?.closeWindow()

  return (
    <div className={styles.titleBar}>
      <div className={styles.dragArea}>
        <div className={styles.logo}>
          {/* Vikiio favicon as the logo mark */}
          <img
            src="/favicon.png"
            alt="Vikiio"
            className={styles.logoImg}
          />
          <span className={styles.logoText}>Vikiio</span>
        </div>
        <div className={styles.modeIndicator} style={{ '--mode-c': mode.color } as React.CSSProperties}>
          <span className={styles.modeIcon}>{mode.icon}</span>
          <span className={styles.modeLabel}>{mode.label}</span>
        </div>
      </div>

      <div className={styles.rightControls}>
        {/* Theme toggle */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Window controls */}
        <div className={styles.windowControls}>
          <button className={`${styles.winBtn} ${styles.minimize}`} onClick={minimize} title="Minimize">
            <span />
          </button>
          <button className={`${styles.winBtn} ${styles.maximize}`} onClick={maximize} title="Maximize">
            <span />
          </button>
          <button className={`${styles.winBtn} ${styles.close}`} onClick={close} title="Close">
            <span />
          </button>
        </div>
      </div>
    </div>
  )
}
