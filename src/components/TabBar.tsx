import { useState, useRef } from 'react'
import { useBrowser } from '../store/browserStore'
import type { Tab } from '../types'
import styles from './TabBar.module.css'

export function TabBar() {
  const { state, dispatch } = useBrowser()
  const { tabs, activeTabId } = state
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null)

  const newTab = () => {
    const id = `tab-${Date.now()}`
    const tab: Tab = {
      id, title: 'New Tab', url: 'newtab', isLoading: false,
      canGoBack: false, canGoForward: false, pinned: false, muted: false,
      mode: state.settings.mode, trackersBlocked: 0, adsBlocked: 0,
    }
    dispatch({ type: 'ADD_TAB', tab })
  }

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    dispatch({ type: 'CLOSE_TAB', id })
  }

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({ tabId, x: e.clientX, y: e.clientY })
  }

  const handleContextAction = (action: string, tabId: string) => {
    switch (action) {
      case 'pin': dispatch({ type: 'PIN_TAB', id: tabId }); break
      case 'mute': dispatch({ type: 'MUTE_TAB', id: tabId }); break
      case 'duplicate': dispatch({ type: 'DUPLICATE_TAB', id: tabId }); break
      case 'close': dispatch({ type: 'CLOSE_TAB', id: tabId }); break
      case 'close-others':
        state.tabs.filter(t => t.id !== tabId && !t.pinned).forEach(t => dispatch({ type: 'CLOSE_TAB', id: t.id }))
        break
    }
    setContextMenu(null)
  }

  const pinnedTabs = tabs.filter(t => t.pinned)
  const regularTabs = tabs.filter(t => !t.pinned)

  return (
    <>
      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          {pinnedTabs.map(tab => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onActivate={() => dispatch({ type: 'SET_ACTIVE_TAB', id: tab.id })}
              onClose={(e) => closeTab(e, tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              pinned
            />
          ))}
          {regularTabs.map(tab => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onActivate={() => dispatch({ type: 'SET_ACTIVE_TAB', id: tab.id })}
              onClose={(e) => closeTab(e, tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
            />
          ))}
        </div>
        <button className={styles.newTabBtn} onClick={newTab} title="New Tab">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {contextMenu && (
        <>
          <div className={styles.contextOverlay} onClick={() => setContextMenu(null)} />
          <div className={styles.contextMenu} style={{ left: contextMenu.x, top: contextMenu.y }}>
            {[
              { key: 'pin', label: state.tabs.find(t => t.id === contextMenu.tabId)?.pinned ? 'Unpin Tab' : 'Pin Tab' },
              { key: 'mute', label: state.tabs.find(t => t.id === contextMenu.tabId)?.muted ? 'Unmute Tab' : 'Mute Tab' },
              { key: 'duplicate', label: 'Duplicate Tab' },
              { key: 'close', label: 'Close Tab' },
              { key: 'close-others', label: 'Close Other Tabs' },
            ].map(item => (
              <button key={item.key} className={styles.contextItem} onClick={() => handleContextAction(item.key, contextMenu.tabId)}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

interface TabItemProps {
  tab: Tab
  isActive: boolean
  pinned?: boolean
  onActivate: () => void
  onClose: (e: React.MouseEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

function TabItem({ tab, isActive, pinned, onActivate, onClose, onContextMenu }: TabItemProps) {
  const getFavicon = (url: string) => {
    if (url === 'newtab' || !url.startsWith('http')) return null
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
    } catch { return null }
  }

  const favicon = getFavicon(tab.url)

  return (
    <div
      className={`${styles.tab} ${isActive ? styles.active : ''} ${pinned ? styles.pinned : ''}`}
      onClick={onActivate}
      onContextMenu={onContextMenu}
      title={tab.title}
    >
      <div className={styles.tabInner}>
        {tab.isLoading ? (
          <div className={styles.spinner} />
        ) : favicon ? (
          <img src={favicon} alt="" className={styles.favicon} onError={e => (e.currentTarget.style.display = 'none')} />
        ) : (
          <div className={styles.defaultFavicon}>
            {tab.url === 'newtab' ? '⚡' : '🌐'}
          </div>
        )}
        {!pinned && (
          <>
            <span className={styles.tabTitle}>{tab.title}</span>
            {tab.muted && <span className={styles.muteIcon}>🔇</span>}
            <button className={styles.closeBtn} onClick={onClose} title="Close tab">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
      {isActive && <div className={styles.activeIndicator} />}
    </div>
  )
}
