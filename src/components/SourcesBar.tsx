import { SOURCES } from '../data/sources'
import { usePapers, type SourceStatus } from '../store/papers'

const STATUS_TITLE: Record<SourceStatus, string> = {
  ok: 'Returned results',
  empty: 'Reachable, no matching results',
  error: 'Unreachable (offline, blocked, or CORS)',
  disabled: 'Disabled',
  idle: 'Not fetched yet',
}

export function SourcesBar() {
  const enabled = usePapers((s) => s.enabledSources)
  const sourceStatus = usePapers((s) => s.sourceStatus)
  const sourceCounts = usePapers((s) => s.sourceCounts)
  const setSourceEnabled = usePapers((s) => s.setSourceEnabled)

  return (
    <div className="sources-bar">
      <span className="sources-bar__label">Sources</span>
      <div className="sources-bar__chips">
        {SOURCES.map((s) => {
          const on = enabled.includes(s.id)
          const st = on ? sourceStatus[s.id] : 'disabled'
          const c = sourceCounts[s.id]
          const countLabel =
            on && st === 'ok'
              ? c?.total != null
                ? ` ${c.kept}/${c.total.toLocaleString()}`
                : ` ${c?.kept ?? 0}`
              : ''
          const countTitle =
            on && c && (c.kept || c.total != null)
              ? `\nKept ${c.kept}${c.total != null ? ` of ${c.total.toLocaleString()} topic matches` : ''} (IF≥4 filter)`
              : ''
          return (
            <button
              key={s.id}
              type="button"
              className={`source-chip ${on ? 'is-on' : ''}`}
              aria-pressed={on}
              title={`${s.description}\nStatus: ${STATUS_TITLE[st]}${countTitle}`}
              onClick={() => setSourceEnabled(s.id, !on)}
            >
              <span className={`source-chip__dot dot--${st}`} aria-hidden="true" />
              {s.shortLabel}
              {countLabel && <span className="source-chip__count">{countLabel}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
