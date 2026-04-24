import { useReducer } from 'react'
import { BrowserContext, browserReducer, initialState } from './store/browserStore'
import { BrowserShell } from './components/BrowserShell'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './styles/globals.css'

function BrowserApp() {
  useKeyboardShortcuts()
  return <BrowserShell />
}

export default function App() {
  const [state, dispatch] = useReducer(browserReducer, initialState)

  return (
    <BrowserContext.Provider value={{ state, dispatch }}>
      <BrowserApp />
    </BrowserContext.Provider>
  )
}
