import { createContext, useContext, useReducer, Dispatch } from 'react'
import type {
  Tab, Bookmark, BookmarkFolder, HistoryEntry, DownloadItem,
  Container, AIMessage, AIConversation, PrivacyStats,
  BrowserSettings, SavedNote, Workspace, BrowserMode, TabGroup
} from '../types'

export interface BrowserState {
  tabs: Tab[]
  activeTabId: string | null
  tabGroups: TabGroup[]
  bookmarks: Bookmark[]
  bookmarkFolders: BookmarkFolder[]
  history: HistoryEntry[]
  downloads: DownloadItem[]
  containers: Container[]
  aiConversations: AIConversation[]
  currentConversation: AIConversation | null
  privacyStats: PrivacyStats
  settings: BrowserSettings
  savedNotes: SavedNote[]
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  sidebarOpen: boolean
  sidebarTab: 'chat' | 'summary' | 'actions' | 'tabs' | 'notes' | 'history' | 'bookmarks' | 'downloads' | 'settings'
  isAiLoading: boolean
  currentPageContent: string
  showNewTabPage: boolean
}

export type BrowserAction =
  | { type: 'ADD_TAB'; tab: Tab }
  | { type: 'CLOSE_TAB'; id: string }
  | { type: 'SET_ACTIVE_TAB'; id: string }
  | { type: 'UPDATE_TAB'; id: string; updates: Partial<Tab> }
  | { type: 'PIN_TAB'; id: string }
  | { type: 'MUTE_TAB'; id: string }
  | { type: 'DUPLICATE_TAB'; id: string }
  | { type: 'MOVE_TAB'; fromIndex: number; toIndex: number }
  | { type: 'ADD_BOOKMARK'; bookmark: Bookmark }
  | { type: 'REMOVE_BOOKMARK'; id: string }
  | { type: 'UPDATE_BOOKMARK'; id: string; updates: Partial<Bookmark> }
  | { type: 'ADD_HISTORY'; entry: HistoryEntry }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'ADD_DOWNLOAD'; item: DownloadItem }
  | { type: 'UPDATE_DOWNLOAD'; id: string; updates: Partial<DownloadItem> }
  | { type: 'ADD_AI_MESSAGE'; message: AIMessage }
  | { type: 'CLEAR_AI_CONVERSATION' }
  | { type: 'SET_AI_LOADING'; loading: boolean }
  | { type: 'UPDATE_PRIVACY_STATS'; stats: Partial<PrivacyStats> }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<BrowserSettings> }
  | { type: 'SET_BROWSER_MODE'; mode: BrowserMode }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_TAB'; tab: BrowserState['sidebarTab'] }
  | { type: 'SET_PAGE_CONTENT'; content: string }
  | { type: 'ADD_NOTE'; note: SavedNote }
  | { type: 'UPDATE_NOTE'; id: string; updates: Partial<SavedNote> }
  | { type: 'DELETE_NOTE'; id: string }
  | { type: 'SET_SHOW_NEW_TAB'; show: boolean }

const defaultSettings: BrowserSettings = {
  mode: 'normal',
  shieldLevel: 'standard',
  adBlocking: true,
  trackerBlocking: true,
  cookieBlocking: false,
  fingerprintProtection: true,
  vpnEnabled: false,
  aiEnabled: true,
  aiApiKey: '',
  defaultSearchEngine: 'google',
  homepage: 'newtab',
  showBookmarkBar: true,
  theme: 'dark',
}

const defaultContainers: Container[] = [
  { id: 'personal', name: 'Personal', color: '#6c63ff', icon: '👤', vpnEnabled: false, aiMemoryEnabled: true },
  { id: 'work', name: 'Work', color: '#4fc3f7', icon: '💼', vpnEnabled: false, aiMemoryEnabled: true },
  { id: 'banking', name: 'Banking', color: '#4caf7d', icon: '🏦', vpnEnabled: true, aiMemoryEnabled: false },
  { id: 'shopping', name: 'Shopping', color: '#f5a623', icon: '🛍️', vpnEnabled: false, aiMemoryEnabled: true },
  { id: 'social', name: 'Social', color: '#e05252', icon: '💬', vpnEnabled: false, aiMemoryEnabled: false },
  { id: 'anonymous', name: 'Anonymous', color: '#9fa3c7', icon: '🕵️', vpnEnabled: true, aiMemoryEnabled: false },
]

