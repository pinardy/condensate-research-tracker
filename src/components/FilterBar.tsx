export type SortMode = 'year-desc' | 'year-asc'

export function FilterBar({
  search,
  onSearch,
  years,
  year,
  onYear,
  sort,
  onSort,
  onDeepSearch,
  deepSearchLoading,
}: {
  search: string
  onSearch: (v: string) => void
  years: number[]
  year: number | 'all'
  onYear: (v: number | 'all') => void
  sort: SortMode
  onSort: (v: SortMode) => void
  /** Fire a live "search all sources" for the current text. */
  onDeepSearch: () => void
  deepSearchLoading: boolean
}) {
  const q = search.trim()
  return (
    <div className="filter-bar">
      <div className="filter-bar__searchwrap">
        <input
          type="search"
          className="filter-bar__search"
          placeholder="Search title, author, journal, abstract…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q) onDeepSearch()
          }}
          aria-label="Search papers"
        />
        {q && (
          <button
            type="button"
            className="btn btn--brand btn--small filter-bar__deep"
            onClick={onDeepSearch}
            disabled={deepSearchLoading}
          >
            {deepSearchLoading ? 'Searching…' : `🔎 Search all sources for “${q}”`}
          </button>
        )}
      </div>
      <label className="filter-bar__field">
        <span>Year</span>
        <select
          value={String(year)}
          onChange={(e) => onYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">All</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <label className="filter-bar__field">
        <span>Sort</span>
        <select value={sort} onChange={(e) => onSort(e.target.value as SortMode)}>
          <option value="year-desc">Newest first</option>
          <option value="year-asc">Oldest first</option>
        </select>
      </label>
    </div>
  )
}
