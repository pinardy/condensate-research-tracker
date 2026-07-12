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

  const [area, setArea] = useState<AreaFilter>('all')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('year-desc')

  useEffect(() => {
    void init()
  }, [init])

  // Only show papers surfaced by at least one enabled source.
  const visible = useMemo(
    () => papers.filter((p) => p.providers.some((id) => enabledSources.includes(id))),
    [papers, enabledSources],
  )

  const counts = useMemo(() => {
    const c: Record<AreaFilter, number> = {
      all: 0,
      plant: 0,
      animal: 0,
      biophysics: 0,
      preprints: 0,
    }
    for (const p of visible) {
      if (p.isPreprint) {
        c.preprints++
      } else {
        c.all++
        for (const a of p.areas) c[a]++
      }
    }
    return c
  }, [visible])

  const years = useMemo(
    () => [...new Set(visible.map((p) => p.year))].sort((a, b) => b - a),
    [visible],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return visible.filter((p) => {
      if (area === 'preprints') {
        if (!p.isPreprint) return false
      } else {
        if (p.isPreprint) return false
        if (area !== 'all' && !p.areas.includes(area as ResearchArea)) return false
      }
      if (year !== 'all' && p.year !== year) return false
      if (q) {
        const hay = `${p.title} ${p.authors} ${p.journal} ${p.abstract ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [visible, area, year, search])

  return (
    <div className="browse">
      <RefreshStatus />
      <SourcesBar />
      <AreaTabs value={area} counts={counts} onChange={setArea} />
      {area === 'preprints' && (
        <p className="preprints-note">
          Preprints (bioRxiv / medRxiv, via Europe PMC) have not been peer-reviewed and bypass the
          IF ≥ 4 journal filter. Treat findings as preliminary.
        </p>
      )}
      <FilterBar
        search={search}
        onSearch={setSearch}
        years={years}
        year={year}
        onYear={setYear}
        sort={sort}
        onSort={setSort}
      />
      <PaperList papers={filtered} sort={sort} />
    </div>
  )
}
