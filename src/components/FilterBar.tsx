export type SortMode = 'year-desc' | 'year-asc'

export function FilterBar({
  search,
  onSearch,
  years,
  year,
  onYear,
  sort,
  onSort,
}: {
  search: string
  onSearch: (v: string) => void
  years: number[]
  year: number | 'all'
  onYear: (v: number | 'all') => void
  sort: SortMode
  onSort: (v: SortMode) => void
}) {
  return (
    <div className="filter-bar">
      <input
        type="search"
        className="filter-bar__search"
        placeholder="Search title, author, journal, abstract…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search papers"
      />
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
