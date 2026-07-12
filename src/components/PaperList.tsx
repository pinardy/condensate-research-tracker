import { useEffect, useMemo, useRef, useState } from 'react'
import type { Paper } from '../data/types'
import type { SortMode } from './FilterBar'
import { PaperCard } from './PaperCard'

/** How many cards to render initially, and how many to add each time the
 *  bottom sentinel scrolls into view. Keeps the mounted DOM small regardless
 *  of how large the filtered result set is. */
const INITIAL = 60
const STEP = 40

/** Papers from before this year are tucked under a collapsible toggle so the
 *  list leads with the most recent work. */
const CURRENT_YEAR = new Date().getFullYear()

interface YearGroup {
  year: number
  papers: Paper[]
}

interface WindowedGroup {
  year: number
  total: number
  papers: Paper[]
}

/** Take whole year-sections until the card budget is spent (preserves the
 *  `.year-group__cards` grid). Returns the slices and the budget left over. */
function windowGroups(groups: YearGroup[], budget: number): [WindowedGroup[], number] {
  const out: WindowedGroup[] = []
  for (const g of groups) {
    if (budget <= 0) break
    const slice = g.papers.slice(0, budget)
    out.push({ year: g.year, total: g.papers.length, papers: slice })
    budget -= slice.length
  }
  return [out, budget]
}

const countCards = (groups: YearGroup[]) => groups.reduce((n, g) => n + g.papers.length, 0)

/** Papers grouped under year headings, rendered through an incremental window.
 *  Groups older than the current year are collapsed behind a toggle. */
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

  const recentGroups = useMemo(() => groups.filter((g) => g.year >= CURRENT_YEAR), [groups])
  const olderGroups = useMemo(() => groups.filter((g) => g.year < CURRENT_YEAR), [groups])
  // Only collapse when there is both recent and older content; otherwise showing
  // an all-collapsed (or pointless) toggle would just hide the whole list.
  const canCollapse = recentGroups.length > 0 && olderGroups.length > 0
  const olderCount = useMemo(() => countCards(olderGroups), [olderGroups])

  const [showOlder, setShowOlder] = useState(false)
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

  // When collapsing isn't in play, treat every group as "recent" (no toggle).
  const primaryGroups = canCollapse ? recentGroups : groups
  const secondaryGroups = canCollapse ? olderGroups : []
  const secondaryOpen = canCollapse && showOlder
  const activeCount = countCards(primaryGroups) + (secondaryOpen ? olderCount : 0)

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
          setVisible((v) => Math.min(v + STEP, activeCount))
        }
      },
      { rootMargin: '800px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [activeCount, visible])

  if (papers.length === 0) {
    return <p className="empty">No papers match your filters.</p>
  }

  // Spend the card budget on recent groups first, then (if expanded) older ones.
  const [primaryVisible, budgetLeft] = windowGroups(primaryGroups, visible)
  const [secondaryVisible] = secondaryOpen ? windowGroups(secondaryGroups, budgetLeft) : [[]]

  const renderGroup = (g: WindowedGroup) => (
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
  )

  return (
    <div className="paper-list">
      {primaryVisible.map(renderGroup)}

      {canCollapse && (
        <button
          type="button"
          className="year-collapse"
          aria-expanded={showOlder}
          onClick={() => setShowOlder((v) => !v)}
        >
          <span className="year-collapse__chevron" aria-hidden>
            {showOlder ? '▾' : '▸'}
          </span>
          {showOlder ? 'Hide' : 'Show'} {olderCount} earlier paper{olderCount === 1 ? '' : 's'} (
          {CURRENT_YEAR - 1} and earlier)
        </button>
      )}

      {secondaryVisible.map(renderGroup)}

      {visible < activeCount && (
        <div ref={sentinelRef} className="paper-list__sentinel" aria-hidden />
      )}
    </div>
  )
}
