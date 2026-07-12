export type ResearchArea = 'plant' | 'animal' | 'biophysics'

export const AREA_LABELS: Record<ResearchArea, string> = {
  plant: 'Plant',
  animal: 'Animal',
  biophysics: 'Biophysics',
}

/** A normalized research paper as displayed in the app. */
export interface Paper {
  /** Stable unique key: `${source}:${id}` (Europe PMC) or `seed:<n>`. */
  id: string
  source: string
  doi?: string
  /** Convenience link, `https://doi.org/<doi>`. */
  doiUrl?: string
  title: string
  authors: string
  journal: string
  journalAbbrev?: string
  issn?: string
  essn?: string
  year: number
  firstPublicationDate?: string
  /** Abstract text — shown as the "main findings" summary. */
  abstract?: string
  pubTypes: string[]
  /** Multi-label classification (0..3 areas). */
  areas: ResearchArea[]
  /** Approx Journal Impact Factor from the curated allowlist, when known. */
  impactFactor?: number
}

/** An entry in the curated "reputable journals (IF >= 4)" allowlist. */
export interface JournalAllowEntry {
  name: string
  /** Print and electronic ISSNs (any form: with or without hyphen). */
  issns?: string[]
  /** Approximate Journal Impact Factor (Clarivate JCR, indicative). */
  impactFactor: number
}

/** A user-created folder for organizing bookmarks. */
export interface Folder {
  id: string
  name: string
  createdAt: number
}

/** Persisted bookmark metadata (kept small — no abstract stored). */
export interface Bookmark {
  paperId: string
  doi?: string
  title: string
  journal: string
  year: number
  areas: ResearchArea[]
  /** null / undefined => unfiled. */
  folderId?: string | null
  createdAt: number
}
