import type { FetchResult, Paper } from './types'
import { matchJournal } from './classify'
import { DEFAULT_TERMS } from './europepmc'

const ESEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
const ESUMMARY = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'

/**
 * NCBI E-utilities PubMed adapter (esearch -> esummary, JSON).
 *
 * NOTE: esummary does not include abstracts, so PubMed contributes coverage and
 * bibliographic metadata; abstracts are filled in when a record dedups against
 * Europe PMC / Crossref (which it usually does, since Europe PMC mirrors
 * MEDLINE). PubMed-only records may therefore lack a "main findings" summary.
 * If NCBI does not send CORS headers for a given browser, this source simply
 * yields nothing and the app falls back to the others.
 */
interface ESearchResponse {
  esearchresult?: { idlist?: string[]; count?: string }
}

interface ESummaryDoc {
  uid?: string
  title?: string
  fulljournalname?: string
  source?: string
  pubdate?: string
  issn?: string
  essn?: string
  articleids?: { idtype?: string; value?: string }[]
}

interface ESummaryResponse {
  result?: Record<string, ESummaryDoc | string[]>
}

function buildTerm(terms: string[], extraQuery?: string): string {
  // E-utilities accept the same quoted-phrase OR syntax.
  const extra = extraQuery?.trim() ? ` AND (${extraQuery.trim()})` : ''
  return `(${terms.join(' OR ')}) AND hasabstract${extra}`
}

function parseYear(pubdate?: string): number {
  const m = pubdate?.match(/\d{4}/)
  return m ? Number.parseInt(m[0], 10) : new Date().getFullYear()
}

export interface FetchArgs {
  terms?: string[]
  maxResults?: number
  extraQuery?: string
  signal?: AbortSignal
}

export async function fetchPubMed(args: FetchArgs = {}): Promise<FetchResult> {
  const terms = args.terms ?? DEFAULT_TERMS
  const retmax = args.maxResults ?? 120

  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: buildTerm(terms, args.extraQuery),
    sort: 'date',
    retmax: String(retmax),
    retmode: 'json',
  })
  const sres = await fetch(`${ESEARCH}?${searchParams.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: args.signal,
  })
  if (!sres.ok) throw new Error(`PubMed esearch failed: ${sres.status}`)
  const search = ((await sres.json()) as ESearchResponse).esearchresult
  const ids = search?.idlist ?? []
  const total = search?.count ? Number.parseInt(search.count, 10) : undefined
  if (ids.length === 0) return { papers: [], total: total ?? 0, scanned: 0 }

  const sumParams = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'json',
  })
  const dres = await fetch(`${ESUMMARY}?${sumParams.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: args.signal,
  })
  if (!dres.ok) throw new Error(`PubMed esummary failed: ${dres.status}`)
  const result = ((await dres.json()) as ESummaryResponse).result ?? {}

  const papers: Paper[] = []
  for (const uid of ids) {
    const doc = result[uid]
    if (!doc || Array.isArray(doc)) continue
    const doi = doc.articleids?.find((a) => a.idtype === 'doi')?.value?.trim()
    const paper: Paper = {
      id: `PUBMED:${uid}`,
      source: 'PUBMED',
      doi,
      doiUrl: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
      title: doc.title?.replace(/\.$/, '') ?? 'Untitled',
      authors: '',
      journal: doc.fulljournalname ?? doc.source ?? 'Unknown journal',
      journalAbbrev: doc.source,
      issn: doc.issn,
      essn: doc.essn,
      year: parseYear(doc.pubdate),
      abstract: undefined,
      pubTypes: ['Journal Article'],
      areas: [],
      providers: ['pubmed'],
      isPreprint: false,
    }
    const entry = matchJournal(paper)
    if (entry) paper.impactFactor = entry.impactFactor // IF filter applied client-side
    papers.push(paper)
  }
  return { papers, total, scanned: ids.length }
}
