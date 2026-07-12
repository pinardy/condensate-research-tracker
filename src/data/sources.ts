import type { Paper, SourceId } from './types'
import { fetchEuropePmc, fetchPreprints } from './europepmc'
import { fetchPubMed } from './pubmed'
import { fetchCrossref } from './crossref'

export type SourceKind = 'peer' | 'preprint'

export interface SourceMeta {
  id: SourceId
  label: string
  shortLabel: string
  kind: SourceKind
  description: string
  fetch: (args: { maxResults?: number; extraQuery?: string; signal?: AbortSignal }) => Promise<Paper[]>
}

export const SOURCES: SourceMeta[] = [
  {
    id: 'europepmc',
    label: 'Europe PMC',
    shortLabel: 'Europe PMC',
    kind: 'peer',
    description: 'Life-sciences literature (includes MEDLINE/PubMed & PMC). Full abstracts.',
    fetch: fetchEuropePmc,
  },
  {
    id: 'pubmed',
    label: 'PubMed',
    shortLabel: 'PubMed',
    kind: 'peer',
    description: 'NCBI E-utilities. Overlaps Europe PMC; abstracts filled in via dedup.',
    fetch: fetchPubMed,
  },
  {
    id: 'crossref',
    label: 'Crossref',
    shortLabel: 'Crossref',
    kind: 'peer',
    description: 'Cross-publisher DOI metadata. Abstracts where publishers deposit them.',
    fetch: fetchCrossref,
  },
  {
    id: 'preprints',
    label: 'Preprints (bioRxiv / medRxiv)',
    shortLabel: 'Preprints',
    kind: 'preprint',
    description: 'Preprints via Europe PMC. Bypass the IF≥4 rule; shown in the Preprints tab.',
    fetch: fetchPreprints,
  },
]

export const SOURCE_BY_ID: Record<SourceId, SourceMeta> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
) as Record<SourceId, SourceMeta>

export const DEFAULT_ENABLED: SourceId[] = SOURCES.map((s) => s.id)
