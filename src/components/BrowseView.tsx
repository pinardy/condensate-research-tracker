import { useEffect, useMemo, useRef, useState } from 'react'
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

const AREAS: AreaFilter[] = ['all', 'plant', 'animal', 'biophysics', 'preprints']

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
  const savedSearches = usePapers((s) => s.savedSearches)
  const saveSearch = usePapers((s) => s.saveSearch)
  const removeSavedSearch = usePapers((s) => s.removeSavedSearch)
  const newIds = usePapers((s) => s.newIds)

  const [area, setArea] = useState<AreaFilter>('all')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('year-desc')
  const [newOnly, setNewOnly] = useState(false)
  const [copied, setCopied] = useState(false)

  // --- Deep-link: read URL params once on mount, restore state. ---
  const didInit = useRef(false)
  useEffect(() => {
    void init()
    if (didInit.current) return
    didInit.current = true
    const p = new URLSearchParams(window.location.search)
    const a = p.get('area')
    if (a && AREAS.includes(a as AreaFilter)) setArea(a as AreaFilter)
    const y = p.get('year')
    if (y && /^\d{4}$/.test(y)) setYear(Number(y))
    const s = p.get('sort')
    if (s === 'year-asc' || s === 'year-desc') setSort(s)
    const f = p.get('if')
    if (f != null && IF_OPTIONS.some((o) => String(o.value) === f)) setMinIf(Number(f))
    const q = p.get('q')
    if (q) {
      setSearch(q)
      void searchSources(q)
    }
  }, [init, searchSources, setMinIf])

  // --- Deep-link: keep the URL in sync with the current view. ---
  useEffect(() => {
    const p = new URLSearchParams()
    if (area !== 'all') p.set('area', area)
    if (year !== 'all') p.set('year', String(year))
    if (sort !== 'year-desc') p.set('sort', sort)
    if (minIf !== 4) p.set('if', String(minIf))
    if (searchQuery) p.set('q', searchQuery)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `?${qs}${window.location.hash}` : window.location.pathname)
  }, [area, year, sort, minIf, searchQuery])

  const searchMode = searchQuery.length > 0
  const newSet = useMemo(() => new Set(newIds), [newIds])

  const base = useMemo(() => {
    const src = searchMode ? searchResults : papers
    return src.filter((p) => p.providers.some((id) => enabledSources.includes(id)))
  }, [searchMode, searchResults, papers, enabledSources])

  const passesQuality = (p: Paper) =>
    p.isPreprint || minIf === 0 || (p.impactFactor != null && p.impactFactor >= minIf)

  const quality = useMemo(() => base.filter(passesQuality), [base, minIf])

  const hiddenByIf = useMemo(
    () => base.filter((p) => !p.isPreprint && !passesQuality(p)).length,
    [base, minIf],
  )

  const newCount = useMemo(() => quality.filter((p) => newSet.has(p.id)).length, [quality, newSet])

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
      if (newOnly && !newSet.has(p.id)) return false
      if (year !== 'all' && p.year !== year) return false
      if (!searchMode && q) {
        const hay = `${p.title} ${p.authors} ${p.journal} ${p.abstract ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [quality, area, year, search, searchMode, newOnly, newSet])

  function copyLink() {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  const isSaved = searchQuery && savedSearches.includes(searchQuery)

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
        <button type="button" className="btn btn--small quality-bar__share" onClick={copyLink}>
          {copied ? '✓ Copied' : '🔗 Copy link'}
        </button>
      </div>

      {savedSearches.length > 0 && (
        <div className="saved-searches">
          <span className="saved-searches__label">Saved</span>
          {savedSearches.map((q) => (
            <span key={q} className={`saved-chip ${searchQuery === q ? 'is-active' : ''}`}>
              <button
                type="button"
                className="saved-chip__run"
                onClick={() => {
                  setSearch(q)
                  void searchSources(q)
                }}
              >
                {q}
              </button>
              <button
                type="button"
                className="saved-chip__x"
                aria-label={`Remove saved search ${q}`}
                onClick={() => removeSavedSearch(q)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {newCount > 0 && (
        <label className="new-toggle">
          <input type="checkbox" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
          Show only new since last visit ({newCount})
        </label>
      )}

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
          <span className="search-banner__actions">
            <button
              type="button"
              className="btn btn--small"
              disabled={!!isSaved}
              onClick={() => saveSearch(searchQuery)}
            >
              {isSaved ? '★ Saved' : '☆ Save search'}
            </button>
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
          </span>
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
