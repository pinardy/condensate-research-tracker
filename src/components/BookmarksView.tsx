import { useMemo, useState } from 'react'
import { AREA_LABELS } from '../data/types'
import type { Bookmark } from '../data/types'
import { useBookmarks } from '../store/bookmarks'
import { FolderSidebar, type FolderFilter } from './FolderSidebar'

function BookmarkRow({ bm }: { bm: Bookmark }) {
  const folders = useBookmarks((s) => s.folders)
  const moveToFolder = useBookmarks((s) => s.moveToFolder)
  const removeBookmark = useBookmarks((s) => s.removeBookmark)
  const doiUrl = bm.doi ? `https://doi.org/${bm.doi}` : undefined

  return (
    <article className="bm-row">
      <div className="bm-row__main">
        <div className="paper-card__areas">
          {bm.areas.map((a) => (
            <span key={a} className={`badge badge--${a}`}>
              {AREA_LABELS[a]}
            </span>
          ))}
        </div>
        <h3 className="bm-row__title">
          {doiUrl ? (
            <a href={doiUrl} target="_blank" rel="noreferrer">
              {bm.title}
            </a>
          ) : (
            bm.title
          )}
        </h3>
        <p className="bm-row__meta">
          <span>{bm.journal}</span>
          <span className="chip">{bm.year}</span>
          {doiUrl && (
            <a className="chip chip--doi" href={doiUrl} target="_blank" rel="noreferrer">
              DOI ↗
            </a>
          )}
        </p>
      </div>
      <div className="bm-row__controls">
        <label className="bm-row__folder">
          <span>Folder</span>
          <select
            value={bm.folderId ?? ''}
            onChange={(e) => moveToFolder(bm.paperId, e.target.value || null)}
          >
            <option value="">Unfiled</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn--danger btn--small" onClick={() => removeBookmark(bm.paperId)}>
          Remove
        </button>
      </div>
    </article>
  )
}

export function BookmarksView() {
  const bookmarks = useBookmarks((s) => s.bookmarks)
  const [filter, setFilter] = useState<FolderFilter>('all')

  const list = useMemo(() => {
    const all = Object.values(bookmarks).sort((a, b) => b.createdAt - a.createdAt)
    if (filter === 'all') return all
    if (filter === 'unfiled') return all.filter((b) => !b.folderId)
    return all.filter((b) => b.folderId === filter)
  }, [bookmarks, filter])

  return (
    <div className="bookmarks">
      <FolderSidebar selected={filter} onSelect={setFilter} />
      <div className="bookmarks__list">
        {list.length === 0 ? (
          <p className="empty">
            {Object.keys(bookmarks).length === 0
              ? 'No bookmarks yet. Save papers from the Browse tab to organize them here.'
              : 'This folder is empty.'}
          </p>
        ) : (
          list.map((bm) => <BookmarkRow key={bm.paperId} bm={bm} />)
        )}
      </div>
    </div>
  )
}
