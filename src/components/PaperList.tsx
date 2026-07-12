import { useMemo } from 'react'
import type { Paper } from '../data/types'
import type { SortMode } from './FilterBar'
import { PaperCard } from './PaperCard'

/** Papers grouped under year headings. */
export function PaperList({ papers, sort }: { papers: Paper[]; sort: SortMode }) {
  const groups = useMemo(() => {
    const byYear = new Map<number, Paper[]>()
    for (const p of papers) {
      const arr = byYear.get(p.year) ?? []
      arr.push(p)
      byYear.set(p.year, arr)
    }
    const years = [...byYear.keys()].sort((a, b) => (sort === 'year-asc' ? a - b : b - a))
    return years.map((y) => ({ year: y, papers: byYear.get(y)! }))
  }, [papers, sort])

  if (papers.length === 0) {
    return <p className="empty">No papers match your filters.</p>
  }

  return (
    <div className="paper-list">
      {groups.map((g) => (
        <section key={g.year} className="year-group">
          <h2 className="year-group__heading">
            {g.year}
            <span className="year-group__count">
              {g.papers.length} paper{g.papers.length === 1 ? '' : 's'}
            </span>
          </h2>
          <div className="year-group__cards">
            {g.papers.map((p) => (
              <PaperCard key={p.id} paper={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