const newTabEntry: Tab = {
  id: 'tab-1',
  title: 'New Tab',
  url: 'newtab',
  isLoading: false,
  canGoBack: false,
  canGoForward: false,
  pinned: false,
  muted: false,
  mode: 'normal',
  trackersBlocked: 0,
  adsBlocked: 0,
}

export const initialState: BrowserState = {
  tabs: [newTabEntry],
  activeTabId: 'tab-1',
  tabGroups: [],
  bookmarks: [
    { id: 'bm-1', title: 'GitHub', url: 'https://github.com', tags: ['dev'], createdAt: new Date() },
    { id: 'bm-2', title: 'Google', url: 'https://google.com', tags: [], createdAt: new Date() },
    { id: 'bm-3', title: 'YouTube', url: 'https://youtube.com', tags: ['media'], createdAt: new Date() },
  ],
  bookmarkFolders: [],
  history: [],
  downloads: [],
  containers: defaultContainers,
  aiConversations: [],
  currentConversation: {
    id: 'conv-1',
    mode: 'normal',
    title: 'New Conversation',
    messages: [],
    saved: false,
    createdAt: new Date(),
  },
  privacyStats: { trackersBlocked: 0, adsBlocked: 0, cookiesBlocked: 0, timeSaved: 0 },
  settings: defaultSettings,
  savedNotes: [],
  workspaces: [
    { id: 'ws-1', name: 'Personal', icon: '🏠', color: '#6c63ff', tabIds: ['tab-1'] },
    { id: 'ws-2', name: 'Work', icon: '💼', color: '#4fc3f7', tabIds: [] },
  ],
  activeWorkspaceId: 'ws-1',
  sidebarOpen: false,
  sidebarTab: 'chat',
  isAiLoading: false,
  currentPageContent: '',
  showNewTabPage: true,
}

