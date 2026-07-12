import type { JournalAllowEntry, Paper, ResearchArea } from './types'
import { JOURNAL_ALLOWLIST } from './journals'

/** Normalize a journal title for fuzzy matching. */
export function normalizeJournalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Normalize an ISSN: drop hyphen/space, uppercase the trailing check char. */
function normalizeIssn(issn: string): string {
  return issn.replace(/[^0-9xX]/g, '').toUpperCase()
}

// Precompute lookup structures once.
const ISSN_TO_ENTRY = new Map<string, JournalAllowEntry>()
const NAME_TO_ENTRY = new Map<string, JournalAllowEntry>()
for (const entry of JOURNAL_ALLOWLIST) {
  NAME_TO_ENTRY.set(normalizeJournalName(entry.name), entry)
  for (const issn of entry.issns ?? []) ISSN_TO_ENTRY.set(normalizeIssn(issn), entry)
}

/** Find the matching allowlist entry (ISSN first, then normalized name/abbrev). */
export function matchJournal(p: {
  journal?: string
  journalAbbrev?: string
  issn?: string
  essn?: string
}): JournalAllowEntry | undefined {
  for (const code of [p.issn, p.essn]) {
    if (code) {
      const hit = ISSN_TO_ENTRY.get(normalizeIssn(code))
      if (hit) return hit
    }
  }
  for (const title of [p.journal, p.journalAbbrev]) {
    if (title) {
      const hit = NAME_TO_ENTRY.get(normalizeJournalName(title))
      if (hit) return hit
    }
  }
  return undefined
}

/** True when the paper's journal is on the curated IF >= 4 allowlist. */
export function isAllowedJournal(p: Paper): boolean {
  return matchJournal(p) !== undefined
}

// --- Research-area classification -------------------------------------------

const AREA_KEYWORDS: Record<ResearchArea, RegExp[]> = {
  plant: [
    /\bplant(s)?\b/,
    /\barabidopsis\b/,
    /\bchloroplast/,
    /\bphytochrome/,
    /\bstomata|stomatal\b/,
    /\bpollen\b/,
    /\broot(s)?\b/,
    /\bleaf|leaves\b/,
    /\bseedling/,
    /\bcrop(s)?\b/,
    /\bmoss\b/,
    /\bphyscomitrella|marchantia\b/,
    /\brice\b|\bmaize\b|\bwheat\b|\btomato\b/,
    /\bflowering\b/,
    /\bchlorophyll\b/,
    /\bphotosynth/,
    /\bthylakoid\b/,
    /\bguard cell/,
  ],
  animal: [
    /\bmouse|mice|murine\b/,
    /\bmammalian\b/,
    /\bneuron(s|al)?\b/,
    /\bdrosophila\b/,
    /\bzebrafish\b/,
    /\bc\.?\s?elegans\b/,
    /\bxenopus\b/,
    /\bhela\b|\bhek\s?293\b|\bu2os\b|\bcos-?7\b/,
    /\bcancer|tumou?r|oncogen/,
    /\bneurodegener|amyotrophic|als\b|\bfrontotemporal\b/,
    /\bsynap(se|tic)\b/,
    /\bembryo(nic)?\b/,
    /\bhuman (cell|disease|patient)/,
    /\bstem cell/,
    /\bimmune|t cell|b cell|macrophage/,
    /\bvirus|viral|infection\b/,
    /\bstress granule/,
  ],
  biophysics: [
    /\bin vitro\b/,
    /\bphase diagram/,
    /\bsaturation concentration|c\s?sat\b/,
    /\bcoacervat/,
    /\bfrap\b|fluorescence recovery/,
    /\bviscosity|viscoelastic|rheolog/,
    /\bsurface tension|interfacial tension/,
    /\bmolecular dynamics|coarse-?grained|simulation/,
    /\bthermodynamic|free energy/,
    /\bmultivalen(t|cy)\b/,
    /\bintrinsically disordered|idr\b|idp\b/,
    /\bscaffold|client\b/,
    /\bnucleation\b/,
    /\bmaterial propert/,
    /\bwetting\b/,
    /\bcondensate material|liquid-?to-?solid|gelation|aging|maturation\b/,
    /\bpurified protein|reconstitut/,
  ],
}

/**
 * Multi-label classification over title + abstract. A paper can belong to
 * several areas (e.g. an in-vitro study using a mammalian protein). Falls back
 * to `biophysics` when nothing matches, since that is the field's default lens.
 */
export function classify(p: Pick<Paper, 'title' | 'abstract'>): ResearchArea[] {
  const text = `${p.title} ${p.abstract ?? ''}`.toLowerCase()
  const areas: ResearchArea[] = []
  ;(Object.keys(AREA_KEYWORDS) as ResearchArea[]).forEach((area) => {
    if (AREA_KEYWORDS[area].some((re) => re.test(text))) areas.push(area)
  })
  return areas.length > 0 ? areas : ['biophysics']
}

// --- Dedup ------------------------------------------------------------------

const unionProviders = (a: Paper, b: Paper) => [...new Set([...a.providers, ...b.providers])]

/** Merge two records that refer to the same work. */
function mergeRecords(a: Paper, b: Paper): Paper {
  // Prefer a peer-reviewed record over a preprint as the base.
  const [base, other] = a.isPreprint && !b.isPreprint ? [b, a] : [a, b]
  return {
    ...base,
    abstract: base.abstract || other.abstract,
    doi: base.doi || other.doi,
    doiUrl: base.doiUrl || other.doiUrl,
    issn: base.issn || other.issn,
    essn: base.essn || other.essn,
    impactFactor: base.impactFactor ?? other.impactFactor,
    providers: unionProviders(a, b),
  }
}

/**
 * Deduplicate across sources. Key priority: lower-cased DOI -> source:id ->
 * normalized title. Colliding records are merged (providers unioned, richest
 * metadata kept, peer-reviewed preferred over preprint).
 */
export function dedupe(papers: Paper[]): Paper[] {
  const byKey = new Map<string, Paper>()
  for (const p of papers) {
    const key = p.doi
      ? `doi:${p.doi.toLowerCase()}`
      : p.id
        ? `id:${p.id}`
        : `title:${normalizeJournalName(p.title)}`
    const existing = byKey.get(key)
    byKey.set(key, existing ? mergeRecords(existing, p) : p)
  }
  return [...byKey.values()]
}

/**
 * Drop preprints whose title matches a peer-reviewed paper already in the set
 * (the published version supersedes its preprint, even under a different DOI).
 */
export function dropSupersededPreprints(papers: Paper[]): Paper[] {
  const publishedTitles = new Set(
    papers.filter((p) => !p.isPreprint).map((p) => normalizeJournalName(p.title)),
  )
  return papers.filter((p) => !(p.isPreprint && publishedTitles.has(normalizeJournalName(p.title))))
}
