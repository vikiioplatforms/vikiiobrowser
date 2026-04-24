/**
 * Password Autofill System
 *
 * Architecture:
 * - Passwords stored encrypted with AES-256-GCM in userData/vault.json
 * - Master password derived via PBKDF2 (100k iterations) to produce vault key
 * - Each credential entry: { id, domain, username, password (encrypted), notes, createdAt, lastUsed }
 * - Autofill injection: preload script detects login forms and injects credentials
 * - IPC handlers: save, retrieve, delete, generate, search credentials
 * - Password health: check for weak, reused, and breached passwords (HIBP API)
 */

import { ipcMain, app } from 'electron'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

const VAULT_FILE = () => path.join(app.getPath('userData'), 'vault.json')
const PBKDF2_ITERATIONS = 100_000
const KEY_LEN = 32
const ALG = 'aes-256-gcm'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultEntry {
  id: string
  domain: string
  url: string
  username: string
  encryptedPassword: string
  iv: string
  authTag: string
  notes: string
  createdAt: number
  lastUsed: number | null
  passwordStrength: 'weak' | 'fair' | 'strong' | 'very-strong'
  breached: boolean
}

export interface VaultFile {
  version: number
  salt: string
  entries: VaultEntry[]
}

// ─── Key Derivation ───────────────────────────────────────────────────────────

function deriveKey(masterPassword: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterPassword, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha256')
}

// ─── Encrypt / Decrypt ───────────────────────────────────────────────────────

function encryptPassword(plaintext: string, key: Buffer): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALG, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  }
}

function decryptPassword(encrypted: string, iv: string, authTag: string, key: Buffer): string {
  const decipher = crypto.createDecipheriv(ALG, key, Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(authTag, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()])
  return decrypted.toString('utf8')
}

// ─── Vault I/O ────────────────────────────────────────────────────────────────

function loadVault(): VaultFile | null {
  const p = VAULT_FILE()
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function saveVault(vault: VaultFile): void {
  fs.writeFileSync(VAULT_FILE(), JSON.stringify(vault, null, 2), { mode: 0o600 })
}

function getOrCreateVault(): VaultFile {
  const existing = loadVault()
  if (existing) return existing
  const vault: VaultFile = {
    version: 1,
    salt: crypto.randomBytes(16).toString('base64'),
    entries: [],
  }
  saveVault(vault)
  return vault
}

// ─── Password Strength ───────────────────────────────────────────────────────

function assessStrength(password: string): VaultEntry['passwordStrength'] {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return 'weak'
  if (score <= 4) return 'fair'
  if (score <= 6) return 'strong'
  return 'very-strong'
}

// ─── Password Generator ──────────────────────────────────────────────────────

function generatePassword(options: {
  length?: number
  uppercase?: boolean
  lowercase?: boolean
  numbers?: boolean
  symbols?: boolean
}): string {
  const {
    length = 20,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options

  let charset = ''
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (numbers)   charset += '0123456789'
  if (symbols)   charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz'

  const bytes = crypto.randomBytes(length)
  return Array.from(bytes).map(b => charset[b % charset.length]).join('')
}

// ─── HIBP Breach Check ───────────────────────────────────────────────────────

async function checkBreach(password: string): Promise<boolean> {
  try {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    })
    if (!res.ok) return false
    const text = await res.text()
    return text.split('\n').some(line => line.startsWith(suffix))
  } catch {
    return false
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

export function registerAutofillIPC(): void {
  // Save a new credential
  ipcMain.handle('vault:save', async (_event, {
    masterPassword, domain, url, username, password, notes
  }: {
    masterPassword: string; domain: string; url: string
    username: string; password: string; notes?: string
  }) => {
    try {
      const vault = getOrCreateVault()
      const salt = Buffer.from(vault.salt, 'base64')
      const key = deriveKey(masterPassword, salt)
      const { encrypted, iv, authTag } = encryptPassword(password, key)
      const strength = assessStrength(password)
      const breached = await checkBreach(password)

      const entry: VaultEntry = {
        id: crypto.randomUUID(),
        domain, url, username,
        encryptedPassword: encrypted,
        iv, authTag,
        notes: notes || '',
        createdAt: Date.now(),
        lastUsed: null,
        passwordStrength: strength,
        breached,
      }

      vault.entries = [...vault.entries.filter(e => !(e.domain === domain && e.username === username)), entry]
      saveVault(vault)
      return { success: true, id: entry.id }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Get credentials for a domain (for autofill)
  ipcMain.handle('vault:getForDomain', async (_event, { masterPassword, domain }: { masterPassword: string; domain: string }) => {
    try {
      const vault = loadVault()
      if (!vault) return { success: true, credentials: [] }
      const salt = Buffer.from(vault.salt, 'base64')
      const key = deriveKey(masterPassword, salt)
      const matches = vault.entries.filter(e => e.domain.includes(domain) || domain.includes(e.domain))
      const credentials = matches.map(e => ({
        id: e.id,
        domain: e.domain,
        username: e.username,
        password: decryptPassword(e.encryptedPassword, e.iv, e.authTag, key),
        lastUsed: e.lastUsed,
      }))
      return { success: true, credentials }
    } catch {
      return { success: false, error: 'Wrong master password' }
    }
  })

  // List all entries (without decrypting passwords)
  ipcMain.handle('vault:list', async () => {
    const vault = loadVault()
    if (!vault) return []
    return vault.entries.map(e => ({
      id: e.id, domain: e.domain, url: e.url, username: e.username,
      createdAt: e.createdAt, lastUsed: e.lastUsed,
      passwordStrength: e.passwordStrength, breached: e.breached,
    }))
  })

  // Delete a credential
  ipcMain.handle('vault:delete', async (_event, id: string) => {
    const vault = loadVault()
    if (!vault) return { success: false }
    vault.entries = vault.entries.filter(e => e.id !== id)
    saveVault(vault)
    return { success: true }
  })

  // Generate a strong password
  ipcMain.handle('vault:generate', async (_event, options: Parameters<typeof generatePassword>[0]) => {
    return generatePassword(options)
  })

  // Check if vault exists
  ipcMain.handle('vault:exists', async () => {
    return fs.existsSync(VAULT_FILE())
  })
}
