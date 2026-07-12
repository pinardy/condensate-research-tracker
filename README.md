# Condensate Research Tracker

A React + TypeScript **Progressive Web App** that tracks the latest research on
**protein / biomolecular phase separation** (liquid–liquid phase separation,
biomolecular condensates, membraneless organelles).

Papers are classified into three research areas — **Plant**, **Animal**,
**Biophysics** — and shown grouped by **year**, each with its **journal**,
**DOI link**, an approximate **Impact Factor**, and a **main-findings** summary
(the journal abstract). You can **bookmark** papers and organize them into
**folders**.

## Features

- **Multiple live sources** — fetches directly from several free, CORS-enabled
  APIs in the browser (no backend, no API keys), merged and de-duplicated by DOI:
  - **Europe PMC** — life-sciences literature (incl. MEDLINE/PubMed & PMC), full abstracts
  - **PubMed** (NCBI E-utilities) — added coverage; abstracts filled in via dedup
  - **Crossref** — cross-publisher DOI metadata
  - **Preprints** — bioRxiv / medRxiv (via Europe PMC's preprint index)

  Each source can be toggled on/off, every card shows which sources indexed it,
  and per-source status dots show whether a source returned results, was empty,
  or was unreachable. Refreshes automatically when local data is over a week old,
  plus a manual **Refresh now** button.
- **Reputable journals only (IF ≥ 4)** — peer-reviewed results are filtered to a
  curated allowlist of high-impact journals in the field (see caveat below).
  **Preprints** deliberately bypass this rule and live in their own tab.
- **Multi-label classification** — a paper can appear under more than one area
  (e.g. an in-vitro study of a mammalian protein is both *Animal* and
  *Biophysics*).
- **Browse & filter** — area tabs, full-text search (title / author / journal /
  abstract), year filter, and newest/oldest sort.
- **Bookmarks & folders** — save papers, create / rename / delete folders, move
  papers between folders, view them all. Stored locally (localStorage) and
  survives reloads and offline use.
- **Installable PWA** — web-app manifest + service worker (Workbox). The app
  shell is precached and API responses are cached (`NetworkFirst`), so it opens
  and shows the last data even offline.
- **Ships with real data** — a curated set of ~28 landmark and recent papers is
  bundled so the app is useful on first launch and fully offline; the live feed
  layers newer papers on top.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

Build & preview the production PWA:

```bash
npm run build
npm run preview
```

## Deploying (optional)

The build is a static site (`dist/`) — host it anywhere (Netlify, Vercel,
GitHub Pages, …). For GitHub Pages served from a subpath, build with the repo
base path:

```bash
BASE_PATH=/condensate-research-tracker/ npm run build
```

(The included GitHub Actions workflow does this automatically on every push to
`main`, deriving the base path from the Pages URL.)

## Editing the journal allowlist

`src/data/journals.ts` is the single source of truth for the "IF ≥ 4"
requirement. Add or remove entries there — matching is by ISSN first, then by
normalized journal title. The `impactFactor` value drives the on-card badge.

## Caveats

- **Impact Factor is not a live lookup.** Journal Impact Factor is a proprietary
  Clarivate (JCR) metric that no free API exposes, so "IF ≥ 4" is enforced via
  the curated allowlist in `src/data/journals.ts`. The IF values shown are
  indicative recent figures.
- **Seed summaries** are editor-written summaries of each paper's main findings;
  papers fetched live instead display the journal's own abstract.
- **Sources & CORS.** Europe PMC and Crossref serve permissive CORS, so browser
  fetch works with no proxy. **PubMed** (NCBI E-utilities) does not consistently
  send CORS headers; the adapter is written defensively so that if the browser
  blocks it, PubMed simply contributes nothing and the app falls back to the
  other sources (its status dot turns red). PubMed's `esummary` also has no
  abstract field, so PubMed-only records rely on dedup against Europe PMC/Crossref
  for their summary.
- **Preprints.** bioRxiv/medRxiv's own API has no keyword search, so preprints
  are sourced through **Europe PMC's preprint index** (`SRC:PPR`), which covers
  bioRxiv/medRxiv and returns abstracts. They bypass the IF ≥ 4 filter and are
  clearly labelled and confined to the Preprints tab.
- **Google Scholar** cannot be integrated: it has no public API and blocks
  programmatic/browser access (no CORS + anti-bot). The only options are paid
  server-side scrapers, incompatible with this no-backend PWA.

## How sources are combined

`src/data/sources.ts` registers each source adapter (`europepmc`, `pubmed`,
`crossref`, `preprints`). The store fetches all enabled sources in parallel
(`Promise.allSettled`, so one failing source never blocks the others), then
`src/data/pipeline.ts` de-duplicates by DOI (falling back to normalized title),
unions provenance, prefers the record with an abstract, drops preprints
superseded by a published version, and classifies each paper into areas.

## Project structure

```
src/
  data/       types, source adapters (europepmc/pubmed/crossref), registry,
              journal allowlist, classifier, merge pipeline, seed data
  store/      Zustand stores (multi-source papers feed + bookmarks/folders)
  components/ Browse (sources bar, area/preprints tabs) + Bookmarks UI
```
