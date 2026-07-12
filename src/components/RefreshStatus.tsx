import { usePapers } from '../store/papers'

function formatWhen(ts: number | null): string {
  if (!ts) return 'not yet updated'
  const diff = Date.now() - ts
  const day = 24 * 60 * 60 * 1000
  if (diff < 60 * 1000) return 'just now'
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / (60 * 1000))} min ago`
  if (diff < day) return `${Math.round(diff / (60 * 60 * 1000))} h ago`
  const d = Math.round(diff / day)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

export function RefreshStatus() {
  const status = usePapers((s) => s.status)
  const lastFetched = usePapers((s) => s.lastFetched)
  const error = usePapers((s) => s.error)
  const refresh = usePapers((s) => s.refresh)
  const count = usePapers((s) => s.papers.length)

  return (
    <div className="refresh-status">
      <div className="refresh-status__text">
        <strong>{count}</strong> papers · updated {formatWhen(lastFetched)}
        {status === 'loading' && <span className="dot-pulse"> · fetching…</span>}
        {status === 'error' && (
          <span className="refresh-status__err" title={error ?? ''}>
            {' '}
            · showing saved data (offline)
          </span>
        )}
      </div>
      <button
        type="button"
        className="btn btn--ghost"
        disabled={status === 'loading'}
        onClick={() => refresh(true)}
      >
        {status === 'loading' ? 'Refreshing…' : 'Refresh now'}
      </button>
    </div>
  )
}
