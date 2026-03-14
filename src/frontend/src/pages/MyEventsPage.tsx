import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../api/useApi'
import { getApiBase } from '../api/config'
import {
  type EventSummary,
  type JoinRequestSummary,
  getMyHostedEvents,
  getMyJoinedEvents,
  getEventJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from '../api/events'
import './MyEventsPage.css'

function formatEventDate(startsAt: string): string {
  return new Date(startsAt).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function EventCard({ event }: { event: EventSummary }) {
  const games = event.boardGameNames?.length
    ? event.boardGameNames.join(', ')
    : '—'
  return (
    <article className="my-events-card">
      <h3 className="my-events-card-title">
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>
      <p className="my-events-card-meta">
        <span className="my-events-card-games">{games}</span>
        <span className="my-events-card-date">{formatEventDate(event.startsAt)}</span>
      </p>
      {event.location && (
        <p className="my-events-card-location">{event.location}</p>
      )}
    </article>
  )
}

function PendingRequestRow({
  request,
  eventTitle,
  onApprove,
  onReject,
  loading,
}: {
  request: JoinRequestSummary
  eventTitle: string
  onApprove: () => void
  onReject: () => void
  loading: boolean
}) {
  const requestedAt = request.requestedAt
    ? new Date(request.requestedAt).toLocaleString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—'
  const isPending =
    request.status?.toLowerCase() === 'pending' || !request.status
  return (
    <div className="my-events-request-row">
      <div className="my-events-request-info">
        <span className="my-events-request-username">
          {request.username ?? request.userId}
        </span>
        {request.playerRating != null && (
          <span className="my-events-request-rating">
            ⭐ {request.playerRating.toFixed(1)}
            {request.reviewCount != null && ` (${request.reviewCount})`}
          </span>
        )}
        <span className="my-events-request-date">Requested {requestedAt}</span>
      </div>
      {isPending && (
        <div className="my-events-request-actions">
          <button
            type="button"
            className="my-events-btn my-events-btn-approve"
            onClick={onApprove}
            disabled={loading}
            aria-label={`Approve ${request.username ?? request.userId} for ${eventTitle}`}
          >
            Approve
          </button>
          <button
            type="button"
            className="my-events-btn my-events-btn-reject"
            onClick={onReject}
            disabled={loading}
            aria-label={`Reject ${request.username ?? request.userId} for ${eventTitle}`}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

export default function MyEventsPage() {
  const { fetchWithAuth } = useApi()
  const [hostedEvents, setHostedEvents] = useState<EventSummary[]>([])
  const [joinedEvents, setJoinedEvents] = useState<EventSummary[]>([])
  const [joinRequestsByEventId, setJoinRequestsByEventId] = useState<
    Record<string, JoinRequestSummary[]>
  >({})
  const [loadingHosted, setLoadingHosted] = useState(true)
  const [loadingJoined, setLoadingJoined] = useState(true)
  const [actionRequestId, setActionRequestId] = useState<string | null>(null)

  const loadHosted = useCallback(async () => {
    const base = getApiBase()
    setLoadingHosted(true)
    const list = await getMyHostedEvents(base, fetchWithAuth)
    setHostedEvents(list)
    setLoadingHosted(false)
  }, [fetchWithAuth])

  const loadJoined = useCallback(async () => {
    const base = getApiBase()
    setLoadingJoined(true)
    const list = await getMyJoinedEvents(base, fetchWithAuth)
    setJoinedEvents(list)
    setLoadingJoined(false)
  }, [fetchWithAuth])

  const loadJoinRequestsForHosted = useCallback(
    async (eventIds: string[]) => {
      const base = getApiBase()
      if (!base || eventIds.length === 0) return
      const results = await Promise.all(
        eventIds.map(async (eventId) => {
          const requests = await getEventJoinRequests(base, fetchWithAuth, eventId)
          return { eventId, requests }
        })
      )
      setJoinRequestsByEventId((prev) => {
        const next = { ...prev }
        for (const { eventId, requests } of results) {
          const pending = requests.filter(
            (r) => r.status?.toLowerCase() === 'pending' || !r.status
          )
          next[eventId] = pending
        }
        return next
      })
    },
    [fetchWithAuth]
  )

  useEffect(() => {
    loadHosted()
    loadJoined()
  }, [loadHosted, loadJoined])

  useEffect(() => {
    if (hostedEvents.length > 0) {
      loadJoinRequestsForHosted(hostedEvents.map((e) => e.id))
    }
  }, [hostedEvents.length, loadJoinRequestsForHosted])

  const handleApprove = useCallback(
    async (eventId: string, requestId: string) => {
      const base = getApiBase()
      if (!base) return
      setActionRequestId(requestId)
      const ok = await approveJoinRequest(base, fetchWithAuth, eventId, requestId)
      setActionRequestId(null)
      if (ok) {
        setJoinRequestsByEventId((prev) => ({
          ...prev,
          [eventId]: (prev[eventId] ?? []).filter((r) => r.id !== requestId),
        }))
      }
    },
    [fetchWithAuth]
  )

  const handleReject = useCallback(
    async (eventId: string, requestId: string) => {
      const base = getApiBase()
      if (!base) return
      setActionRequestId(requestId)
      const ok = await rejectJoinRequest(base, fetchWithAuth, eventId, requestId)
      setActionRequestId(null)
      if (ok) {
        setJoinRequestsByEventId((prev) => ({
          ...prev,
          [eventId]: (prev[eventId] ?? []).filter((r) => r.id !== requestId),
        }))
      }
    },
    [fetchWithAuth]
  )

  return (
    <main className="my-events-page">
      <h1>My Events</h1>
      <p className="my-events-intro">
        View events you host, events you’ve joined, and manage join requests.
      </p>

      <section className="my-events-section" aria-labelledby="hosted-heading">
        <h2 id="hosted-heading">Events I’m hosting</h2>
        {loadingHosted ? (
          <p className="my-events-loading">Loading…</p>
        ) : hostedEvents.length === 0 ? (
          <p className="my-events-empty">You are not hosting any events yet.</p>
        ) : (
          <ul className="my-events-list">
            {hostedEvents.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
                {(joinRequestsByEventId[event.id]?.length ?? 0) > 0 && (
                  <div className="my-events-pending-block">
                    <h3 className="my-events-pending-heading">
                      Pending join requests
                    </h3>
                    {(joinRequestsByEventId[event.id] ?? []).map((req) => (
                      <PendingRequestRow
                        key={req.id}
                        request={req}
                        eventTitle={event.title}
                        onApprove={() => handleApprove(event.id, req.id)}
                        onReject={() => handleReject(event.id, req.id)}
                        loading={actionRequestId === req.id}
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="my-events-section" aria-labelledby="joined-heading">
        <h2 id="joined-heading">Events I’ve joined</h2>
        {loadingJoined ? (
          <p className="my-events-loading">Loading…</p>
        ) : joinedEvents.length === 0 ? (
          <p className="my-events-empty">You have not joined any events yet.</p>
        ) : (
          <ul className="my-events-list">
            {joinedEvents.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
