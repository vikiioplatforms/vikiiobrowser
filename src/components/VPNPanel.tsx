import { useState, useEffect } from 'react'
import styles from './VPNPanel.module.css'

interface VPNServer {
  id: string
  name: string
  location: string
  flag: string
  latency: number
  load: number
}

const DEMO_SERVERS: VPNServer[] = [
  { id: 'us-east', name: 'US East', location: 'New York, USA', flag: '🇺🇸', latency: 12, load: 34 },
  { id: 'us-west', name: 'US West', location: 'San Francisco, USA', flag: '🇺🇸', latency: 18, load: 28 },
  { id: 'eu-west', name: 'EU West', location: 'Amsterdam, Netherlands', flag: '🇳🇱', latency: 45, load: 52 },
  { id: 'eu-central', name: 'EU Central', location: 'Frankfurt, Germany', flag: '🇩🇪', latency: 48, load: 41 },
  { id: 'uk', name: 'UK', location: 'London, UK', flag: '🇬🇧', latency: 55, load: 38 },
  { id: 'jp', name: 'Japan', location: 'Tokyo, Japan', flag: '🇯🇵', latency: 120, load: 22 },
  { id: 'sg', name: 'Singapore', location: 'Singapore', flag: '🇸🇬', latency: 95, load: 30 },
  { id: 'au', name: 'Australia', location: 'Sydney, Australia', flag: '🇦🇺', latency: 180, load: 15 },
]

type VPNState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting'

