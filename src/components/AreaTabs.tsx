import type { ResearchArea } from '../data/types'
import { AREA_LABELS } from '../data/types'

export type AreaFilter = ResearchArea | 'all'

const ORDER: AreaFilter[] = ['all', 'plant', 'animal', 'biophysics']

export function AreaTabs({
  value,
  counts,
  onChange,
}: {
  value: AreaFilter
  counts: Record<AreaFilter, number>
  onChange: (a: AreaFilter) => void
}) {
  return (
    <div className="area-tabs" role="tablist" aria-label="Research area">
      {ORDER.map((a) => (
        <button
          key={a}
          role="tab"
          aria-selected={value === a}
          className={`area-tab area-tab--${a} ${value === a ? 'is-active' : ''}`}
          onClick={() => onChange(a)}
        >
          {a === 'all' ? 'All areas' : AREA_LABELS[a]}
          <span className="area-tab__count">{counts[a] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
