/**
 * Autofill Preload Script
 *
 * Injected into every webview/BrowserView page.
 * Detects login forms and communicates with the main process
 * to offer autofill suggestions.
 */

import { contextBridge, ipcRenderer } from 'electron'

// ─── Form Detection ───────────────────────────────────────────────────────────

function findLoginForms(): Array<{
  usernameField: HTMLInputElement | null
  passwordField: HTMLInputElement | null
  form: HTMLFormElement | null
}> {
  const passwordFields = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="password"]')
  )

  return passwordFields.map(passwordField => {
    const form = passwordField.closest('form')
    // Look for username/email field near the password field
    const usernameField =
      form?.querySelector<HTMLInputElement>('input[type="email"], input[type="text"], input[name*="user"], input[name*="email"], input[id*="user"], input[id*="email"]') ||
      document.querySelector<HTMLInputElement>('input[type="email"], input[type="text"]')

    return { usernameField, passwordField, form: form || null }
  })
}

// ─── Autofill UI Overlay ─────────────────────────────────────────────────────

function createAutofillDropdown(
  field: HTMLInputElement,
  credentials: Array<{ id: string; username: string; domain: string }>
): void {
  // Remove any existing dropdown
  document.getElementById('vikiio-autofill-dropdown')?.remove()

  if (credentials.length === 0) return

  const rect = field.getBoundingClientRect()
  const dropdown = document.createElement('div')
  dropdown.id = 'vikiio-autofill-dropdown'
  dropdown.style.cssText = `
    position: fixed;
    top: ${rect.bottom + window.scrollY + 2}px;
    left: ${rect.left + window.scrollX}px;
    width: ${Math.max(rect.width, 260)}px;
    background: #1a1d27;
    border: 1px solid #3d4166;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    overflow: hidden;
  `

  const header = document.createElement('div')
  header.style.cssText = `
    padding: 8px 12px 4px;
    font-size: 10px;
    font-weight: 700;
    color: #6c63ff;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    display: flex;
    align-items: center;
    gap: 6px;
  `
  header.innerHTML = `<img src="vikiio-icon" style="width:12px;height:12px;" onerror="this.style.display='none'"> Vikiio Passwords`
  dropdown.appendChild(header)

  credentials.forEach(cred => {
    const item = document.createElement('div')
    item.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background 0.1s;
    `
    item.innerHTML = `
      <div style="width:28px;height:28px;border-radius:6px;background:#232636;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🔑</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:#e8eaf6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cred.username}</div>
        <div style="font-size:11px;color:#9fa3c7;">${cred.domain}</div>
      </div>
    `
    item.addEventListener('mouseenter', () => { item.style.background = '#2a2d3e' })
    item.addEventListener('mouseleave', () => { item.style.background = 'transparent' })
    item.addEventListener('mousedown', (e) => {
      e.preventDefault()
      ipcRenderer.send('autofill:fill', { credentialId: cred.id })
      dropdown.remove()
    })
    dropdown.appendChild(item)
  })

  document.body.appendChild(dropdown)

  // Close on outside click
  const closeHandler = (e: MouseEvent) => {
    if (!dropdown.contains(e.target as Node)) {
      dropdown.remove()
      document.removeEventListener('mousedown', closeHandler)
    }
  }
  setTimeout(() => document.addEventListener('mousedown', closeHandler), 100)
}

// ─── Form Submission Detection ────────────────────────────────────────────────

function watchFormSubmissions(): void {
  document.addEventListener('submit', (e) => {
    const form = e.target as HTMLFormElement
    const passwordField = form.querySelector<HTMLInputElement>('input[type="password"]')
    const usernameField = form.querySelector<HTMLInputElement>('input[type="email"], input[type="text"]')

    if (passwordField && usernameField && passwordField.value && usernameField.value) {
      ipcRenderer.send('autofill:savePrompt', {
        domain: window.location.hostname,
        url: window.location.href,
        username: usernameField.value,
        password: passwordField.value,
      })
    }
  }, true)
}

// ─── Focus Listener ───────────────────────────────────────────────────────────

function watchPasswordFields(): void {
  const observer = new MutationObserver(() => attachListeners())
  observer.observe(document.body, { childList: true, subtree: true })
  attachListeners()
}

function attachListeners(): void {
  const forms = findLoginForms()
  forms.forEach(({ usernameField, passwordField }) => {
    if (!usernameField || (usernameField as any).__vikiioListened) return
    ;(usernameField as any).__vikiioListened = true

    usernameField.addEventListener('focus', async () => {
      const domain = window.location.hostname
      const credentials = await ipcRenderer.invoke('vault:getCredentialsForPage', domain)
      if (credentials?.length > 0) {
        createAutofillDropdown(usernameField, credentials)
      }
    })

    if (passwordField) {
      passwordField.addEventListener('focus', async () => {
        const domain = window.location.hostname
        const credentials = await ipcRenderer.invoke('vault:getCredentialsForPage', domain)
        if (credentials?.length > 0) {
          createAutofillDropdown(passwordField, credentials)
        }
      })
    }
  })
}

// ─── Fill Credentials ────────────────────────────────────────────────────────

ipcRenderer.on('autofill:fill-credentials', (_event, { username, password }: { username: string; password: string }) => {
  const forms = findLoginForms()
  if (forms.length === 0) return
  const { usernameField, passwordField } = forms[0]

  if (usernameField) {
    usernameField.value = username
    usernameField.dispatchEvent(new Event('input', { bubbles: true }))
    usernameField.dispatchEvent(new Event('change', { bubbles: true }))
  }
  if (passwordField) {
    passwordField.value = password
    passwordField.dispatchEvent(new Event('input', { bubbles: true }))
    passwordField.dispatchEvent(new Event('change', { bubbles: true }))
  }
})

// ─── Init ────────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    watchPasswordFields()
    watchFormSubmissions()
  })
} else {
  watchPasswordFields()
  watchFormSubmissions()
}