export function VPNPanel() {
  const [vpnState, setVpnState] = useState<VPNState>('disconnected')
  const [selectedServer, setSelectedServer] = useState<VPNServer>(DEMO_SERVERS[0])
  const [connectedServer, setConnectedServer] = useState<VPNServer | null>(null)
  const [bytesIn, setBytesIn] = useState(0)
  const [bytesOut, setBytesOut] = useState(0)
  const [connectedAt, setConnectedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState('00:00:00')
  const [showImport, setShowImport] = useState(false)
  const [wgConfig, setWgConfig] = useState('')
  const [configName, setConfigName] = useState('')
  const [killSwitch, setKillSwitch] = useState(false)
  const [splitTunnel, setSplitTunnel] = useState(false)

  // Timer for connection duration
  useEffect(() => {
    if (vpnState !== 'connected' || !connectedAt) return
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - connectedAt) / 1000)
      const h = String(Math.floor(secs / 3600)).padStart(2, '0')
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
      const s = String(secs % 60).padStart(2, '0')
      setElapsed(`${h}:${m}:${s}`)
      // Simulate traffic
      setBytesIn(p => p + Math.floor(Math.random() * 5000))
      setBytesOut(p => p + Math.floor(Math.random() * 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [vpnState, connectedAt])

  const connect = async () => {
    setVpnState('connecting')
    await new Promise(r => setTimeout(r, 1800))
    setVpnState('connected')
    setConnectedServer(selectedServer)
    setConnectedAt(Date.now())
    setBytesIn(0)
    setBytesOut(0)
  }

  const disconnect = async () => {
    setVpnState('disconnecting')
    await new Promise(r => setTimeout(r, 800))
    setVpnState('disconnected')
    setConnectedServer(null)
    setConnectedAt(null)
    setElapsed('00:00:00')
  }

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1024 / 1024).toFixed(2)} MB`
  }

  const isConnected = vpnState === 'connected'
  const isBusy = vpnState === 'connecting' || vpnState === 'disconnecting'

  return (
    <div className={styles.panel}>
      {/* Status Card */}
      <div className={`${styles.statusCard} ${styles[vpnState]}`}>
        <div className={styles.statusLeft}>
          <div className={`${styles.statusIcon} ${styles[vpnState]}`}>
            {vpnState === 'connected' ? '🔒' : vpnState === 'connecting' ? '⟳' : '🔓'}
          </div>
          <div>
            <div className={styles.statusTitle}>
              {vpnState === 'connected' ? 'VPN Connected' :
               vpnState === 'connecting' ? 'Connecting...' :
               vpnState === 'disconnecting' ? 'Disconnecting...' : 'VPN Off'}
            </div>
            {isConnected && connectedServer && (
              <div className={styles.statusSub}>
                {connectedServer.flag} {connectedServer.location} · {elapsed}
              </div>
            )}
            {!isConnected && vpnState === 'disconnected' && (
              <div className={styles.statusSub}>Your real IP is exposed</div>
            )}
          </div>
        </div>
        <button
          className={`${styles.toggleBtn} ${isConnected ? styles.toggleOff : styles.toggleOn}`}
          onClick={isConnected ? disconnect : connect}
          disabled={isBusy}
        >
          {isBusy ? '...' : isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Traffic Stats */}
      {isConnected && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>⬇️</span>
            <div>
              <div className={styles.statVal}>{formatBytes(bytesIn)}</div>
              <div className={styles.statLabel}>Downloaded</div>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statIcon}>⬆️</span>
            <div>
              <div className={styles.statVal}>{formatBytes(bytesOut)}</div>
              <div className={styles.statLabel}>Uploaded</div>
            </div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statIcon}>📶</span>
            <div>
              <div className={styles.statVal}>{connectedServer?.latency}ms</div>
              <div className={styles.statLabel}>Latency</div>
            </div>
          </div>
        </div>
      )}

      {/* Server List */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Select Server</div>
        <div className={styles.serverList}>
          {DEMO_SERVERS.map(server => (
            <div
              key={server.id}
              className={`${styles.serverRow} ${selectedServer.id === server.id ? styles.serverSelected : ''}`}
              onClick={() => !isConnected && setSelectedServer(server)}
            >
              <span className={styles.serverFlag}>{server.flag}</span>
              <div className={styles.serverInfo}>
                <div className={styles.serverName}>{server.name}</div>
                <div className={styles.serverLoc}>{server.location}</div>
              </div>
              <div className={styles.serverMeta}>
                <span className={styles.serverLatency}>{server.latency}ms</span>
                <div className={styles.loadBar}>
                  <div
                    className={styles.loadFill}
                    style={{
                      width: `${server.load}%`,
                      background: server.load < 50 ? 'var(--success)' : server.load < 75 ? 'var(--warning)' : 'var(--danger)'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VPN Options */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Options</div>
        {[
          { key: 'killSwitch', label: 'Kill Switch', desc: 'Block all traffic if VPN drops', val: killSwitch, set: setKillSwitch },
          { key: 'splitTunnel', label: 'Split Tunneling', desc: 'Route only browser traffic through VPN', val: splitTunnel, set: setSplitTunnel },
        ].map(opt => (
          <div key={opt.key} className={styles.optRow}>
            <div>
              <div className={styles.optLabel}>{opt.label}</div>
              <div className={styles.optDesc}>{opt.desc}</div>
            </div>
            <button
              className={`${styles.toggle} ${opt.val ? styles.toggleOn : ''}`}
              onClick={() => opt.set((p: boolean) => !p)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        ))}
      </div>

      {/* Import WireGuard Config */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Custom WireGuard Config</div>
          <button className={styles.importToggle} onClick={() => setShowImport(p => !p)}>
            {showImport ? 'Cancel' : '+ Import'}
          </button>
        </div>
        {showImport && (
          <div className={styles.importForm}>
            <input
              className={styles.input}
              value={configName}
              onChange={e => setConfigName(e.target.value)}
              placeholder="Config name (e.g. My VPN)"
            />
            <textarea
              className={styles.textarea}
              value={wgConfig}
              onChange={e => setWgConfig(e.target.value)}
              placeholder="Paste your WireGuard .conf content here..."
              rows={6}
            />
            <button
              className={styles.importBtn}
              onClick={() => {
                if (configName && wgConfig) {
                  setShowImport(false)
                  setWgConfig('')
                  setConfigName('')
                }
              }}
            >
              Import Config
            </button>
          </div>
        )}
      </div>

      {/* WireGuard note */}
      <div className={styles.note}>
        <span>ℹ️</span>
        <span>WireGuard must be installed on your system. <strong>macOS:</strong> <code>brew install wireguard-tools</code> · <strong>Linux:</strong> <code>apt install wireguard</code></span>
      </div>
    </div>
  )
}
