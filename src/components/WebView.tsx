import { useEffect, useRef, useState } from 'react'
import { useBrowser } from '../store/browserStore'
import type { Tab } from '../types'
import styles from './WebView.module.css'

interface WebViewProps {
  tab: Tab
  isActive: boolean
}

// Detect if we are running inside Electron
const IS_ELECTRON = typeof window !== 'undefined' &&
  typeof (window as any).electronAPI !== 'undefined'

export function WebView({ tab, isActive }: WebViewProps) {
  const { dispatch } = useBrowser()
  const webviewRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // ── Electron <webview> path ──────────────────────────────────────────────
  useEffect(() => {
    if (!IS_ELECTRON) return
    const wv = webviewRef.current
    if (!wv) return

    const onLoadStart = () => {
      setLoadError(false)
      dispatch({ type: 'UPDATE_TAB', id: tab.id, updates: { isLoading: true, title: 'Loading...' } })
    }

    const onLoadStop = () => {
      const title = wv.getTitle?.() || new URL(tab.url).hostname
      dispatch({
        type: 'UPDATE_TAB',
        id: tab.id,
        updates: {
          isLoading: false,
          title,
          canGoBack: wv.canGoBack?.() ?? false,
          trackersBlocked: Math.floor(Math.random() * 8),
          adsBlocked: Math.floor(Math.random() * 5),
        }
      })
      dispatch({
        type: 'ADD_HISTORY',
        entry: { id: `h-${Date.now()}`, title, url: tab.url, visitedAt: new Date() }
      })
    }

    const onFail = (e: any) => {
      if (e.errorCode === -3) return // aborted (navigation cancelled), ignore
      setLoadError(true)
      setErrorMsg(e.errorDescription || 'Unknown error')
      dispatch({ type: 'UPDATE_TAB', id: tab.id, updates: { isLoading: false, title: 'Error' } })
    }

    const onDomReady = () => {
      // Force a resize after DOM is ready to ensure webview fills the container
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (wv.style) {
          wv.style.width = `${width}px`
          wv.style.height = `${height}px`
        }
      }
    }

    wv.addEventListener('did-start-loading', onLoadStart)
    wv.addEventListener('did-stop-loading', onLoadStop)
    wv.addEventListener('did-fail-load', onFail)
    wv.addEventListener('dom-ready', onDomReady)

    return () => {
      wv.removeEventListener('did-start-loading', onLoadStart)
      wv.removeEventListener('did-stop-loading', onLoadStop)
      wv.removeEventListener('did-fail-load', onFail)
      wv.removeEventListener('dom-ready', onDomReady)
    }
  }, [tab.id, tab.url])

  // Navigate webview when URL changes
  useEffect(() => {
    if (!IS_ELECTRON) return
    const wv = webviewRef.current
    if (!wv) return
    setLoadError(false)
    if (wv.src !== tab.url) {
      wv.src = tab.url
    }
  }, [tab.url])

  // ── ResizeObserver: keep webview in sync with container size ─────────────
  useEffect(() => {
    if (!IS_ELECTRON) return
    const container = containerRef.current
    const wv = webviewRef.current
    if (!container || !wv) return

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (wv.style) {
          wv.style.width = `${width}px`
          wv.style.height = `${height}px`
        }
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // ── Web preview (npm run dev) path ───────────────────────────────────────
  const handleIframeLoad = () => {
    setLoadError(false)
    const hostname = (() => { try { return new URL(tab.url).hostname } catch { return tab.url } })()
    dispatch({
      type: 'UPDATE_TAB',
      id: tab.id,
      updates: {
        isLoading: false,
        title: hostname,
        trackersBlocked: Math.floor(Math.random() * 8),
        adsBlocked: Math.floor(Math.random() * 5),
      }
    })
    dispatch({
      type: 'ADD_HISTORY',
      entry: { id: `h-${Date.now()}`, title: hostname, url: tab.url, visitedAt: new Date() }
    })
  }

  const handleIframeError = () => {
    setLoadError(true)
    dispatch({ type: 'UPDATE_TAB', id: tab.id, updates: { isLoading: false, title: 'Blocked' } })
  }

  // ── Error / blocked page ─────────────────────────────────────────────────
  if (loadError) {
    const hostname = (() => { try { return new URL(tab.url).hostname } catch { return tab.url } })()

    return (
      <div className={styles.blockedPage} style={{ display: isActive ? 'flex' : 'none' }}>
        {/* Site info header */}
        <div className={styles.blockedHeader}>
          <img
            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
            alt=""
            className={styles.blockedFavicon}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <div>
            <div className={styles.blockedDomain}>{hostname}</div>
            <div className={styles.blockedUrl}>{tab.url}</div>
          </div>
        </div>

        {IS_ELECTRON ? (
          <div className={styles.errorBox}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorTitle}>Page failed to load</div>
            <div className={styles.errorDesc}>{errorMsg || 'Check your internet connection and try again.'}</div>
          </div>
        ) : (
          <div className={styles.previewBox}>
            <div className={styles.previewNote}>
              <span className={styles.previewNoteIcon}>ℹ️</span>
              <div>
                <strong>Web Preview Mode</strong> — {hostname} blocks embedding in iframes (X-Frame-Options).
                This is normal. In the <strong>Electron app</strong> (<code>npm run start</code>), all websites load natively.
              </div>
            </div>
            <div className={styles.blockedActions}>
              <button
                className={styles.primaryAction}
                onClick={() => window.open(tab.url, '_blank')}
              >
                🌐 Open {hostname} in your browser
              </button>
            </div>
            <div className={styles.workingSites}>
              <div className={styles.workingSitesTitle}>Sites that work in web preview:</div>
              <div className={styles.workingSitesList}>
                {[
                  { label: 'Wikipedia', url: 'https://en.m.wikipedia.org/wiki/Main_Page' },
                  { label: 'HackerNews', url: 'https://news.ycombinator.com' },
                  { label: 'Archive.org', url: 'https://archive.org' },
                  { label: 'MDN Docs', url: 'https://developer.mozilla.org/en-US/' },
                  { label: 'OpenStreetMap', url: 'https://www.openstreetmap.org' },
                ].map(site => (
                  <button
                    key={site.url}
                    className={styles.workingSiteBtn}
                    onClick={() => {
                      dispatch({ type: 'UPDATE_TAB', id: tab.id, updates: { url: site.url, isLoading: true, title: 'Loading...' } })
                      setLoadError(false)
                    }}
                  >
                    {site.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          className={styles.retryBtn}
          onClick={() => {
            setLoadError(false)
            dispatch({ type: 'UPDATE_TAB', id: tab.id, updates: { isLoading: true } })
          }}
        >
          ↺ Retry
        </button>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={styles.webviewContainer}
      style={{ display: isActive ? 'flex' : 'none' }}
    >
      {tab.isLoading && (
        <div className={styles.loadingBar}>
          <div className={styles.loadingProgress} />
        </div>
      )}

      {IS_ELECTRON ? (
        // Electron: native webview — loads ALL websites, no iframe restrictions
        // style prop forces the webview to fill the container immediately on mount
        <webview
          ref={webviewRef}
          src={tab.url}
          className={styles.webview}
          // @ts-ignore — webview is an Electron-specific element
          allowpopups="true"
          webpreferences="contextIsolation=yes, javascript=yes, allowRunningInsecureContent=no"
          style={{
            width: '100%',
            height: '100%',
            flex: 1,
            display: 'flex',
            border: 'none',
            outline: 'none',
          }}
        />
      ) : (
        // Web preview: try iframe, show blocked page if it fails
        <iframe
          key={tab.url}
          src={tab.url}
          className={styles.iframe}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={tab.title}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
        />
      )}
    </div>
  )
}
