import { useBrowser } from '../store/browserStore'
import { TitleBar } from './TitleBar'
import { TabBar } from './TabBar'
import { Toolbar } from './Toolbar'
import { BookmarkBar } from './BookmarkBar'
import { BrowserContent } from './BrowserContent'
import { AISidebar } from './AISidebar'
import { StatusBar } from './StatusBar'
import styles from './BrowserShell.module.css'

export function BrowserShell() {
  const { state } = useBrowser()
  const { settings, sidebarOpen } = state

  const modeClass = `mode-${settings.mode}`

  return (
    <div className={`${styles.shell} ${styles[modeClass]}`}>
      <TitleBar />
      <TabBar />
      <Toolbar />
      {settings.showBookmarkBar && <BookmarkBar />}
      <div className={styles.contentArea}>
        <BrowserContent />
        {sidebarOpen && <AISidebar />}
      </div>
      <StatusBar />
    </div>
  )
}
