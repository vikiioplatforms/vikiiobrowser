import { useReducer, useEffect } from 'react'
import { BrowserContext, browserReducer, initialState } from './store/browserStore'
import { BrowserShell } from './components/BrowserShell'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './styles/globals.css'

function BrowserApp() {
  useKeyboardShortcuts()
  return <BrowserShell />
}

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(browserReducer, initialState)

  // Apply theme to <html> element so all CSS variables cascade correctly
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'dark')
  }, [state.settings.theme])

  return (
    <BrowserContext.Provider value={{ state, dispatch }}>
      {children}
    </BrowserContext.Provider>
  )
}

export default function App() {
  return (
    <ThemeApplier>
      <BrowserApp />
    </ThemeApplier>
  )
}
