/**
 * Firefox-style Container Network Enforcement
 *
 * Each container gets its own Electron session partition, meaning:
 * - Completely isolated cookies, localStorage, IndexedDB, cache
 * - Separate network identity (different session cookies per container)
 * - Container-specific request headers (X-Container-ID)
 * - Optional per-container proxy/VPN routing
 */

import { session, BrowserWindow } from 'electron'

export interface ContainerConfig {
  id: string
  name: string
  color: string
  vpnEnabled: boolean
  proxyHost?: string
  proxyPort?: number
  blockThirdPartyCookies: boolean
  userAgent?: string
}

const CONTAINER_SESSIONS = new Map<string, Electron.Session>()

// Tracker and ad block lists per container
const BLOCK_PATTERNS = [
  '*://googletagmanager.com/*',
  '*://google-analytics.com/*',
  '*://analytics.google.com/*',
  '*://doubleclick.net/*',
  '*://googlesyndication.com/*',
  '*://facebook.com/tr*',
  '*://connect.facebook.net/*',
  '*://platform.twitter.com/widgets*',
  '*://ads.twitter.com/*',
  '*://scorecardresearch.com/*',
  '*://quantserve.com/*',
  '*://mixpanel.com/*',
  '*://amplitude.com/*',
  '*://segment.io/*',
  '*://hotjar.com/*',
  '*://intercom.io/*',
  '*://fullstory.com/*',
  '*://mouseflow.com/*',
]

/**
 * Get or create an isolated Electron session for a container.
 * Each container uses a persistent partition named `container-{id}`.
 */
export function getContainerSession(containerId: string): Electron.Session {
  if (CONTAINER_SESSIONS.has(containerId)) {
    return CONTAINER_SESSIONS.get(containerId)!
  }

  const partition = `persist:container-${containerId}`
  const containerSession = session.fromPartition(partition, { cache: true })

  // Block trackers/ads at network level for this container
  containerSession.webRequest.onBeforeRequest(
    { urls: BLOCK_PATTERNS },
    (details, callback) => {
      callback({ cancel: true })
    }
  )

  // Add container identity header to all requests
  containerSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = {
      ...details.requestHeaders,
      'X-Vikiio-Container': containerId,
    }
    callback({ requestHeaders: headers })
  })

  CONTAINER_SESSIONS.set(containerId, containerSession)
  return containerSession
}

/**
 * Apply a container config to a session:
 * - Set proxy if VPN/proxy is enabled
 * - Set custom User-Agent if specified
 * - Block third-party cookies if enabled
 */
export async function applyContainerConfig(
  containerId: string,
  config: ContainerConfig
): Promise<void> {
  const containerSession = getContainerSession(containerId)

  // Proxy / VPN routing
  if (config.vpnEnabled && config.proxyHost && config.proxyPort) {
    await containerSession.setProxy({
      proxyRules: `socks5://${config.proxyHost}:${config.proxyPort}`,
      proxyBypassRules: 'localhost,127.0.0.1',
    })
  } else {
    await containerSession.setProxy({ mode: 'direct' })
  }

  // Custom User-Agent per container
  if (config.userAgent) {
    containerSession.setUserAgent(config.userAgent)
  }

  // Third-party cookie policy
  if (config.blockThirdPartyCookies) {
    containerSession.cookies.on('changed', (event, cookie, cause, removed) => {
      if (!removed && cookie.domain && !cookie.hostOnly) {
        containerSession.cookies.remove(
          `https://${cookie.domain}${cookie.path}`,
          cookie.name
        )
      }
    })
  }
}

/**
 * Wipe all data for a container session (cookies, cache, storage).
 * Called when user deletes a container or switches to Anonymous mode.
 */
export async function wipeContainerData(containerId: string): Promise<void> {
  const containerSession = getContainerSession(containerId)
  await containerSession.clearStorageData({
    storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'websql', 'shadercache', 'serviceworkers'],
  })
  await containerSession.clearCache()
  CONTAINER_SESSIONS.delete(containerId)
}

/**
 * List all active container sessions.
 */
export function getActiveContainers(): string[] {
  return Array.from(CONTAINER_SESSIONS.keys())
}

/**
 * Default container configs shipped with Vikiio Browser.
 */
export const DEFAULT_CONTAINER_CONFIGS: ContainerConfig[] = [
  {
    id: 'personal',
    name: 'Personal',
    color: '#6c63ff',
    vpnEnabled: false,
    blockThirdPartyCookies: false,
  },
  {
    id: 'work',
    name: 'Work',
    color: '#4fc3f7',
    vpnEnabled: false,
    blockThirdPartyCookies: false,
  },
  {
    id: 'banking',
    name: 'Banking',
    color: '#4caf7d',
    vpnEnabled: true,
    blockThirdPartyCookies: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    color: '#f5a623',
    vpnEnabled: false,
    blockThirdPartyCookies: true,
  },
  {
    id: 'social',
    name: 'Social',
    color: '#e05252',
    vpnEnabled: false,
    blockThirdPartyCookies: true,
  },
  {
    id: 'anonymous',
    name: 'Anonymous',
    color: '#9fa3c7',
    vpnEnabled: true,
    blockThirdPartyCookies: true,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  },
]
