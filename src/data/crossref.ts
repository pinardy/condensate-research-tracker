import type { FetchResult, Paper } from './types'
import { matchJournal } from './classify'
import { DEFAULT_TERMS } from './europepmc'

const BASE = 'https://api.crossref.org/works'
// Polite-pool contact per Crossref guidance.
const MAILTO = 'condensate-research-tracker@users.noreply.github.com'

interface CrossrefItem {
  DOI?: string
  title?: string[]
  'container-title'?: string[]
  ISSN?: string[]
  author?: { given?: string; family?: string }[]
  abstract?: string
  published?: { 'date-parts'?: number[][] }
  issued?: { 'date-parts'?: number[][] }
  type?: string
}

interface CrossrefResponse {
  message?: { items?: CrossrefItem[]; 'total-results'?: number }
}

/** Strip JATS/XML tags from a Crossref abstract string. */
function stripJats(xml?: string): string | undefined {
  if (!xml) return undefined
  const text = xml
    .replace(/<jats:title>[\s\S]*?<\/jats:title>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text || undefined
}

function authorString(authors?: CrossrefItem['author']): string {
  if (!authors?.length) return ''
  const names = authors
    .slice(0, 8)
    .map((a) => [a.family, a.given?.[0]].filter(Boolean).join(' '))
    .filter(Boolean)
  return authors.length > 8 ? `${names.join(', ')}, et al.` : names.join(', ')
}

function pickYear(item: CrossrefItem): number {
  const parts = item.published?.['date-parts']?.[0] ?? item.issued?.['date-parts']?.[0]
  return parts?.[0] ?? new Date().getFullYear()
}

export interface FetchArgs {
  terms?: string[]
  maxResults?: number
  /** ISO date lower bound; defaults to ~3 years ago. */
  fromPubDate?: string
  extraQuery?: string
  signal?: AbortSignal
  /** Row offset to resume from (from a prior nextCursor); '0' = start. */
  cursor?: string
}

export async function fetchCrossref(args: FetchArgs = {}): Promise<FetchResult> {
  // Crossref `query` is relevance search over all words (no strict boolean),
  // so appending the topic biases results toward it.
  const query = [
    ...(args.terms ?? DEFAULT_TERMS).map((t) => t.replace(/"/g, '')),
    args.extraQuery?.trim() ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  const rows = args.maxResults ?? 150
  const offset = Number.parseInt(args.cursor ?? '', 10) || 0
  const from = args.fromPubDate ?? `${new Date().getFullYear() - 3}-01-01`

  const params = new URLSearchParams({
    query,
    filter: `from-pub-date:${from},type:journal-article`,
    sort: 'published',
    order: 'desc',
    rows: String(rows),
    offset: String(offset),
    select: 'DOI,title,container-title,ISSN,author,abstract,published,issued,type',
    mailto: MAILTO,
  })
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: args.signal,
  })
  if (!res.ok) throw new Error(`Crossref request failed: ${res.status}`)
  const message = ((await res.json()) as CrossrefResponse).message
  const items = message?.items ?? []
  const total = message?.['total-results']

  const papers: Paper[] = []
  for (const item of items) {
    const doi = item.DOI?.trim()
    const title = item.title?.[0]
    if (!doi || !title) continue
    const paper: Paper = {
      id: `CROSSREF:${doi.toLowerCase()}`,
      source: 'CROSSREF',
      doi,
      doiUrl: `https://doi.org/${doi}`,
      title: title.replace(/\.$/, ''),
      authors: authorString(item.author),
      journal: item['container-title']?.[0] ?? 'Unknown journal',
      issn: item.ISSN?.[0],
      year: pickYear(item),
      abstract: stripJats(item.abstract),
      pubTypes: [item.type ?? 'journal-article'],
      areas: [],
      providers: ['crossref'],
      isPreprint: false,
    }
    const entry = matchJournal(paper)
    if (entry) paper.impactFactor = entry.impactFactor // IF filter applied client-side
    papers.push(paper)
  }
  // A full page implies more rows remain; resume from the next offset.
  const nextCursor = items.length === rows ? String(offset + rows) : undefined
  return { papers, total, scanned: items.length, nextCursor }
}
