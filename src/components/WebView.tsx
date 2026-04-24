import { useEffect, useRef, useState } from 'react'
import { useBrowser } from '../store/browserStore'
import type { Tab } from '../types'
import styles from './WebView.module.css'

interface WebViewProps {
  tab: Tab
  isActive: boolean
}

export function WebView({ tab, isActive }: WebViewProps) {
  const { dispatch } = useBrowser()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (tab.url && tab.url !== 'newtab') {
      setLoadError(false)
      dispatch({ type: 'UPDATE_TAB', id: tab.id, updates: { isLoading: true, title: 'Loading...' } })
    }
  }, [tab.url])

  const handleLoad = () => {
    try {
      const iframe = iframeRef.current
      let title = tab.url
      try {
        title = new URL(tab.url).hostname
      } catch {}
      dispatch({
        type: 'UPDATE_TAB',
        id: tab.id,
        updates: {
          isLoading: false,
          title,
          canGoBack: true,
          // Simulate tracker blocking
          trackersBlocked: Math.floor(Math.random() * 8),
          adsBlocked: Math.floor(Math.random() * 5),
        }
      })
      // Update history title
      dispatch({
        type: 'ADD_HISTORY',
        entry: { id: `h-${Date.now()}`, title, url: tab.url, visitedAt: new Date() }
      })
    } catch {}
  }

  const handleError = () => {
    setLoadError(true)
    dispatch({ type: 'UPDATE_TAB', id: tab.id, updates: { isLoading: false, title: 'Error' } })
  }

  if (loadError) {
    return (
      <div className={styles.errorPage}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2 className={styles.errorTitle}>Cannot load this page</h2>
        <p className={styles.errorDesc}>
          The page at <strong>{tab.url}</strong> could not be loaded.
          This may be due to the site's security policy (X-Frame-Options).
        </p>
        <button
          className={styles.openExternal}
          onClick={() => window.open(tab.url, '_blank')}
        >
          Open in external browser
        </button>
        <p className={styles.errorNote}>
          Note: In the full Electron build, pages load natively via webview tags without iframe restrictions.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.webviewContainer}>
      {tab.isLoading && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingProgress} />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={tab.url}
        className={styles.iframe}
        onLoad={handleLoad}
        onError={handleError}
        title={tab.title}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
      />
    </div>
  )
}
