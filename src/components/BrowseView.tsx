import { useEffect, useMemo, useState } from 'react'
import type { Paper, ResearchArea } from '../data/types'
import { usePapers } from '../store/papers'
import { AreaTabs, type AreaFilter } from './AreaTabs'
import { FilterBar, type SortMode } from './FilterBar'
import { PaperList } from './PaperList'
import { RefreshStatus } from './RefreshStatus'
import { SourcesBar } from './SourcesBar'

const IF_OPTIONS = [
  { value: 4, label: 'IF ≥ 4 (curated)' },
  { value: 10, label: 'IF ≥ 10' },
  { value: 20, label: 'IF ≥ 20' },
  { value: 0, label: 'All indexed journals' },
]

export function BrowseView() {
  const papers = usePapers((s) => s.papers)
  const enabledSources = usePapers((s) => s.enabledSources)
  const init = usePapers((s) => s.init)
  const loadMore = usePapers((s) => s.loadMore)
  const status = usePapers((s) => s.status)
  const minIf = usePapers((s) => s.minIf)
  const setMinIf = usePapers((s) => s.setMinIf)
  const searchSources = usePapers((s) => s.searchSources)
  const clearSearch = usePapers((s) => s.clearSearch)
  const searchQuery = usePapers((s) => s.searchQuery)
  const searchStatus = usePapers((s) => s.searchStatus)
  const searchResults = usePapers((s) => s.searchResults)

  const [area, setArea] = useState<AreaFilter>('all')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('year-desc')

  useEffect(() => {
    void init()
  }, [init])

  const searchMode = searchQuery.length > 0

  // Papers surfaced by an enabled source (before the journal-quality filter).
  const base = useMemo(() => {
    const src = searchMode ? searchResults : papers
    return src.filter((p) => p.providers.some((id) => enabledSources.includes(id)))
  }, [searchMode, searchResults, papers, enabledSources])

  // Journal-quality gate (preprints handled by their own tab, IF not applicable).
  const passesQuality = (p: Paper) =>
    p.isPreprint || minIf === 0 || (p.impactFactor != null && p.impactFactor >= minIf)

  const quality = useMemo(() => base.filter(passesQuality), [base, minIf])

  // How many peer papers are hidden purely by the current IF threshold.
  const hiddenByIf = useMemo(
    () => base.filter((p) => !p.isPreprint && !passesQuality(p)).length,
    [base, minIf],
  )

  const counts = useMemo(() => {
    const c: Record<AreaFilter, number> = { all: 0, plant: 0, animal: 0, biophysics: 0, preprints: 0 }
    for (const p of quality) {
      if (p.isPreprint) c.preprints++
      else {
        c.all++
        for (const a of p.areas) c[a]++
      }
    }
    return c
  }, [quality])

  const years = useMemo(() => [...new Set(quality.map((p) => p.year))].sort((a, b) => b - a), [quality])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return quality.filter((p) => {
      if (area === 'preprints') {
        if (!p.isPreprint) return false
      } else {
        if (p.isPreprint) return false
        if (area !== 'all' && !p.areas.includes(area as ResearchArea)) return false
      }
      if (year !== 'all' && p.year !== year) return false
      if (!searchMode && q) {
        const hay = `${p.title} ${p.authors} ${p.journal} ${p.abstract ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [quality, area, year, search, searchMode])

  return (
    <div className="browse">
      <RefreshStatus />
      <SourcesBar />

      <div className="quality-bar">
        <label className="quality-bar__field">
          <span>Journal quality</span>
          <select value={String(minIf)} onChange={(e) => setMinIf(Number(e.target.value))}>
            {IF_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {minIf > 0 && hiddenByIf > 0 && area !== 'preprints' && (
          <button type="button" className="linkish" onClick={() => setMinIf(0)}>
            + Show {hiddenByIf} more from journals outside the IF ≥ 4 list
          </button>
        )}
        {minIf === 0 && (
          <span className="quality-bar__note">
            Showing all indexed journals — includes venues below IF 4 and with unverified quality.
          </span>
        )}
      </div>

      <FilterBar
        search={search}
        onSearch={setSearch}
        years={years}
        year={year}
        onYear={setYear}
        sort={sort}
        onSort={setSort}
        onDeepSearch={() => void searchSources(search)}
        deepSearchLoading={searchStatus === 'loading'}
      />

      {searchMode && (
        <div className={`search-banner ${searchStatus === 'error' ? 'is-error' : ''}`}>
          <span>
            {searchStatus === 'loading'
              ? `Searching all sources for “${searchQuery}”…`
              : searchStatus === 'error'
                ? `Couldn’t reach sources for “${searchQuery}” (offline or blocked).`
                : `Live results for “${searchQuery}” — ${quality.length} found across sources.`}
          </span>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => {
              clearSearch()
              setSearch('')
            }}
          >
            Clear search
          </button>
        </div>
      )}

      <AreaTabs value={area} counts={counts} onChange={setArea} />
      {area === 'preprints' && (
        <p className="preprints-note">
          Preprints (bioRxiv / medRxiv, via Europe PMC) have not been peer-reviewed and bypass the
          IF ≥ 4 journal filter. Treat findings as preliminary.
        </p>
      )}
      <PaperList papers={filtered} sort={sort} />

      {!searchMode && status !== 'idle' && (
        <div className="load-more">
          <button
            type="button"
            className="btn"
            disabled={status === 'loading'}
            onClick={() => void loadMore()}
          >
            {status === 'loading' ? 'Loading…' : 'Load more from sources'}
          </button>
          <span className="load-more__hint">
            Widens the per-source fetch limit. Enable more sources above for broader coverage.
          </span>
        </div>
      )}
    </div>
  )
}
