import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Paper, SourceId } from '../data/types'
import { DEFAULT_ENABLED, SOURCES, SOURCE_BY_ID } from '../data/sources'
import { mergeAndClassify, refineSeed } from '../data/pipeline'
import { SEED_PAPERS } from '../data/seed'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
export type SourceStatus = 'ok' | 'empty' | 'error' | 'disabled' | 'idle'

/** Refresh cadence: consider data stale after one week. */
export const STALE_MS = 7 * 24 * 60 * 60 * 1000

interface PaperState {
  papers: Paper[]
  /** Papers fetched live and cached (persisted); merged with the seed. */
  cached: Paper[]
  lastFetched: number | null
  status: LoadStatus
  error: string | null
  enabledSources: SourceId[]
  sourceStatus: Record<SourceId, SourceStatus>

  /** Live "search all sources" state (not persisted). */
  searchQuery: string
  searchStatus: LoadStatus
  searchResults: Paper[]

  init: () => Promise<void>
  refresh: (force?: boolean) => Promise<void>
  setSourceEnabled: (id: SourceId, on: boolean) => void
  /** Query enabled sources for a specific topic ANDed with the field terms. */
  searchSources: (query: string) => Promise<void>
  clearSearch: () => void
}

const seed = refineSeed(SEED_PAPERS)

const initialSourceStatus = (): Record<SourceId, SourceStatus> =>
  Object.fromEntries(SOURCES.map((s) => [s.id, 'idle'])) as Record<SourceId, SourceStatus>

function merge(cached: Paper[]): Paper[] {
  // Seed is always included; live/cached records dedupe against it.
  return mergeAndClassify([...cached, ...seed])
}

export const usePapers = create<PaperState>()(
  persist(
    (set, get) => ({
      papers: seed,
      cached: [],
      lastFetched: null,
      status: 'idle',
      error: null,
      enabledSources: DEFAULT_ENABLED,
      sourceStatus: initialSourceStatus(),
      searchQuery: '',
      searchStatus: 'idle',
      searchResults: [],

      init: async () => {
        set({ papers: merge(get().cached), status: 'ready' })
        const stale = !get().lastFetched || Date.now() - (get().lastFetched ?? 0) > STALE_MS
        if (stale && typeof navigator !== 'undefined' && navigator.onLine) {
          await get().refresh(false)
        }
      },

      refresh: async (force = true) => {
        if (get().status === 'loading') return
        if (!force && get().lastFetched && Date.now() - get().lastFetched! < STALE_MS) return

        const enabled = get().enabledSources
        set({ status: 'loading', error: null })

        const active = SOURCES.filter((s) => enabled.includes(s.id))
        const results = await Promise.allSettled(
          active.map((s) =>
            s
              .fetch({ maxResults: s.kind === 'preprint' ? 120 : 250 })
              .then((papers) => ({ id: s.id, papers })),
          ),
        )

        const status = { ...initialSourceStatus() }
        for (const s of SOURCES) if (!enabled.includes(s.id)) status[s.id] = 'disabled'

        const fresh: Paper[] = []
        let anyOk = false
        results.forEach((r, i) => {
          const id = active[i].id
          if (r.status === 'fulfilled') {
            status[id] = r.value.papers.length ? 'ok' : 'empty'
            if (r.value.papers.length) anyOk = true
            fresh.push(...r.value.papers)
          } else {
            status[id] = 'error' // network / CORS / API failure
          }
        })

        // Keep the previous cache if nothing came back (offline / all blocked).
        const cached = fresh.length ? fresh : get().cached
        set({
          cached,
          sourceStatus: status,
          lastFetched: anyOk ? Date.now() : get().lastFetched,
          papers: merge(cached),
          status: anyOk ? 'ready' : 'error',
          error: anyOk ? null : 'Could not reach any enabled source; showing saved data.',
        })
      },

      setSourceEnabled: (id, on) => {
        const next = on
          ? [...new Set([...get().enabledSources, id])]
          : get().enabledSources.filter((s) => s !== id)
        set({ enabledSources: next })
        // Fetch a newly-enabled source; toggling off just hides via the view.
        if (on && SOURCE_BY_ID[id]) void get().refresh(true)
      },

      searchSources: async (query) => {
        const q = query.trim()
        if (!q) {
          get().clearSearch()
          return
        }
        set({ searchQuery: q, searchStatus: 'loading' })
        const active = SOURCES.filter((s) => get().enabledSources.includes(s.id))
        const results = await Promise.allSettled(
          active.map((s) => s.fetch({ maxResults: 100, extraQuery: q })),
        )
        // Ignore this response if the user changed the query meanwhile.
        if (get().searchQuery !== q) return
        const fresh = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        const anyFulfilled = results.some((r) => r.status === 'fulfilled')
        set({
          searchResults: mergeAndClassify(fresh),
          searchStatus: anyFulfilled ? 'ready' : 'error',
        })
      },

      clearSearch: () => set({ searchQuery: '', searchStatus: 'idle', searchResults: [] }),
    }),
    {
      name: 'crt-papers',
      version: 2,
      partialize: (s) => ({
        cached: s.cached,
        lastFetched: s.lastFetched,
        enabledSources: s.enabledSources,
      }),
      migrate: (persisted) => {
        // v1 had no source fields; drop the old cache so records re-fetch clean.
        const p = (persisted ?? {}) as Partial<PaperState>
        return { ...p, cached: [], lastFetched: null } as PaperState
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.papers = merge(state.cached)
      },
    },
  ),
)
