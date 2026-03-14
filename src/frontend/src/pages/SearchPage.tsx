import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../api/useApi'
import { getApiBase } from '../api/config'
import {
  type EventSummary,
  type EventSearchParams,
  buildEventsSearchQuery,
} from '../api/events'
import './SearchPage.css'

const SORT_OPTIONS: { value: EventSearchParams['sortBy']; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'distance', label: 'Distance' },
  { value: 'hostRating', label: 'Host rating' },
]

function EventCard({ event }: { event: EventSummary }) {
  const games = event.boardGameNames?.length
    ? event.boardGameNames.join(', ')
    : '—'
  const date = event.startsAt
    ? new Date(event.startsAt).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—'
  const rating =
    event.hostRating != null && event.reviewCount != null
      ? `⭐ ${event.hostRating.toFixed(1)} (${event.reviewCount} reviews)`
      : event.hostRating != null
        ? `⭐ ${event.hostRating.toFixed(1)}`
        : '—'
  const slots =
    event.availableSlots != null
      ? `${event.availableSlots} slot(s)`
      : event.maxPlayers != null
        ? `up to ${event.maxPlayers} players`
        : '—'

  return (
    <article className="event-card">
      <h3 className="event-card-title">
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>
      <p className="event-card-meta">
        <span className="event-card-games">{games}</span>
        <span className="event-card-date">{date}</span>
      </p>
      {event.location && (
        <p className="event-card-location">{event.location}</p>
      )}
      {event.hostName && (
        <p className="event-card-host">
          Host: {event.hostName} · {rating}
        </p>
      )}
      <p className="event-card-slots">{slots}</p>
    </article>
  )
}

export default function SearchPage() {
  const { fetchWithAuth } = useApi()
  const [filters, setFilters] = useState<EventSearchParams>({
    location: '',
    gameName: '',
    dateFrom: '',
    dateTo: '',
    minPlayers: undefined,
    maxPlayers: undefined,
    hostRatingMin: undefined,
    radiusKm: undefined,
    sortBy: 'date',
  })
  const [results, setResults] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(
    async (params: EventSearchParams) => {
      const base = getApiBase()
      if (!base) {
        setResults([])
        setSearched(true)
        return
      }
      setLoading(true)
      setSearched(true)
      try {
        const query = buildEventsSearchQuery(params)
        const url = `${base}/api/v1/events${query ? `?${query}` : ''}`
        const res = await fetchWithAuth(url)
        if (!res.ok) {
          setResults([])
          return
        }
        const data = (await res.json()) as unknown
        const items = Array.isArray(data)
          ? data
          : data && typeof data === 'object' && 'items' in data
            ? (data as { items: EventSummary[] }).items
            : []
        setResults(Array.isArray(items) ? items : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [fetchWithAuth]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(filters)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sortBy = e.target.value as EventSearchParams['sortBy']
    setFilters((prev) => ({ ...prev, sortBy }))
    runSearch({ ...filters, sortBy })
  }

  return (
    <main className="search-page">
      <h1>Search Events</h1>
      <form className="search-filters" onSubmit={handleSubmit}>
        <div className="search-filters-grid">
          <label>
            Location
            <input
              type="text"
              value={filters.location ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="City or address"
            />
          </label>
          <label>
            Board game
            <input
              type="text"
              value={filters.gameName ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, gameName: e.target.value }))
              }
              placeholder="Game name"
            />
          </label>
          <label>
            Date from
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
              }
            />
          </label>
          <label>
            Date to
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
              }
            />
          </label>
          <label>
            Min players
            <input
              type="number"
              min={1}
              value={filters.minPlayers ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setFilters((prev) => ({
                  ...prev,
                  minPlayers: v === '' ? undefined : parseInt(v, 10),
                }))
              }}
              placeholder="—"
            />
          </label>
          <label>
            Max players
            <input
              type="number"
              min={1}
              value={filters.maxPlayers ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setFilters((prev) => ({
                  ...prev,
                  maxPlayers: v === '' ? undefined : parseInt(v, 10),
                }))
              }}
              placeholder="—"
            />
          </label>
          <label>
            Host rating min
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={filters.hostRatingMin ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setFilters((prev) => ({
                  ...prev,
                  hostRatingMin: v === '' ? undefined : parseFloat(v),
                }))
              }}
              placeholder="—"
            />
          </label>
          <label>
            Radius (km)
            <input
              type="number"
              min={0}
              value={filters.radiusKm ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setFilters((prev) => ({
                  ...prev,
                  radiusKm: v === '' ? undefined : parseFloat(v),
                }))
              }}
              placeholder="—"
            />
          </label>
        </div>
        <button type="submit" className="search-submit">
          Search
        </button>
      </form>

      {searched && (
        <>
          {results.length > 0 && (
            <div className="search-results-header">
              <label>
                Sort by{' '}
                <select
                  value={filters.sortBy ?? 'date'}
                  onChange={handleSortChange}
                  aria-label="Sort results"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {loading ? (
            <p className="search-loading" role="status" aria-live="polite">
              Loading…
            </p>
          ) : results.length === 0 ? (
            <p className="search-empty">
              No events found. Try different filters or check back later.
            </p>
          ) : (
            <ul className="search-results" aria-label="Event results">
              {results.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