export function browserReducer(state: BrowserState, action: BrowserAction): BrowserState {
  switch (action.type) {
    case 'ADD_TAB': {
      const tabs = [...state.tabs, action.tab]
      return { ...state, tabs, activeTabId: action.tab.id, showNewTabPage: action.tab.url === 'newtab' }
    }
    case 'CLOSE_TAB': {
      if (state.tabs.length === 1) {
        // Create new tab instead of closing last
        const newTab: Tab = {
          id: `tab-${Date.now()}`,
          title: 'New Tab', url: 'newtab', isLoading: false,
          canGoBack: false, canGoForward: false, pinned: false, muted: false,
          mode: state.settings.mode, trackersBlocked: 0, adsBlocked: 0,
        }
        return { ...state, tabs: [newTab], activeTabId: newTab.id, showNewTabPage: true }
      }
      const tabs = state.tabs.filter(t => t.id !== action.id)
      const activeTabId = state.activeTabId === action.id
        ? tabs[Math.max(0, state.tabs.findIndex(t => t.id === action.id) - 1)].id
        : state.activeTabId
      const activeTab = tabs.find(t => t.id === activeTabId)
      return { ...state, tabs, activeTabId, showNewTabPage: activeTab?.url === 'newtab' }
    }
    case 'SET_ACTIVE_TAB': {
      const tab = state.tabs.find(t => t.id === action.id)
      return { ...state, activeTabId: action.id, showNewTabPage: tab?.url === 'newtab' }
    }
    case 'UPDATE_TAB': {
      const tabs = state.tabs.map(t => t.id === action.id ? { ...t, ...action.updates } : t)
      const activeTab = tabs.find(t => t.id === state.activeTabId)
      return { ...state, tabs, showNewTabPage: activeTab?.url === 'newtab' }
    }
    case 'PIN_TAB':
      return { ...state, tabs: state.tabs.map(t => t.id === action.id ? { ...t, pinned: !t.pinned } : t) }
    case 'MUTE_TAB':
      return { ...state, tabs: state.tabs.map(t => t.id === action.id ? { ...t, muted: !t.muted } : t) }
    case 'DUPLICATE_TAB': {
      const orig = state.tabs.find(t => t.id === action.id)
      if (!orig) return state
      const dup: Tab = { ...orig, id: `tab-${Date.now()}`, pinned: false }
      const idx = state.tabs.findIndex(t => t.id === action.id)
      const tabs = [...state.tabs.slice(0, idx + 1), dup, ...state.tabs.slice(idx + 1)]
      return { ...state, tabs, activeTabId: dup.id }
    }
    case 'MOVE_TAB': {
      const tabs = [...state.tabs]
      const [moved] = tabs.splice(action.fromIndex, 1)
      tabs.splice(action.toIndex, 0, moved)
      return { ...state, tabs }
    }
    case 'ADD_BOOKMARK':
      return { ...state, bookmarks: [...state.bookmarks, action.bookmark] }
    case 'REMOVE_BOOKMARK':
      return { ...state, bookmarks: state.bookmarks.filter(b => b.id !== action.id) }
    case 'UPDATE_BOOKMARK':
      return { ...state, bookmarks: state.bookmarks.map(b => b.id === action.id ? { ...b, ...action.updates } : b) }
    case 'ADD_HISTORY':
      return { ...state, history: [action.entry, ...state.history.slice(0, 999)] }
    case 'CLEAR_HISTORY':
      return { ...state, history: [] }
    case 'ADD_DOWNLOAD':
      return { ...state, downloads: [action.item, ...state.downloads] }
    case 'UPDATE_DOWNLOAD':
      return { ...state, downloads: state.downloads.map(d => d.id === action.id ? { ...d, ...action.updates } : d) }
    case 'ADD_AI_MESSAGE': {
      const conv = state.currentConversation
      if (!conv) return state
      const updated = { ...conv, messages: [...conv.messages, action.message] }
      return { ...state, currentConversation: updated }
    }
    case 'CLEAR_AI_CONVERSATION': {
      const fresh: AIConversation = {
        id: `conv-${Date.now()}`, mode: state.settings.mode,
        title: 'New Conversation', messages: [], saved: false, createdAt: new Date(),
      }
      return { ...state, currentConversation: fresh }
    }
    case 'SET_AI_LOADING':
      return { ...state, isAiLoading: action.loading }
    case 'UPDATE_PRIVACY_STATS':
      return { ...state, privacyStats: { ...state.privacyStats, ...action.stats } }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'SET_BROWSER_MODE': {
      const mode = action.mode
      return {
        ...state,
        settings: { ...state.settings, mode },
        tabs: state.tabs.map(t => t.id === state.activeTabId ? { ...t, mode } : t),
      }
    }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_SIDEBAR_TAB':
      return { ...state, sidebarTab: action.tab, sidebarOpen: true }
    case 'SET_PAGE_CONTENT':
      return { ...state, currentPageContent: action.content }
    case 'ADD_NOTE':
      return { ...state, savedNotes: [action.note, ...state.savedNotes] }
    case 'UPDATE_NOTE':
      return { ...state, savedNotes: state.savedNotes.map(n => n.id === action.id ? { ...n, ...action.updates } : n) }
    case 'DELETE_NOTE':
      return { ...state, savedNotes: state.savedNotes.filter(n => n.id !== action.id) }
    case 'SET_SHOW_NEW_TAB':
      return { ...state, showNewTabPage: action.show }
    default:
      return state
  }
}

export const BrowserContext = createContext<{
  state: BrowserState
  dispatch: Dispatch<BrowserAction>
} | null>(null)

export function useBrowser() {
  const ctx = useContext(BrowserContext)
  if (!ctx) throw new Error('useBrowser must be used within BrowserProvider')
  return ctx
}
