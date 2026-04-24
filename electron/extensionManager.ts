/**
 * Chrome Extension Manifest V3 Support Layer
 *
 * Electron supports loading unpacked Chrome extensions via
 * session.loadExtension(). This module manages:
 *
 * - Loading/unloading extensions from disk
 * - Persisting installed extensions list in userData
 * - Exposing extension metadata (name, version, icons, permissions)
 * - Handling MV3 service workers via Electron's built-in support
 * - IPC handlers for the renderer's Extension Manager UI
 *
 * Limitations vs full Chrome:
 * - chrome.tabs API is partially shimmed
 * - Web Store installation not supported (sideload only)
 * - Some MV3 APIs (e.g. declarativeNetRequest) require Electron 28+
 */

import { ipcMain, session, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export interface ExtensionInfo {
  id: string
  name: string
  version: string
  description: string
  manifestVersion: number
  icons: Record<string, string>
  permissions: string[]
  hostPermissions: string[]
  enabled: boolean
  path: string
  installedAt: number
}

const EXTENSIONS_META_FILE = () =>
  path.join(app.getPath('userData'), 'extensions.json')

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadExtensionsMeta(): ExtensionInfo[] {
  const p = EXTENSIONS_META_FILE()
  if (!fs.existsSync(p)) return []
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return []
  }
}

function saveExtensionsMeta(exts: ExtensionInfo[]): void {
  fs.writeFileSync(EXTENSIONS_META_FILE(), JSON.stringify(exts, null, 2))
}

// ─── Manifest Parsing ────────────────────────────────────────────────────────

function parseManifest(extPath: string): Partial<ExtensionInfo> | null {
  const manifestPath = path.join(extPath, 'manifest.json')
  if (!fs.existsSync(manifestPath)) return null

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    return {
      name: manifest.name || 'Unknown Extension',
      version: manifest.version || '0.0.0',
      description: manifest.description || '',
      manifestVersion: manifest.manifest_version || 2,
      icons: manifest.icons || {},
      permissions: manifest.permissions || [],
      hostPermissions: manifest.host_permissions || [],
    }
  } catch {
    return null
  }
}

// ─── Extension Loading ───────────────────────────────────────────────────────

async function loadExtensionIntoSession(
  extPath: string,
  ses: Electron.Session = session.defaultSession
): Promise<Electron.Extension> {
  return ses.loadExtension(extPath, { allowFileAccess: true })
}

async function unloadExtensionFromSession(
  extId: string,
  ses: Electron.Session = session.defaultSession
): Promise<void> {
  await ses.removeExtension(extId)
}

// ─── Install from folder ─────────────────────────────────────────────────────

async function installExtension(extPath: string): Promise<ExtensionInfo> {
  const meta = parseManifest(extPath)
  if (!meta) throw new Error('Invalid extension: missing manifest.json')

  const loaded = await loadExtensionIntoSession(extPath)
  const info: ExtensionInfo = {
    id: loaded.id,
    name: meta.name!,
    version: meta.version!,
    description: meta.description!,
    manifestVersion: meta.manifestVersion!,
    icons: meta.icons!,
    permissions: meta.permissions!,
    hostPermissions: meta.hostPermissions!,
    enabled: true,
    path: extPath,
    installedAt: Date.now(),
  }

  const existing = loadExtensionsMeta()
  const updated = [...existing.filter(e => e.id !== info.id), info]
  saveExtensionsMeta(updated)

  return info
}

// ─── Boot: reload persisted extensions ───────────────────────────────────────

export async function bootExtensions(): Promise<void> {
  const exts = loadExtensionsMeta().filter(e => e.enabled)
  for (const ext of exts) {
    if (fs.existsSync(ext.path)) {
      try {
        await loadExtensionIntoSession(ext.path)
        console.log(`[Extensions] Loaded: ${ext.name} v${ext.version}`)
      } catch (err) {
        console.warn(`[Extensions] Failed to load ${ext.name}:`, err)
      }
    }
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

export function registerExtensionIPC(): void {
  // List installed extensions
  ipcMain.handle('ext:list', async () => {
    return loadExtensionsMeta()
  })

  // Install from a local folder path
  ipcMain.handle('ext:install', async (_event, extPath: string) => {
    try {
      const info = await installExtension(extPath)
      return { success: true, extension: info }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Toggle enable/disable
  ipcMain.handle('ext:toggle', async (_event, extId: string) => {
    const exts = loadExtensionsMeta()
    const ext = exts.find(e => e.id === extId)
    if (!ext) return { success: false, error: 'Extension not found' }

    try {
      if (ext.enabled) {
        await unloadExtensionFromSession(extId)
        ext.enabled = false
      } else {
        await loadExtensionIntoSession(ext.path)
        ext.enabled = true
      }
      saveExtensionsMeta(exts)
      return { success: true, enabled: ext.enabled }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Uninstall / remove
  ipcMain.handle('ext:uninstall', async (_event, extId: string) => {
    try {
      await unloadExtensionFromSession(extId)
    } catch {
      // ignore if already unloaded
    }
    const exts = loadExtensionsMeta().filter(e => e.id !== extId)
    saveExtensionsMeta(exts)
    return { success: true }
  })

  // Get loaded extensions from active session
  ipcMain.handle('ext:loaded', async () => {
    const loaded = session.defaultSession.getAllExtensions()
    return Object.values(loaded).map(e => ({ id: e.id, name: e.name, version: e.version }))
  })
}
