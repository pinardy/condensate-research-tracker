import { useState } from 'react'
import { BrowseView } from './components/BrowseView'
import { BookmarksView } from './components/BookmarksView'
import { useBookmarks } from './store/bookmarks'

type View = 'browse' | 'bookmarks'

export default function App() {
  const [view, setView] = useState<View>('browse')
  const bookmarkCount = useBookmarks((s) => Object.keys(s.bookmarks).length)

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <img src="favicon.svg" alt="" width={34} height={34} />
          <div>
            <h1>Condensate Research Tracker</h1>
            <p className="app__tagline">
              Latest protein / biomolecular phase-separation research · IF&nbsp;≥&nbsp;4 journals
            </p>
          </div>
        </div>
        <nav className="app__nav">
          <button
            className={`nav-btn ${view === 'browse' ? 'is-active' : ''}`}
            onClick={() => setView('browse')}
          >
            Browse
          </button>
          <button
            className={`nav-btn ${view === 'bookmarks' ? 'is-active' : ''}`}
            onClick={() => setView('bookmarks')}
          >
            Bookmarks
            {bookmarkCount > 0 && <span className="nav-btn__badge">{bookmarkCount}</span>}
          </button>
        </nav>
      </header>

      <main className="app__main">
        {view === 'browse' ? <BrowseView /> : <BookmarksView />}
      </main>

      <footer className="app__footer">
        <span>
          Data via{' '}
          <a href="https://europepmc.org" target="_blank" rel="noreferrer">
            Europe&nbsp;PMC
          </a>
          ,{' '}
          <a href="https://pubmed.ncbi.nlm.nih.gov" target="_blank" rel="noreferrer">
            PubMed
          </a>
          {' '}&amp;{' '}
          <a href="https://www.crossref.org" target="_blank" rel="noreferrer">
            Crossref
          </a>
          , plus bioRxiv/medRxiv preprints. Impact Factor is approximated by a curated
          journal allowlist.
        </span>
      </footer>
    </div>
  )
}
