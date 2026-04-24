export type BrowserMode = 'normal' | 'private' | 'work' | 'anonymous' | 'locked'

export type ShieldLevel = 'standard' | 'strict' | 'custom'

export interface Tab {
  id: string
  title: string
  url: string
  faviconUrl?: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  pinned: boolean
  muted: boolean
  containerId?: string
  mode: BrowserMode
  trackersBlocked: number
  adsBlocked: number
}

export interface TabGroup {
  id: string
  name: string
  color: string
  tabIds: string[]
  collapsed: boolean
}

export interface Bookmark {
  id: string
  title: string
  url: string
  folderId?: string
  summary?: string
  notes?: string
  tags: string[]
  createdAt: Date
  faviconUrl?: string
}

export interface BookmarkFolder {
  id: string
  name: string
  parentId?: string
}

export interface HistoryEntry {
  id: string
  title: string
  url: string
  visitedAt: Date
  faviconUrl?: string
}

export interface DownloadItem {
  id: string
  filename: string
  url: string
  size: number
  downloaded: number
  status: 'downloading' | 'completed' | 'failed' | 'paused'
  startedAt: Date
}

export interface Container {
  id: string
  name: string
  color: string
  icon: string
  vpnEnabled: boolean
  aiMemoryEnabled: boolean
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface AIConversation {
  id: string
  mode: BrowserMode
  title: string
  messages: AIMessage[]
  saved: boolean
  createdAt: Date
}

export interface PrivacyStats {
  trackersBlocked: number
  adsBlocked: number
  cookiesBlocked: number
  timeSaved: number
}

export interface BrowserSettings {
  mode: BrowserMode
  shieldLevel: ShieldLevel
  adBlocking: boolean
  trackerBlocking: boolean
  cookieBlocking: boolean
  fingerprintProtection: boolean
  vpnEnabled: boolean
  aiEnabled: boolean
  aiApiKey: string
  defaultSearchEngine: string
  homepage: string
  showBookmarkBar: boolean
  theme: 'dark' | 'light' | 'system'
}

export interface SavedNote {
  id: string
  title: string
  content: string
  url?: string
  createdAt: Date
  updatedAt: Date
}

export interface Workspace {
  id: string
  name: string
  icon: string
  color: string
  tabIds: string[]
}
