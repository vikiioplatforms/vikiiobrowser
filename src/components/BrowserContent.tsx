import { useBrowser } from '../store/browserStore'
import { NewTabPage } from './NewTabPage'
import { WebView } from './WebView'
import styles from './BrowserContent.module.css'

export function BrowserContent() {
  const { state } = useBrowser()
  const { tabs, activeTabId, showNewTabPage } = state

  return (
    <div className={styles.content}>
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`${styles.tabContent} ${tab.id === activeTabId ? styles.active : ''}`}
        >
          {tab.url === 'newtab' ? (
            <NewTabPage />
          ) : (
            <WebView tab={tab} isActive={tab.id === activeTabId} />
          )}
        </div>
      ))}
    </div>
  )
}
