import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Paper, SourceId } from '../data/types'
import { DEFAULT_ENABLED, SOURCES, SOURCE_BY_ID } from '../data/sources'
import { mergeAndClassify, refineSeed } from '../data/pipeline'
import { SEED_PAPERS } from '../data/seed'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'
export type SourceStatus = 'ok' | 'empty' | 'error' | 'disabled' | 'idle'

/** Per-source coverage counts surfaced in the UI. */
export interface SourceCount {
  /** Total matches the source reports (before our IF/allowlist filtering). */
  total?: number
  /** How many we kept after the allowlist. */
  kept: number
}

/** Refresh cadence: consider data stale after one week. */
export const STALE_MS = 7 * 24 * 60 * 60 * 1000

/** How many peer-reviewed records to request per source; grows via "Load more". */
export const PAGE_SIZE = 250

interface PaperState {
  papers: Paper[]
  /** Papers fetched live and cached (persisted); merged with the seed. */
  cached: Paper[]
  lastFetched: number | null
  status: LoadStatus
  error: string | null
  enabledSources: SourceId[]
  sourceStatus: Record<SourceId, SourceStatus>
  sourceCounts: Record<SourceId, SourceCount>
  /** Current per-source fetch ceiling (raised by loadMore). */
  fetchLimit: number
  /** Minimum journal Impact Factor to show; 0 = include all indexed journals. */
  minIf: number

  /** Live "search all sources" state (not persisted). */
  searchQuery: string
  searchStatus: LoadStatus
  searchResults: Paper[]

  init: () => Promise<void>
  refresh: (force?: boolean) => Promise<void>
  loadMore: () => Promise<void>
  setMinIf: (n: number) => void
  setSourceEnabled: (id: SourceId, on: boolean) => void
  /** Query enabled sources for a specific topic ANDed with the field terms. */
  searchSources: (query: string) => Promise<void>
  clearSearch: () => void
}

const seed = refineSeed(SEED_PAPERS)

const initialSourceStatus = (): Record<SourceId, SourceStatus> =>
  Object.fromEntries(SOURCES.map((s) => [s.id, 'idle'])) as Record<SourceId, SourceStatus>

const initialSourceCounts = (): Record<SourceId, SourceCount> =>
  Object.fromEntries(SOURCES.map((s) => [s.id, { kept: 0 }])) as Record<SourceId, SourceCount>

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
      sourceCounts: initialSourceCounts(),
      fetchLimit: PAGE_SIZE,
      minIf: 4,
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
        const limit = get().fetchLimit
        set({ status: 'loading', error: null })

        const active = SOURCES.filter((s) => enabled.includes(s.id))
        const results = await Promise.allSettled(
          active.map((s) =>
            s
              .fetch({ maxResults: s.kind === 'preprint' ? Math.round(limit / 2) : limit })
              .then((res) => ({ id: s.id, res })),
          ),
        )

        const status = { ...initialSourceStatus() }
        const counts = initialSourceCounts()
        for (const s of SOURCES) if (!enabled.includes(s.id)) status[s.id] = 'disabled'

        const fresh: Paper[] = []
        let anyOk = false
        results.forEach((r, i) => {
          const id = active[i].id
          if (r.status === 'fulfilled') {
            const papers = r.value.res.papers
            status[id] = papers.length ? 'ok' : 'empty'
            // kept = records on the IF>=4 allowlist (preprints count as kept too).
            const kept = papers.filter((p) => p.isPreprint || p.impactFactor != null).length
            counts[id] = { total: r.value.res.total, kept }
            if (papers.length) anyOk = true
            fresh.push(...papers)
          } else {
            status[id] = 'error' // network / CORS / API failure
          }
        })

        // Keep the previous cache if nothing came back (offline / all blocked).
        const cached = fresh.length ? fresh : get().cached
        set({
          cached,
          sourceStatus: status,
          sourceCounts: counts,
          lastFetched: anyOk ? Date.now() : get().lastFetched,
          papers: merge(cached),
          status: anyOk ? 'ready' : 'error',
          error: anyOk ? null : 'Could not reach any enabled source; showing saved data.',
        })
      },

      loadMore: async () => {
        set({ fetchLimit: get().fetchLimit + PAGE_SIZE })
        await get().refresh(true)
      },

      setMinIf: (n) => set({ minIf: n }),

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
        const fresh = results.flatMap((r) => (r.status === 'fulfilled' ? r.value.papers : []))
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
      version: 4,
      partialize: (s) => ({
        cached: s.cached,
        lastFetched: s.lastFetched,
        enabledSources: s.enabledSources,
        minIf: s.minIf,
      }),
      migrate: (persisted) => {
        // Older caches only stored allowlisted papers; reset so the keep-all
        // fetch repopulates, and re-enable all sources (e.g. OpenAlex).
        const p = (persisted ?? {}) as Partial<PaperState>
        return {
          ...p,
          cached: [],
          lastFetched: null,
          enabledSources: DEFAULT_ENABLED,
        } as PaperState
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.papers = merge(state.cached)
      },
    },
  ),
)
