import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Paper, SourceId } from '../data/types'
import { DEFAULT_ENABLED, SOURCES, SOURCE_BY_ID } from '../data/sources'
import { mergeAndClassify, refineSeed } from '../data/pipeline'
import { dedupe } from '../data/classify'
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

/** How many peer-reviewed records to request per source, per fetch batch.
 *  "Load more" fetches another batch of this size from where each source left
 *  off, rather than re-fetching everything from the start. */
export const PAGE_SIZE = 250

/** Upper bound on persisted live records, so localStorage can't grow without
 *  bound as "Load more" accumulates pages. When exceeded, the most recent
 *  papers (by year) are kept. The seed is separate and always merged in. */
export const MAX_CACHED = 2500

/** Dedupe the accumulating live cache and cap it to the most recent records. */
function capCached(papers: Paper[]): Paper[] {
  const deduped = dedupe(papers)
  if (deduped.length <= MAX_CACHED) return deduped
  return [...deduped].sort((a, b) => b.year - a.year).slice(0, MAX_CACHED)
}

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
  /**
   * Per-source resume token for the next "Load more" page. Value semantics:
   * absent = never fetched (start from the beginning); string = more pages
   * available, resume here; null = fully exhausted, skip. Persisted alongside
   * `cached` so paging continues across reloads instead of re-fetching page 1.
   */
  sourceCursors: Partial<Record<SourceId, string | null>>
  /** Minimum journal Impact Factor to show; 0 = include all indexed journals. */
  minIf: number

  /** Live "search all sources" state (not persisted). */
  searchQuery: string
  searchStatus: LoadStatus
  searchResults: Paper[]

  /** Saved topic searches (persisted). */
  savedSearches: string[]
  /** All paper ids ever seen across visits (persisted). */
  seenIds: string[]
  /** Ids new since the previous visit (this session only). */
  newIds: string[]

  init: () => Promise<void>
  refresh: (force?: boolean) => Promise<void>
  loadMore: () => Promise<void>
  setMinIf: (n: number) => void
  setSourceEnabled: (id: SourceId, on: boolean) => void
  /** Query enabled sources for a specific topic ANDed with the field terms. */
  searchSources: (query: string) => Promise<void>
  clearSearch: () => void
  saveSearch: (query: string) => void
  removeSavedSearch: (query: string) => void
}

// Snapshot of previously-seen ids, captured once per session (not persisted).
let sessionSeen: Set<string> | null = null

const seed = refineSeed(SEED_PAPERS)

const initialSourceStatus = (): Record<SourceId, SourceStatus> =>
  Object.fromEntries(SOURCES.map((s) => [s.id, 'idle'])) as Record<SourceId, SourceStatus>

const initialSourceCounts = (): Record<SourceId, SourceCount> =>
  Object.fromEntries(SOURCES.map((s) => [s.id, { kept: 0 }])) as Record<SourceId, SourceCount>

function merge(cached: Paper[]): Paper[] {
  // Seed is always included; live/cached records dedupe against it.
  return mergeAndClassify([...cached, ...seed])
}

/**
 * Given the current papers and the persisted seen-ids, compute which are new
 * since the previous visit and return the updated seen list. On the very first
 * visit (no seen ids yet) nothing is flagged as new.
 */
function computeNew(papers: Paper[], seenIds: string[]): { newIds: string[]; seenIds: string[] } {
  if (sessionSeen === null) sessionSeen = new Set(seenIds)
  const ids = papers.map((p) => p.id)
  const firstVisit = sessionSeen.size === 0
  const newIds = firstVisit ? [] : ids.filter((id) => !sessionSeen!.has(id))
  // Cap the persisted set so it can't grow without bound.
  const merged = [...new Set([...seenIds, ...ids])].slice(-8000)
  return { newIds, seenIds: merged }
}

/**
 * Fetch a batch from the given sources and fold the results into state.
 * - `append: false` (refresh) — start each source from the beginning and
 *   replace the cache.
 * - `append: true` (loadMore / newly-enabled source) — resume each source from
 *   its stored cursor and merge the new records into the existing cache.
 */
