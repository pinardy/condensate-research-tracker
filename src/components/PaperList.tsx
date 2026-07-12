import { useEffect, useMemo, useRef, useState } from 'react'
import type { Paper } from '../data/types'
import type { SortMode } from './FilterBar'
import { PaperCard } from './PaperCard'

/** How many cards to render initially, and how many to add each time the
 *  bottom sentinel scrolls into view. Keeps the mounted DOM small regardless
 *  of how large the filtered result set is. */
const INITIAL = 60
const STEP = 40

/** Papers grouped under year headings, rendered through an incremental window. */
export function PaperList({
  papers,
  sort,
  newSet,
}: {
  papers: Paper[]
  sort: SortMode
  newSet: Set<string>
}) {
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

  const [visible, setVisible] = useState(INITIAL)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Restart the window at the top whenever the result set or sort changes.
  // Adjusted during render (not in an effect) so we never commit a frame that
  // shows the previous, larger window against the new result set.
  const [prevGroups, setPrevGroups] = useState(groups)
  if (groups !== prevGroups) {
    setPrevGroups(groups)
    setVisible(INITIAL)
  }

  // Grow the window as the sentinel nears the viewport (prefetch via rootMargin).
  // `visible` is intentionally a dependency: re-observing after each grow re-fires
  // the callback while the sentinel is still in view, so a tall viewport keeps
  // filling instead of stalling after a single step.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + STEP, papers.length))
        }
      },
      { rootMargin: '800px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [papers.length, visible])

  if (papers.length === 0) {
    return <p className="empty">No papers match your filters.</p>
  }

  // Render whole year-sections until the card budget (`visible`) is spent, so
  // the `.year-group__cards` grid layout is preserved. Headings still show the
  // full per-year count, not just the rendered slice.
  const visibleGroups: { year: number; total: number; papers: Paper[] }[] = []
  let budget = visible
  for (const g of groups) {
    if (budget <= 0) break
    const slice = g.papers.slice(0, budget)
    visibleGroups.push({ year: g.year, total: g.papers.length, papers: slice })
    budget -= slice.length
  }

  return (
    <div className="paper-list">
      {visibleGroups.map((g) => (
        <section key={g.year} className="year-group">
          <h2 className="year-group__heading">
            {g.year}
            <span className="year-group__count">
              {g.total} paper{g.total === 1 ? '' : 's'}
            </span>
          </h2>
          <div className="year-group__cards">
            {g.papers.map((p) => (
              <PaperCard key={p.id} paper={p} isNew={newSet.has(p.id)} />
            ))}
          </div>
        </section>
      ))}
      {visible < papers.length && (
        <div ref={sentinelRef} className="paper-list__sentinel" aria-hidden />
      )}
    </div>
  )
}
