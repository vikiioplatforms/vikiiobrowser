import { useBrowser } from '../store/browserStore'
import type { Tab } from '../types'
import styles from './BookmarkBar.module.css'

export function BookmarkBar() {
  const { state, dispatch } = useBrowser()
  const { bookmarks } = state

  const navigate = (url: string, title: string) => {
    dispatch({ type: 'UPDATE_TAB', id: state.activeTabId!, updates: { url, title, isLoading: true } })
  }

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
    } catch { return null }
  }

  return (
    <div className={styles.bookmarkBar}>
      {bookmarks.slice(0, 12).map(bm => (
        <button
          key={bm.id}
          className={styles.bookmark}
          onClick={() => navigate(bm.url, bm.title)}
          title={bm.url}
        >
          {getFavicon(bm.url) && (
            <img
              src={getFavicon(bm.url)!}
              alt=""
              className={styles.favicon}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
          <span className={styles.label}>{bm.title}</span>
        </button>
      ))}
      {bookmarks.length === 0 && (
        <span className={styles.empty}>No bookmarks yet — click the bookmark icon to save a page</span>
      )}
    </div>
  )
}
