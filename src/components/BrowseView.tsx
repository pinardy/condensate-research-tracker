import { useEffect, useMemo, useState } from 'react'
import type { ResearchArea } from '../data/types'
import { usePapers } from '../store/papers'
import { AreaTabs, type AreaFilter } from './AreaTabs'
import { FilterBar, type SortMode } from './FilterBar'
import { PaperList } from './PaperList'
import { RefreshStatus } from './RefreshStatus'
import { SourcesBar } from './SourcesBar'

export function BrowseView() {
  const papers = usePapers((s) => s.papers)
  const enabledSources = usePapers((s) => s.enabledSources)
  const init = usePapers((s) => s.init)
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

  // In search mode, work from live results; otherwise the browse corpus.
  // Both are still limited to papers surfaced by an enabled source.
  const base = useMemo(() => {
    const src = searchMode ? searchResults : papers
    return src.filter((p) => p.providers.some((id) => enabledSources.includes(id)))
  }, [searchMode, searchResults, papers, enabledSources])

  const counts = useMemo(() => {
    const c: Record<AreaFilter, number> = {
      all: 0,
      plant: 0,
      animal: 0,
      biophysics: 0,
      preprints: 0,
    }
    for (const p of base) {
      if (p.isPreprint) {
        c.preprints++
      } else {
        c.all++
        for (const a of p.areas) c[a]++
      }
    }
    return c
  }, [base])

  const years = useMemo(() => [...new Set(base.map((p) => p.year))].sort((a, b) => b - a), [base])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return base.filter((p) => {
      if (area === 'preprints') {
        if (!p.isPreprint) return false
      } else {
        if (p.isPreprint) return false
        if (area !== 'all' && !p.areas.includes(area as ResearchArea)) return false
      }
      if (year !== 'all' && p.year !== year) return false
      // Skip local text filtering in search mode (results are already topical).
      if (!searchMode && q) {
        const hay = `${p.title} ${p.authors} ${p.journal} ${p.abstract ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [base, area, year, search, searchMode])

  return (
    <div className="browse">
      <RefreshStatus />
      <SourcesBar />
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
                : `Live results for “${searchQuery}” — ${base.length} found across sources.`}
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
    </div>
  )
}
