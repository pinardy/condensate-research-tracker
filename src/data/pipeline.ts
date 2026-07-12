import type { Paper } from './types'
import { classify, dedupe, dropSupersededPreprints, isAllowedJournal, matchJournal } from './classify'

/** Merge records from any number of sources into the final display list. */
export function mergeAndClassify(papers: Paper[]): Paper[] {
  return dropSupersededPreprints(dedupe(papers))
    .map((p) => ({ ...p, areas: p.areas.length ? p.areas : classify(p) }))
    .sort((a, b) => b.year - a.year)
}

/**
 * Prepare the bundled seed: peer-reviewed entries must pass the allowlist;
 * preprints are kept as-is. Fills in impact factor and areas.
 */
export function refineSeed(papers: Paper[]): Paper[] {
  const kept = papers.filter((p) => p.isPreprint || isAllowedJournal(p))
  return dedupe(kept).map((p) => {
    const entry = matchJournal(p)
    return {
      ...p,
      impactFactor: p.impactFactor ?? entry?.impactFactor,
      areas: p.areas.length ? p.areas : classify(p),
    }
  })
}
