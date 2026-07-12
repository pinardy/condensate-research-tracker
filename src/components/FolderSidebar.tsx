import { useMemo, useState } from 'react'
import { useBookmarks } from '../store/bookmarks'

export type FolderFilter = 'all' | 'unfiled' | string

export function FolderSidebar({
  selected,
  onSelect,
}: {
  selected: FolderFilter
  onSelect: (f: FolderFilter) => void
}) {
  const folders = useBookmarks((s) => s.folders)
  const bookmarks = useBookmarks((s) => s.bookmarks)
  const createFolder = useBookmarks((s) => s.createFolder)
  const renameFolder = useBookmarks((s) => s.renameFolder)
  const deleteFolder = useBookmarks((s) => s.deleteFolder)

  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const counts = useMemo(() => {
    const list = Object.values(bookmarks)
    const map: Record<string, number> = { all: list.length, unfiled: 0 }
    for (const f of folders) map[f.id] = 0
    for (const b of list) {
      if (b.folderId && map[b.folderId] != null) map[b.folderId]++
      else map.unfiled++
    }
    return map
  }, [bookmarks, folders])

  function addFolder() {
    const name = newName.trim()
    if (!name) return
    createFolder(name)
    setNewName('')
    // Stay on the current view so papers remain visible to move into the folder.
  }

  return (
    <aside className="folders">
      <button
        className={`folders__item ${selected === 'all' ? 'is-active' : ''}`}
        onClick={() => onSelect('all')}
      >
        <span>All bookmarks</span>
        <span className="folders__count">{counts.all}</span>
      </button>
      <button
        className={`folders__item ${selected === 'unfiled' ? 'is-active' : ''}`}
        onClick={() => onSelect('unfiled')}
      >
        <span>Unfiled</span>
        <span className="folders__count">{counts.unfiled}</span>
      </button>

      <div className="folders__divider">Folders</div>

      {folders.length === 0 && <p className="folders__empty">No folders yet.</p>}

      {folders.map((f) => (
        <div key={f.id} className={`folders__row ${selected === f.id ? 'is-active' : ''}`}>
          {editing === f.id ? (
            <form
              className="folders__edit"
              onSubmit={(e) => {
                e.preventDefault()
                renameFolder(f.id, editName)
                setEditing(null)
              }}
            >
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => {
                  renameFolder(f.id, editName)
                  setEditing(null)
                }}
                aria-label="Folder name"
              />
            </form>
          ) : (
            <>
              <button className="folders__item folders__item--flex" onClick={() => onSelect(f.id)}>
                <span>📁 {f.name}</span>
                <span className="folders__count">{counts[f.id] ?? 0}</span>
              </button>
              <div className="folders__actions">
                <button
                  className="icon-btn"
                  title="Rename folder"
                  onClick={() => {
                    setEditing(f.id)
                    setEditName(f.name)
                  }}
                >
                  ✎
                </button>
                <button
                  className="icon-btn"
                  title="Delete folder"
                  onClick={() => {
                    if (confirm(`Delete folder "${f.name}"? Its bookmarks move to Unfiled.`)) {
                      if (selected === f.id) onSelect('all')
                      deleteFolder(f.id)
                    }
                  }}
                >
                  🗑
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <form
        className="folders__new"
        onSubmit={(e) => {
          e.preventDefault()
          addFolder()
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New folder name"
          aria-label="New folder name"
        />
        <button type="submit" className="btn btn--small">
          Add
        </button>
      </form>
    </aside>
  )
}