async function runFetch(
  get: () => PaperState,
  set: (partial: Partial<PaperState>) => void,
  ids: SourceId[],
  append: boolean,
): Promise<void> {
  if (get().status === 'loading') return
  set({ status: 'loading', error: null })

  const cursors = get().sourceCursors
  const active = SOURCES.filter((s) => ids.includes(s.id))
  const results = await Promise.allSettled(
    active.map((s) =>
      s.fetch({
        maxResults: s.kind === 'preprint' ? Math.round(PAGE_SIZE / 2) : PAGE_SIZE,
        cursor: append ? cursors[s.id] ?? undefined : undefined,
      }),
    ),
  )

  // In append mode preserve the status/counts of sources we didn't touch;
  // in replace mode reset and mark not-requested sources disabled.
  const enabled = get().enabledSources
  const status = append ? { ...get().sourceStatus } : { ...initialSourceStatus() }
  const counts = append ? { ...get().sourceCounts } : initialSourceCounts()
  if (!append) for (const s of SOURCES) if (!enabled.includes(s.id)) status[s.id] = 'disabled'
  const nextCursors = { ...get().sourceCursors }

  const fresh: Paper[] = []
  let anyOk = false
  results.forEach((r, i) => {
    const id = active[i].id
    if (r.status === 'fulfilled') {
      const { papers, total, nextCursor } = r.value
      status[id] = papers.length ? 'ok' : 'empty'
      // kept = records on the IF>=4 allowlist (preprints count as kept too).
      const kept = papers.filter((p) => p.isPreprint || p.impactFactor != null).length
      counts[id] = {
        total: total ?? counts[id]?.total,
        kept: (append ? counts[id]?.kept ?? 0 : 0) + kept,
      }
      // undefined nextCursor => source exhausted (store null so loadMore skips it).
      nextCursors[id] = nextCursor ?? null
      if (papers.length) anyOk = true
      fresh.push(...papers)
    } else {
      status[id] = 'error' // network / CORS / API failure; leave cursor as-is to retry
    }
  })

  // Keep the previous cache if nothing came back (offline / all blocked).
  const base = append ? get().cached : []
  const cached = fresh.length ? capCached([...base, ...fresh]) : get().cached
  const papers = merge(cached)
  set({
    cached,
    sourceStatus: status,
    sourceCounts: counts,
    sourceCursors: nextCursors,
    lastFetched: anyOk ? Date.now() : get().lastFetched,
    papers,
    status: anyOk ? 'ready' : 'error',
    error: anyOk ? null : 'Could not reach any enabled source; showing saved data.',
    ...computeNew(papers, get().seenIds),
  })
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
      sourceCursors: {},
      minIf: 4,
      searchQuery: '',
      searchStatus: 'idle',
      searchResults: [],
      savedSearches: [],
      seenIds: [],
      newIds: [],

      init: async () => {
        const papers = merge(get().cached)
        set({ papers, status: 'ready', ...computeNew(papers, get().seenIds) })
        const stale = !get().lastFetched || Date.now() - (get().lastFetched ?? 0) > STALE_MS
        if (stale && typeof navigator !== 'undefined' && navigator.onLine) {
          await get().refresh(false)
        }
      },

      refresh: async (force = true) => {
        if (get().status === 'loading') return
        if (!force && get().lastFetched && Date.now() - get().lastFetched! < STALE_MS) return
        await runFetch(get, set, get().enabledSources, false)
      },

      loadMore: async () => {
        // Only fetch sources that still have pages left (cursor not exhausted).
        const ids = get().enabledSources.filter((id) => get().sourceCursors[id] !== null)
        if (ids.length === 0) return
        await runFetch(get, set, ids, true)
      },

      setMinIf: (n) => set({ minIf: n }),

      setSourceEnabled: (id, on) => {
        const next = on
          ? [...new Set([...get().enabledSources, id])]
          : get().enabledSources.filter((s) => s !== id)
        set({ enabledSources: next })
        // Fetch only the newly-enabled source and merge it in; toggling off just
        // hides its papers via the view. Avoids re-fetching every other source.
        if (on && SOURCE_BY_ID[id]) void runFetch(get, set, [id], true)
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

      saveSearch: (query) => {
        const q = query.trim()
        if (!q) return
        set({ savedSearches: [...new Set([q, ...get().savedSearches])].slice(0, 30) })
      },

      removeSavedSearch: (query) =>
        set({ savedSearches: get().savedSearches.filter((s) => s !== query) }),
    }),
    {
      name: 'crt-papers',
      version: 4,
      partialize: (s) => ({
        cached: s.cached,
        // Kept in step with `cached` (both written together in runFetch) so a
        // reload resumes paging where it left off rather than re-fetching page 1.
        sourceCursors: s.sourceCursors,
        lastFetched: s.lastFetched,
        enabledSources: s.enabledSources,
        minIf: s.minIf,
        savedSearches: s.savedSearches,
        seenIds: s.seenIds,
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
      // No merge on rehydrate: init() (run on mount) merges cached + seed once,
      // so merging here would just run the full dedupe/sort pipeline twice.
    },
  ),
)
