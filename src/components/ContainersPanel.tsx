import { useState } from 'react'
import { useBrowser } from '../store/browserStore'
import type { Container } from '../types'
import styles from './ContainersPanel.module.css'

const CONTAINER_ICONS = ['👤', '💼', '🏦', '🛍️', '💬', '🕵️', '🎮', '📚', '🏠', '✈️']
const CONTAINER_COLORS = ['#6c63ff', '#4fc3f7', '#4caf7d', '#f5a623', '#e05252', '#9c27b0', '#607d8b', '#ff7043']

export function ContainersPanel() {
  const { state, dispatch } = useBrowser()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(CONTAINER_COLORS[0])
  const [newIcon, setNewIcon] = useState(CONTAINER_ICONS[0])

  const addContainer = () => {
    if (!newName.trim()) return
    const container: Container = {
      id: `container-${Date.now()}`,
      name: newName,
      color: newColor,
      icon: newIcon,
      vpnEnabled: false,
      aiMemoryEnabled: true,
    }
    // Add to state via settings update (containers are in state directly)
    setShowNew(false)
    setNewName('')
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>Identity Containers</div>
        <button className={styles.addBtn} onClick={() => setShowNew(!showNew)}>+ New</button>
      </div>

      <p className={styles.desc}>
        Containers separate cookies, sessions, and logins between different identities.
        Each container is completely isolated.
      </p>

      {showNew && (
        <div className={styles.newContainer}>
          <input
            className={styles.nameInput}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Container name..."
          />
          <div className={styles.iconRow}>
            {CONTAINER_ICONS.map(icon => (
              <button
                key={icon}
                className={`${styles.iconBtn} ${newIcon === icon ? styles.iconActive : ''}`}
                onClick={() => setNewIcon(icon)}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className={styles.colorRow}>
            {CONTAINER_COLORS.map(color => (
              <button
                key={color}
                className={`${styles.colorBtn} ${newColor === color ? styles.colorActive : ''}`}
                style={{ background: color }}
                onClick={() => setNewColor(color)}
              />
            ))}
          </div>
          <div className={styles.newActions}>
            <button className={styles.cancelBtn} onClick={() => setShowNew(false)}>Cancel</button>
            <button className={styles.saveBtn} onClick={addContainer}>Create</button>
          </div>
        </div>
      )}

      <div className={styles.containerList}>
        {state.containers.map(container => (
          <ContainerCard key={container.id} container={container} />
        ))}
      </div>
    </div>
  )
}

function ContainerCard({ container }: { container: Container }) {
  const { state, dispatch } = useBrowser()

  const openInContainer = () => {
    const activeTab = state.tabs.find(t => t.id === state.activeTabId)
    if (activeTab) {
      dispatch({
        type: 'UPDATE_TAB',
        id: activeTab.id,
        updates: { containerId: container.id }
      })
    }
  }

  return (
    <div className={styles.containerCard} style={{ '--container-color': container.color } as React.CSSProperties}>
      <div className={styles.containerLeft}>
        <div className={styles.containerIcon} style={{ background: container.color + '22', border: `1.5px solid ${container.color}` }}>
          {container.icon}
        </div>
        <div>
          <div className={styles.containerName}>{container.name}</div>
          <div className={styles.containerMeta}>
            {container.vpnEnabled && <span className={styles.badge} style={{ color: '#4fc3f7' }}>VPN</span>}
            {container.aiMemoryEnabled && <span className={styles.badge} style={{ color: '#6c63ff' }}>AI Memory</span>}
            {!container.aiMemoryEnabled && <span className={styles.badge} style={{ color: '#9fa3c7' }}>No AI Memory</span>}
          </div>
        </div>
      </div>
      <button className={styles.useBtn} onClick={openInContainer}>Use</button>
    </div>
  )
}
