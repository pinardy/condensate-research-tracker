import type { ResearchArea } from '../data/types'
import { AREA_LABELS } from '../data/types'

export type AreaFilter = ResearchArea | 'all' | 'preprints'

const ORDER: AreaFilter[] = ['all', 'plant', 'animal', 'biophysics', 'preprints']

const LABELS: Record<AreaFilter, string> = {
  all: 'All areas',
  preprints: 'Preprints',
  plant: AREA_LABELS.plant,
  animal: AREA_LABELS.animal,
  biophysics: AREA_LABELS.biophysics,
}

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
          {LABELS[a]}
          <span className="area-tab__count">{counts[a] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
