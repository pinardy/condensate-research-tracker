import { useState } from 'react'
import type { Paper } from '../data/types'
import { AREA_LABELS } from '../data/types'
import { BookmarkButton } from './BookmarkButton'

export function PaperCard({ paper }: { paper: Paper }) {
  const [open, setOpen] = useState(false)
  const abstract = paper.abstract?.trim()
  const isLong = (abstract?.length ?? 0) > 280
  const shown = !abstract
    ? 'No abstract available.'
    : open || !isLong
      ? abstract
      : `${abstract.slice(0, 280).trimEnd()}…`

  return (
    <article className="paper-card">
      <div className="paper-card__head">
        <div className="paper-card__areas">
          {paper.areas.map((a) => (
            <span key={a} className={`badge badge--${a}`}>
              {AREA_LABELS[a]}
            </span>
          ))}
        </div>
        <BookmarkButton paper={paper} />
      </div>

      <h3 className="paper-card__title">{paper.title}</h3>
      {paper.authors && <p className="paper-card__authors">{paper.authors}</p>}

      <div className="paper-card__meta">
        <span className="paper-card__journal">{paper.journal}</span>
        {paper.impactFactor != null && (
          <span className="chip chip--if" title="Approx. Journal Impact Factor (curated)">
            IF {paper.impactFactor.toFixed(1)}
          </span>
        )}
        <span className="chip">{paper.year}</span>
        {paper.doiUrl && (
          <a className="chip chip--doi" href={paper.doiUrl} target="_blank" rel="noreferrer">
            DOI ↗
          </a>
        )}
      </div>

      <div className="paper-card__findings">
        <span className="paper-card__findings-label">Main findings</span>
        <p className={abstract ? '' : 'is-muted'}>{shown}</p>
        {isLong && (
          <button type="button" className="linkish" onClick={() => setOpen((o) => !o)}>
            {open ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </article>
  )
}
