import type { FetchResult, Paper } from './types'
import { matchJournal } from './classify'
import { DEFAULT_TERMS } from './europepmc'

const BASE = 'https://api.openalex.org/works'
const MAILTO = 'condensate-research-tracker@users.noreply.github.com'

interface OAAuthorship {
  author?: { display_name?: string }
}

interface OAWork {
  doi?: string // full URL form: https://doi.org/10.x
  title?: string
  display_name?: string
  publication_year?: number
  type?: string
  cited_by_count?: number
  authorships?: OAAuthorship[]
  abstract_inverted_index?: Record<string, number[]> | null
  primary_location?: {
    source?: {
      display_name?: string
      issn_l?: string
      issn?: string[]
    }
  }
}

interface OAResponse {
  meta?: { count?: number; next_cursor?: string | null }
  results?: OAWork[]
}

/** Reconstruct plaintext from OpenAlex's inverted-index abstract. */
export function reconstructAbstract(idx?: Record<string, number[]> | null): string | undefined {
  if (!idx) return undefined
  const slots: string[] = []
  for (const [word, positions] of Object.entries(idx)) {
    for (const p of positions) slots[p] = word
  }
  const text = slots.filter((w) => w != null).join(' ').replace(/\s+/g, ' ').trim()
  return text || undefined
}

function authorString(authorships?: OAAuthorship[]): string {
  if (!authorships?.length) return ''
  const names = authorships
    .slice(0, 8)
    .map((a) => a.author?.display_name)
    .filter(Boolean) as string[]
  return authorships.length > 8 ? `${names.join(', ')}, et al.` : names.join(', ')
}

export interface FetchArgs {
  terms?: string[]
  maxResults?: number
  extraQuery?: string
  signal?: AbortSignal
  /** OpenAlex cursor to resume from (from a prior nextCursor); '*' = start. */
  cursor?: string
}

export async function fetchOpenAlex(args: FetchArgs = {}): Promise<FetchResult> {
  // OpenAlex `search` is relevance search over title/abstract/fulltext.
  const search = [
    ...(args.terms ?? DEFAULT_TERMS).map((t) => t.replace(/"/g, '')),
    args.extraQuery?.trim() ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  const perPage = Math.min(200, args.maxResults ?? 200)

  const params = new URLSearchParams({
    search,
    filter: 'has_abstract:true,type:article',
    sort: 'publication_date:desc',
    'per-page': String(perPage),
    cursor: args.cursor || '*',
    select:
      'doi,title,display_name,publication_year,type,cited_by_count,authorships,abstract_inverted_index,primary_location',
    mailto: MAILTO,
  })
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: args.signal,
  })
  if (!res.ok) throw new Error(`OpenAlex request failed: ${res.status}`)
  const data = (await res.json()) as OAResponse
  const works = data.results ?? []

  const papers: Paper[] = []
  for (const w of works) {
    const doi = w.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim()
    const title = w.title ?? w.display_name
    if (!title) continue
    const source = w.primary_location?.source
    const paper: Paper = {
      id: doi ? `OPENALEX:${doi.toLowerCase()}` : `OPENALEX:${title.slice(0, 40)}`,
      source: 'OPENALEX',
      doi,
      doiUrl: doi ? `https://doi.org/${doi}` : undefined,
      title: title.replace(/\.$/, ''),
      authors: authorString(w.authorships),
      journal: source?.display_name ?? 'Unknown journal',
      issn: source?.issn_l ?? source?.issn?.[0],
      year: w.publication_year ?? new Date().getFullYear(),
      abstract: reconstructAbstract(w.abstract_inverted_index),
      pubTypes: [w.type ?? 'article'],
      areas: [],
      providers: ['openalex'],
      isPreprint: false,
    }
    const entry = matchJournal(paper)
    if (entry) paper.impactFactor = entry.impactFactor // IF filter applied client-side
    papers.push(paper)
  }
  return {
    papers,
    total: data.meta?.count,
    scanned: works.length,
    nextCursor: works.length ? data.meta?.next_cursor ?? undefined : undefined,
  }
}
