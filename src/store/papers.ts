import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Paper } from '../data/types'
import { fetchPapers, refineSeed } from '../data/europepmc'
import { dedupe } from '../data/classify'
import { SEED_PAPERS } from '../data/seed'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

/** Refresh cadence: consider data stale after one week. */
export const STALE_MS = 7 * 24 * 60 * 60 * 1000

interface PaperState {
  papers: Paper[]
  /** Papers fetched live and cached (persisted); merged with the seed. */
  cached: Paper[]
  lastFetched: number | null
  status: LoadStatus
  error: string | null

  /** Load cached+seed immediately, then refresh in the background if stale. */
  init: () => Promise<void>
  /** Fetch from Europe PMC. `force` ignores the staleness window. */
  refresh: (force?: boolean) => Promise<void>
}

const seed = refineSeed(SEED_PAPERS)

function merge(cached: Paper[]): Paper[] {
  // Live/cached papers win over seed on id/DOI collision (fresher metadata).
  return dedupe([...cached, ...seed]).sort((a, b) => b.year - a.year)
}

export const usePapers = create<PaperState>()(
  persist(
    (set, get) => ({
      papers: seed,
      cached: [],
      lastFetched: null,
      status: 'idle',
      error: null,

      init: async () => {
        // Render whatever we have (seed + any persisted cache) right away.
        set({ papers: merge(get().cached), status: 'ready' })
        const stale = !get().lastFetched || Date.now() - (get().lastFetched ?? 0) > STALE_MS
        if (stale && typeof navigator !== 'undefined' && navigator.onLine) {
          await get().refresh(false)
        }
      },

      refresh: async (force = true) => {
        if (get().status === 'loading') return
        if (!force && get().lastFetched && Date.now() - get().lastFetched! < STALE_MS) return
        set({ status: 'loading', error: null })
        try {
          const fresh = await fetchPapers({ maxResults: 300 })
          const cached = fresh.length ? fresh : get().cached
          set({
            cached,
            lastFetched: Date.now(),
            papers: merge(cached),
            status: 'ready',
          })
        } catch (err) {
          // Offline / blocked / CORS: keep showing seed + last cache.
          set({
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to fetch latest research',
            papers: merge(get().cached),
          })
        }
      },
    }),
    {
      name: 'crt-papers',
      version: 1,
      // Persist only the fetched cache + timestamp; seed is bundled in code.
      partialize: (s) => ({ cached: s.cached, lastFetched: s.lastFetched }),
      onRehydrateStorage: () => (state) => {
        if (state) state.papers = merge(state.cached)
      },
    },
  ),
)
