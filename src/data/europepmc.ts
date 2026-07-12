import type { FetchResult, Paper } from './types'
import { detectPreprintServer } from './preprint'
import { matchJournal } from './classify'

const BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'

/** Search terms covering the protein / biomolecular phase-separation field. */
export const DEFAULT_TERMS = [
  '"liquid-liquid phase separation"',
  '"biomolecular condensate"',
  '"biomolecular condensates"',
  '"protein phase separation"',
  '"membraneless organelle"',
  '"membraneless organelles"',
  '"liquid-liquid phase transition"',
  // Synonyms / variants to widen recall (added for coverage):
  '"LLPS"',
  '"phase-separated"',
  '"coacervation"',
  '"coacervate"',
  '"liquid-liquid demixing"',
  '"condensate formation"',
]

export function buildQuery(
  terms: string[] = DEFAULT_TERMS,
  opts: { preprints?: boolean; extraQuery?: string } = {},
): string {
  const src = opts.preprints ? 'AND SRC:PPR' : 'NOT SRC:PPR'
  const extra = opts.extraQuery?.trim() ? ` AND (${opts.extraQuery.trim()})` : ''
  return `(${terms.join(' OR ')}) AND HAS_ABSTRACT:Y${extra} ${src}`
}

/** Raw shape of a single `resultList.result[]` record (fields we use). */
interface RawResult {
  id?: string
  source?: string
  pmid?: string
  pmcid?: string
  doi?: string
  title?: string
  authorString?: string
  pubYear?: string
  firstPublicationDate?: string
  abstractText?: string
  journalInfo?: {
    yearOfPublication?: number
    journal?: {
      title?: string
      medlineAbbreviation?: string
      issn?: string
      essn?: string
    }
  }
  bookOrReportDetails?: { publisher?: string }
  pubTypeList?: { pubType?: string[] }
}

interface SearchResponse {
  hitCount?: number
  nextCursorMark?: string
  resultList?: { result?: RawResult[] }
}

export interface SearchPageArgs {
  query: string
  cursorMark: string
  pageSize?: number
  sort?: string
  signal?: AbortSignal
}

/** Fetch a single page of results. */
export async function searchPage(
  args: SearchPageArgs,
): Promise<{ hitCount: number; nextCursorMark: string; results: RawResult[] }> {
  const params = new URLSearchParams({
    query: args.query,
    resultType: 'core',
    format: 'json',
    pageSize: String(args.pageSize ?? 100),
    sort: args.sort ?? 'P_PDATE_D desc',
    cursorMark: args.cursorMark,
  })
  const res = await fetch(`${BASE}?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: args.signal,
  })
  if (!res.ok) throw new Error(`Europe PMC request failed: ${res.status} ${res.statusText}`)
  const data = (await res.json()) as SearchResponse
  return {
    hitCount: data.hitCount ?? 0,
    nextCursorMark: data.nextCursorMark ?? '',
    results: data.resultList?.result ?? [],
  }
}

/** Convert a raw Europe PMC record into our normalized Paper (areas empty). */
export function normalizeResult(raw: RawResult, preprint: boolean): Paper {
  const journalTitle = raw.journalInfo?.journal?.title ?? (preprint ? 'Preprint' : 'Unknown journal')
  const yearNum =
    Number.parseInt(raw.pubYear ?? '', 10) ||
    raw.journalInfo?.yearOfPublication ||
    (raw.firstPublicationDate
      ? Number.parseInt(raw.firstPublicationDate.slice(0, 4), 10)
      : 0)
  const doi = raw.doi?.trim() || undefined
  return {
    id: `${raw.source ?? 'MED'}:${raw.id ?? raw.pmid ?? crypto.randomUUID()}`,
    source: raw.source ?? 'MED',
    doi,
    doiUrl: doi ? `https://doi.org/${doi}` : undefined,
    title: raw.title?.replace(/\.$/, '') ?? 'Untitled',
    authors: raw.authorString ?? '',
    journal: journalTitle,
    journalAbbrev: raw.journalInfo?.journal?.medlineAbbreviation,
    issn: raw.journalInfo?.journal?.issn,
    essn: raw.journalInfo?.journal?.essn,
    year: yearNum || new Date().getFullYear(),
    firstPublicationDate: raw.firstPublicationDate,
    abstract: raw.abstractText,
    pubTypes: raw.pubTypeList?.pubType ?? [],
    areas: [],
    providers: preprint ? ['preprints'] : ['europepmc'],
    isPreprint: preprint,
    preprintServer: preprint ? detectPreprintServer(doi, raw.bookOrReportDetails?.publisher) : undefined,
  }
}

export interface FetchArgs {
  terms?: string[]
  pageSize?: number
  /** Stop after collecting roughly this many records. */
  maxResults?: number
  /** Extra topic to AND into the query (live "search all sources"). */
  extraQuery?: string
  signal?: AbortSignal
  /** cursorMark to resume from (from a prior fetch's nextCursor); '*' = start. */
  cursor?: string
}

async function fetchAll(args: FetchArgs, preprint: boolean): Promise<FetchResult> {
  const query = buildQuery(args.terms, { preprints: preprint, extraQuery: args.extraQuery })
  const pageSize = args.pageSize ?? 100
  const maxResults = args.maxResults ?? (preprint ? 120 : 300)
  const collected: Paper[] = []
  let cursorMark = args.cursor || '*'
  let total = 0
  let scanned = 0
  let nextCursor: string | undefined

  // Cap page count as a safety net against runaway loops.
  for (let page = 0; page < 30; page++) {
    const { hitCount, nextCursorMark, results } = await searchPage({
      query,
      cursorMark,
      pageSize,
      signal: args.signal,
    })
    if (page === 0) total = hitCount
    if (results.length === 0) break
    for (const raw of results) {
      scanned++
      const paper = normalizeResult(raw, preprint)
      if (!preprint) {
        // Keep all records; tag IF when the journal is on the allowlist. The
        // IF>=4 filter is applied later (client-side) so it can be relaxed.
        const entry = matchJournal(paper)
        if (entry) paper.impactFactor = entry.impactFactor
      }
      collected.push(paper)
    }
    if (!nextCursorMark || nextCursorMark === cursorMark) break
    cursorMark = nextCursorMark
    // Reached this batch's ceiling but more pages remain: hand back the cursor.
    if (collected.length >= maxResults) {
      nextCursor = cursorMark
      break
    }
  }
  return { papers: collected, total, scanned, nextCursor }
}

/** Peer-reviewed Europe PMC records, filtered to the IF>=4 allowlist. */
export function fetchEuropePmc(args: FetchArgs = {}): Promise<FetchResult> {
  return fetchAll(args, false)
}

/** Preprints (bioRxiv/medRxiv etc.) via Europe PMC's SRC:PPR index. */
export function fetchPreprints(args: FetchArgs = {}): Promise<FetchResult> {
  return fetchAll(args, true)
}
