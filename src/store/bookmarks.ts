import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bookmark, Folder, Paper } from '../data/types'

interface BookmarkState {
  folders: Folder[]
  /** Keyed by paper id. */
  bookmarks: Record<string, Bookmark>

  isBookmarked: (paperId: string) => boolean
  toggleBookmark: (paper: Paper) => void
  removeBookmark: (paperId: string) => void
  createFolder: (name: string) => Folder
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  moveToFolder: (paperId: string, folderId: string | null) => void
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

export const useBookmarks = create<BookmarkState>()(
  persist(
    (set, get) => ({
      folders: [],
      bookmarks: {},

      isBookmarked: (paperId) => Boolean(get().bookmarks[paperId]),

      toggleBookmark: (paper) =>
        set((state) => {
          const next = { ...state.bookmarks }
          if (next[paper.id]) {
            delete next[paper.id]
          } else {
            next[paper.id] = {
              paperId: paper.id,
              doi: paper.doi,
              title: paper.title,
              journal: paper.journal,
              year: paper.year,
              areas: paper.areas,
              folderId: null,
              createdAt: Date.now(),
            }
          }
          return { bookmarks: next }
        }),

      removeBookmark: (paperId) =>
        set((state) => {
          const next = { ...state.bookmarks }
          delete next[paperId]
          return { bookmarks: next }
        }),

      createFolder: (name) => {
        const folder: Folder = { id: makeId(), name: name.trim() || 'New folder', createdAt: Date.now() }
        set((state) => ({ folders: [...state.folders, folder] }))
        return folder
      },

      renameFolder: (id, name) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name } : f)),
        })),

      deleteFolder: (id) =>
        set((state) => {
          // Move any bookmarks in this folder back to "unfiled".
          const bookmarks = Object.fromEntries(
            Object.entries(state.bookmarks).map(([k, b]) =>
              b.folderId === id ? [k, { ...b, folderId: null }] : [k, b],
            ),
          )
          return { folders: state.folders.filter((f) => f.id !== id), bookmarks }
        }),

      moveToFolder: (paperId, folderId) =>
        set((state) => {
          const bm = state.bookmarks[paperId]
          if (!bm) return {}
          return { bookmarks: { ...state.bookmarks, [paperId]: { ...bm, folderId } } }
        }),
    }),
    {
      name: 'crt-bookmarks',
      version: 1,
    },
  ),
)
