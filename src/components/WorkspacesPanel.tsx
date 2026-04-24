import { useState } from 'react'
import { useBrowser } from '../store/browserStore'
import type { Workspace } from '../types'
import styles from './WorkspacesPanel.module.css'

const WORKSPACE_ICONS = ['🏠', '💼', '🎮', '📚', '✈️', '🔬', '🎨', '💡']
const WORKSPACE_COLORS = ['#6c63ff', '#4fc3f7', '#4caf7d', '#f5a623', '#e05252', '#9c27b0']

export function WorkspacesPanel() {
  const { state, dispatch } = useBrowser()
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState(WORKSPACE_ICONS[0])
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0])

  const createWorkspace = () => {
    if (!newName.trim()) return
    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name: newName,
      icon: newIcon,
      color: newColor,
      tabIds: [],
    }
    // In a full implementation, this would dispatch to the store
    setShowNew(false)
    setNewName('')
  }

  const activeTabs = (ws: Workspace) => state.tabs.filter(t => ws.tabIds.includes(t.id))

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>Workspaces</div>
        <button className={styles.addBtn} onClick={() => setShowNew(!showNew)}>+ New</button>
      </div>

      <p className={styles.desc}>
        Workspaces group your tabs by project or context. Switch between them instantly.
      </p>

      {showNew && (
        <div className={styles.newForm}>
          <input
            className={styles.nameInput}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Workspace name..."
          />
          <div className={styles.iconRow}>
            {WORKSPACE_ICONS.map(icon => (
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
            {WORKSPACE_COLORS.map(color => (
              <button
                key={color}
                className={`${styles.colorBtn} ${newColor === color ? styles.colorActive : ''}`}
                style={{ background: color }}
                onClick={() => setNewColor(color)}
              />
            ))}
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setShowNew(false)}>Cancel</button>
            <button className={styles.saveBtn} onClick={createWorkspace}>Create</button>
          </div>
        </div>
      )}

      <div className={styles.workspaceList}>
        {state.workspaces.map(ws => (
          <div
            key={ws.id}
            className={`${styles.wsCard} ${state.activeWorkspaceId === ws.id ? styles.wsActive : ''}`}
            style={{ '--ws-color': ws.color } as React.CSSProperties}
          >
            <div className={styles.wsLeft}>
              <div className={styles.wsIcon} style={{ background: ws.color + '22', border: `1.5px solid ${ws.color}` }}>
                {ws.icon}
              </div>
              <div>
                <div className={styles.wsName}>{ws.name}</div>
                <div className={styles.wsTabCount}>{activeTabs(ws).length} tabs</div>
              </div>
            </div>
            <div className={styles.wsRight}>
              {state.activeWorkspaceId === ws.id && (
                <span className={styles.activeBadge}>Active</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
