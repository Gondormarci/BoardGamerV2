import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'
import { useApi } from '../api/useApi'
import { getApiBase } from '../api/config'
import {
  type EventDetail,
  getEventDetail,
  postJoinRequest,
  leaveEvent,
} from '../api/events'
import './EventDetailPage.css'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { keycloak } = useKeycloak()
  const { fetchWithAuth } = useApi()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [joinRequesting, setJoinRequesting] = useState(false)
  const [leaveRequesting, setLeaveRequesting] = useState(false)
  const [localPendingJoin, setLocalPendingJoin] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadEvent = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setNotFound(true)
      return
    }
    setLoading(true)
    setNotFound(false)
    setActionError(null)
    const base = getApiBase()
    const data = await getEventDetail(base, fetchWithAuth, id)
    setEvent(data)
    setNotFound(data === null)
    setLoading(false)
  }, [id, fetchWithAuth])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  const isAuthenticated = keycloak.authenticated === true
  const isParticipant = event?.isCurrentUserParticipant === true
  const isHost = event?.isCurrentUserHost === true
  const hasPendingRequest =
    event?.hasCurrentUserPendingJoinRequest === true || localPendingJoin
  const canRequestJoin =
    isAuthenticated && !isParticipant && !isHost && !hasPendingRequest
  const canLeave = isAuthenticated && isParticipant && !isHost

  const handleRequestToJoin = async () => {
    if (!id || !canRequestJoin) return
    setJoinRequesting(true)
    setActionError(null)
    const base = getApiBase()
    const result = await postJoinRequest(base, fetchWithAuth, id)
    setJoinRequesting(false)
    if (result.success) {
      setLocalPendingJoin(true)
      loadEvent()
    } else if (result.alreadyPending) {
      setLocalPendingJoin(true)
      loadEvent()
    } else if (result.alreadyParticipant) {
      loadEvent()
    } else {
      setActionError('Could not send join request. Please try again.')
    }
  }

  const handleLeave = async () => {
    if (!id || !canLeave) return
    setLeaveRequesting(true)
    setActionError(null)
    const base = getApiBase()
    const ok = await leaveEvent(base, fetchWithAuth, id)
    setLeaveRequesting(false)
    if (ok) {
      loadEvent()
    } else {
      setActionError('Could not leave the event. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="event-detail-page">
        <p className="event-detail-loading">Loading event…</p>
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="event-detail-page">
        <p className="event-detail-not-found">Event not found.</p>
        <Link to="/search">Search events</Link>
      </div>
    )
  }

  const games =
    (event.boardGameNames?.length ?? 0) > 0
      ? event.boardGameNames!.join(', ')
      : '—'
  const dateTime = event.startsAt
    ? new Date(event.startsAt).toLocaleString(undefined, {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : '—'
  const endTime = event.endsAt
    ? new Date(event.endsAt).toLocaleString(undefined, {
        timeStyle: 'short',
      })
    : null
  const hostRating =
    event.hostRating != null && event.reviewCount != null
      ? `⭐ ${event.hostRating.toFixed(1)} (${event.reviewCount} reviews)`
      : event.hostRating != null
        ? `⭐ ${event.hostRating.toFixed(1)}`
        : event.reviewCount != null
          ? `(${event.reviewCount} reviews)`
          : '—'
  const slots =
    event.availableSlots != null
      ? `${event.availableSlots} slot(s) left`
      : event.maxPlayers != null
        ? `Up to ${event.maxPlayers} players`
        : '—'
  const participants = event.participantNames?.length
    ? event.participantNames
    : []

  return (
    <div className="event-detail-page">
      <article className="event-detail">
        <h1 className="event-detail-title">{event.title}</h1>

        <section className="event-detail-section event-detail-info">
          <p className="event-detail-meta">
            <span className="event-detail-games">Board game(s): {games}</span>
          </p>
          <p className="event-detail-meta">
            <span className="event-detail-datetime">
              {dateTime}
              {endTime != null ? ` – ${endTime}` : ''}
            </span>
          </p>
          {event.location && (
            <p className="event-detail-location">{event.location}</p>
          )}
          {event.description && (
            <p className="event-detail-description">{event.description}</p>
          )}
          <p className="event-detail-slots">{slots}</p>
          {participants.length > 0 && (
            <p className="event-detail-players">
              Players: {participants.join(', ')}
            </p>
          )}
        </section>

        <section className="event-detail-section event-detail-host">
          <h2 className="event-detail-heading">Host</h2>
          <p className="event-detail-host-name">
            {event.hostName ?? '—'} · {hostRating}
          </p>
        </section>

        {actionError && (
          <p className="event-detail-error" role="alert">
            {actionError}
          </p>
        )}

        <section className="event-detail-actions">
          {canRequestJoin && (
            <button
              type="button"
              className="event-detail-btn event-detail-btn-primary"
              onClick={handleRequestToJoin}
              disabled={joinRequesting}
            >
              {joinRequesting ? 'Sending…' : 'Request to Join'}
            </button>
          )}
          {hasPendingRequest && !isParticipant && (
            <p className="event-detail-pending">Join request pending</p>
          )}
          {canLeave && (
            <button
              type="button"
              className="event-detail-btn event-detail-btn-secondary"
              onClick={handleLeave}
              disabled={leaveRequesting}
            >
              {leaveRequesting ? 'Leaving…' : 'Leave event'}
            </button>
          )}
        </section>
      </article>
    </div>
  )
}
