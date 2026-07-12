import { useEffect, useMemo, useState } from 'react'
import type { ResearchArea } from '../data/types'
import { usePapers } from '../store/papers'
import { AreaTabs, type AreaFilter } from './AreaTabs'
import { FilterBar, type SortMode } from './FilterBar'
import { PaperList } from './PaperList'
import { RefreshStatus } from './RefreshStatus'

export function BrowseView() {
  const papers = usePapers((s) => s.papers)
  const init = usePapers((s) => s.init)

  const [area, setArea] = useState<AreaFilter>('all')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('year-desc')

  useEffect(() => {
    void init()
  }, [init])

  const counts = useMemo(() => {
    const c: Record<AreaFilter, number> = { all: papers.length, plant: 0, animal: 0, biophysics: 0 }
    for (const p of papers) for (const a of p.areas) c[a]++
    return c
  }, [papers])

  const years = useMemo(
    () => [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a),
    [papers],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return papers.filter((p) => {
      if (area !== 'all' && !p.areas.includes(area as ResearchArea)) return false
      if (year !== 'all' && p.year !== year) return false
      if (q) {
        const hay = `${p.title} ${p.authors} ${p.journal} ${p.abstract ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [papers, area, year, search])

  return (
    <div className="browse">
      <RefreshStatus />
      <AreaTabs value={area} counts={counts} onChange={setArea} />
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
