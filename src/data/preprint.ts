/** Best-effort mapping of a DOI prefix / publisher string to a preprint server. */
export function detectPreprintServer(doi?: string, publisher?: string): string {
  const p = (publisher ?? '').toLowerCase()
  if (p.includes('biorxiv')) return 'bioRxiv'
  if (p.includes('medrxiv')) return 'medRxiv'
  if (p.includes('research square')) return 'Research Square'
  if (doi) {
    const prefix = doi.split('/')[0]
    switch (prefix) {
      case '10.1101':
        return 'bioRxiv / medRxiv'
      case '10.21203':
        return 'Research Square'
      case '10.20944':
        return 'Preprints.org'
      case '10.26434':
        return 'ChemRxiv'
      case '10.31219':
        return 'OSF Preprints'
    }
  }
  return 'Preprint'
}
