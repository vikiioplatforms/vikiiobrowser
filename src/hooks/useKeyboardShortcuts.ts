import { useEffect } from 'react'
import { useBrowser } from '../store/browserStore'
import type { Tab } from '../types'

export function useKeyboardShortcuts() {
  const { state, dispatch } = useBrowser()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+T — New Tab
      if (ctrl && e.key === 't') {
        e.preventDefault()
        const id = `tab-${Date.now()}`
        const tab: Tab = {
          id, title: 'New Tab', url: 'newtab', isLoading: false,
          canGoBack: false, canGoForward: false, pinned: false, muted: false,
          mode: state.settings.mode, trackersBlocked: 0, adsBlocked: 0,
        }
        dispatch({ type: 'ADD_TAB', tab })
      }

      // Ctrl+W — Close Tab
      if (ctrl && e.key === 'w') {
        e.preventDefault()
        if (state.activeTabId) dispatch({ type: 'CLOSE_TAB', id: state.activeTabId })
      }

      // Ctrl+L — Focus address bar (handled in Toolbar)
      // Ctrl+R — Reload
      if (ctrl && e.key === 'r') {
        e.preventDefault()
        if (state.activeTabId) {
          dispatch({ type: 'UPDATE_TAB', id: state.activeTabId, updates: { isLoading: true } })
          setTimeout(() => dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { isLoading: false } }), 1000)
        }
      }

      // Ctrl+Shift+J — Toggle AI Sidebar
      if (ctrl && e.shiftKey && e.key === 'J') {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_SIDEBAR' })
      }

      // Ctrl+1-9 — Switch to tab
      if (ctrl && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1
        if (state.tabs[idx]) {
          e.preventDefault()
          dispatch({ type: 'SET_ACTIVE_TAB', id: state.tabs[idx].id })
        }
      }

      // Ctrl+Tab — Next tab
      if (ctrl && e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        const idx = state.tabs.findIndex(t => t.id === state.activeTabId)
        const next = state.tabs[(idx + 1) % state.tabs.length]
        dispatch({ type: 'SET_ACTIVE_TAB', id: next.id })
      }

      // Ctrl+Shift+Tab — Previous tab
      if (ctrl && e.shiftKey && e.key === 'Tab') {
        e.preventDefault()
        const idx = state.tabs.findIndex(t => t.id === state.activeTabId)
        const prev = state.tabs[(idx - 1 + state.tabs.length) % state.tabs.length]
        dispatch({ type: 'SET_ACTIVE_TAB', id: prev.id })
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.tabs, state.activeTabId, state.settings.mode, dispatch])
}
