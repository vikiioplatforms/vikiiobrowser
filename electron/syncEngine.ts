/**
 * E2E Encrypted Cloud Sync Engine
 *
 * Architecture:
 * - All data is encrypted client-side with AES-256-GCM before leaving the device
 * - Encryption key is derived from the user's sync passphrase using PBKDF2 (100k iterations)
 * - The server (or any storage backend) never sees plaintext data
 * - Sync payload: { iv, salt, ciphertext } — all base64 encoded
 * - Conflict resolution: last-write-wins with vector clock timestamps
 */

import { ipcMain } from 'electron'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

const SYNC_VERSION = 1
const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH = 32 // 256 bits
const ALGORITHM = 'aes-256-gcm'

export interface SyncPayload {
  version: number
  deviceId: string
  timestamp: number
  iv: string
  salt: string
  authTag: string
  ciphertext: string
}

export interface SyncData {
  bookmarks: unknown[]
  history: unknown[]
  settings: unknown
  notes: unknown[]
  containers: unknown[]
  workspaces: unknown[]
  passwords: unknown[]
  syncedAt: number
}

// ─── Key Derivation ──────────────────────────────────────────────────────────

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256')
}

// ─── Encryption ──────────────────────────────────────────────────────────────

export function encryptData(data: SyncData, passphrase: string): SyncPayload {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const key = deriveKey(passphrase, salt)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const plaintext = JSON.stringify(data)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    version: SYNC_VERSION,
    deviceId: getDeviceId(),
    timestamp: Date.now(),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  }
}

// ─── Decryption ──────────────────────────────────────────────────────────────

export function decryptData(payload: SyncPayload, passphrase: string): SyncData {
  const salt = Buffer.from(payload.salt, 'base64')
  const iv = Buffer.from(payload.iv, 'base64')
  const authTag = Buffer.from(payload.authTag, 'base64')
  const ciphertext = Buffer.from(payload.ciphertext, 'base64')
  const key = deriveKey(passphrase, salt)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(decrypted.toString('utf8')) as SyncData
}

// ─── Device Identity ─────────────────────────────────────────────────────────

function getDeviceId(): string {
  const idPath = path.join(app.getPath('userData'), 'device-id.txt')
  if (fs.existsSync(idPath)) {
    return fs.readFileSync(idPath, 'utf8').trim()
  }
  const id = crypto.randomUUID()
  fs.writeFileSync(idPath, id)
  return id
}

// ─── Local Sync State ────────────────────────────────────────────────────────

function getSyncStatePath(): string {
  return path.join(app.getPath('userData'), 'sync-state.json')
}

export function saveSyncState(payload: SyncPayload): void {
  fs.writeFileSync(getSyncStatePath(), JSON.stringify(payload, null, 2))
}

export function loadSyncState(): SyncPayload | null {
  const p = getSyncStatePath()
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as SyncPayload
  } catch {
    return null
  }
}

// ─── Remote Sync (pluggable backend) ─────────────────────────────────────────

export interface SyncBackend {
  upload(payload: SyncPayload): Promise<void>
  download(deviceId: string): Promise<SyncPayload | null>
  listDevices(): Promise<Array<{ deviceId: string; timestamp: number }>>
}

/**
 * Simple HTTPS backend implementation.
 * Replace SYNC_SERVER_URL with your own sync server or use a self-hosted option.
 */
export class HttpSyncBackend implements SyncBackend {
  constructor(private serverUrl: string, private authToken: string) {}

  async upload(payload: SyncPayload): Promise<void> {
    const response = await fetch(`${this.serverUrl}/sync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`Sync upload failed: ${response.status}`)
  }

  async download(deviceId: string): Promise<SyncPayload | null> {
    const response = await fetch(`${this.serverUrl}/sync/latest`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    })
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Sync download failed: ${response.status}`)
    return response.json() as Promise<SyncPayload>
  }

  async listDevices(): Promise<Array<{ deviceId: string; timestamp: number }>> {
    const response = await fetch(`${this.serverUrl}/sync/devices`, {
      headers: { 'Authorization': `Bearer ${this.authToken}` },
    })
    if (!response.ok) return []
    return response.json()
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

export function registerSyncIPC(): void {
  // Encrypt and save data locally
  ipcMain.handle('sync:encrypt', async (_event, data: SyncData, passphrase: string) => {
    try {
      const payload = encryptData(data, passphrase)
      saveSyncState(payload)
      return { success: true, payload }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Decrypt locally stored sync state
  ipcMain.handle('sync:decrypt', async (_event, passphrase: string) => {
    try {
      const payload = loadSyncState()
      if (!payload) return { success: false, error: 'No sync data found' }
      const data = decryptData(payload, passphrase)
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: 'Wrong passphrase or corrupted data' }
    }
  })

  // Get device ID
  ipcMain.handle('sync:deviceId', async () => {
    return getDeviceId()
  })

  // Get last sync timestamp
  ipcMain.handle('sync:status', async () => {
    const state = loadSyncState()
    return {
      lastSync: state?.timestamp ?? null,
      deviceId: getDeviceId(),
    }
  })
}
