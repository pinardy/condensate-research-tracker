import type { Paper } from '../data/types'
import { useBookmarks } from '../store/bookmarks'

export function BookmarkButton({ paper }: { paper: Paper }) {
  const bookmarked = useBookmarks((s) => Boolean(s.bookmarks[paper.id]))
  const toggle = useBookmarks((s) => s.toggleBookmark)
  return (
    <button
      type="button"
      className={`bookmark-btn ${bookmarked ? 'is-on' : ''}`}
      aria-pressed={bookmarked}
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this paper'}
      onClick={() => toggle(paper)}
    >
      <span aria-hidden="true">{bookmarked ? '★' : '☆'}</span>
      <span className="bookmark-btn__label">{bookmarked ? 'Saved' : 'Save'}</span>
    </button>
  )
}
