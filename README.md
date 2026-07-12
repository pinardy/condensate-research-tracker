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

- **Live research feed** — fetches papers directly from the free
  [Europe PMC](https://europepmc.org) REST API in the browser (no backend, no
  API key). Refreshes automatically when the local data is more than a week old,
  plus a manual **Refresh now** button.
- **Reputable journals only (IF ≥ 4)** — results are filtered to a curated
  allowlist of high-impact journals in the field (see caveat below).
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
cd research-tracker
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
BASE_PATH=/offline-dev-toolbox/ npm run build
```

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
- **CORS.** Europe PMC serves the REST API with permissive CORS, so the browser
  fetch works with no proxy. If that ever changes, a small serverless proxy would
  be the fallback.

## Project structure

```
src/
  data/       types, Europe PMC client, journal allowlist, classifier, seed data
  store/      Zustand stores (papers feed + bookmarks/folders, both persisted)
  components/ Browse + Bookmarks UI
```
