import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'
import { useApi } from '../api/useApi'
import { getApiBase } from '../api/config'
import {
  type EventDetail,
  type CreateReviewRequest,
  type SubmitReviewResult,
  getEventDetail,
  postJoinRequest,
  leaveEvent,
  submitReview,
} from '../api/events'
import { useEventChat } from '../hooks/useEventChat'
import './EventDetailPage.css'

function formatChatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return isoString
  }
}

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
  const [chatInput, setChatInput] = useState('')
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({})
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({})
  const [reviewSubmitting, setReviewSubmitting] = useState<Record<string, boolean>>({})
  const [reviewResults, setReviewResults] = useState<Record<string, SubmitReviewResult>>({})

  const getAccessToken = useCallback(async () => {
    if (keycloak.token) {
      try {
        await keycloak.updateToken(30)
        return keycloak.token ?? undefined
      } catch {
        return undefined
      }
    }
    return undefined
  }, [keycloak])

  const { messages, sendMessage, connectionState, error: chatError } = useEventChat({
    eventId: id ?? undefined,
    isParticipant: event?.isCurrentUserParticipant === true,
    getAccessToken,
  })

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

  const handleSubmitReview = async (
    targetUserId: string,
    ratingType: CreateReviewRequest['ratingType']
  ) => {
    if (!id) return
    const rating = reviewRatings[targetUserId]
    if (!rating) return
    setReviewSubmitting(prev => ({ ...prev, [targetUserId]: true }))
    const base = getApiBase()
    const result = await submitReview(base, fetchWithAuth, id, {
      targetUserId,
      ratingType,
      rating,
      comment: reviewComments[targetUserId] || undefined,
    })
    setReviewSubmitting(prev => ({ ...prev, [targetUserId]: false }))
    setReviewResults(prev => ({ ...prev, [targetUserId]: result }))
  }

  const isAuthenticated = keycloak.authenticated === true
  const isParticipant = event?.isCurrentUserParticipant === true
  const isHost = event?.isCurrentUserHost === true
  const hasPendingRequest =
    event?.hasCurrentUserPendingJoinRequest === true || localPendingJoin
  const canRequestJoin =
    isAuthenticated && !isParticipant && !isHost && !hasPendingRequest
  const canLeave = isAuthenticated && isParticipant && !isHost
  const eventEnded = event?.endsAt != null && new Date(event.endsAt) < new Date()
  const canReview = isAuthenticated && (isParticipant || isHost) && eventEnded

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

        {isParticipant && (
          <section className="event-detail-section event-detail-chat" aria-label="Event chat">
            <h2 className="event-detail-heading">Chat</h2>
            {chatError && (
              <p className="event-detail-chat-error" role="alert">
                {chatError}
              </p>
            )}
            {connectionState === 'Connected' && (
              <>
                <ul className="event-detail-chat-messages" aria-live="polite">
                  {messages.length === 0 && (
                    <li className="event-detail-chat-empty">No messages yet. Say hello!</li>
                  )}
                  {messages.map((msg, index) => (
                    <li key={`${msg.createdAt}-${index}`} className="event-detail-chat-message">
                      <span className="event-detail-chat-sender">{msg.senderName}</span>
                      <span className="event-detail-chat-time">
                        {formatChatTime(msg.createdAt)}
                      </span>
                      <p className="event-detail-chat-content">{msg.content}</p>
                    </li>
                  ))}
                </ul>
                <form
                  className="event-detail-chat-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (chatInput.trim()) {
                      sendMessage(chatInput)
                      setChatInput('')
                    }
                  }}
                >
                  <input
                    type="text"
                    className="event-detail-chat-input"
                    placeholder="Type a message…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    aria-label="Chat message"
                    maxLength={2000}
                  />
                  <button type="submit" className="event-detail-btn event-detail-btn-primary">
                    Send
                  </button>
                </form>
              </>
            )}
            {connectionState === 'Disconnected' && (
              <p className="event-detail-chat-status">Connecting to chat…</p>
            )}
            {connectionState === 'Reconnecting' && (
              <p className="event-detail-chat-status">Reconnecting…</p>
            )}
          </section>
        )}

        {canReview && (
          <section className="event-detail-section event-detail-reviews" aria-label="Leave a review">
            <h2 className="event-detail-heading">Leave a Review</h2>
            {isParticipant && !isHost && event.hostUserId && (() => {
              const targetId = event.hostUserId
              const result = reviewResults[targetId]
              const submitting = reviewSubmitting[targetId] ?? false
              return (
                <div className="event-detail-review-card">
                  <p className="event-detail-review-target">Rate the host: {event.hostName}</p>
                  {result?.success ? (
                    <p className="event-detail-review-success">Review submitted!</p>
                  ) : result?.alreadyReviewed ? (
                    <p className="event-detail-review-success">You&apos;ve already reviewed this person.</p>
                  ) : (
                    <>
                      <div className="event-detail-star-selector" role="group" aria-label="Rating">
                        {[5, 4, 3, 2, 1].map(star => (
                          <label key={star}>
                            <input
                              type="radio"
                              name={`rating-${targetId}`}
                              value={star}
                              checked={reviewRatings[targetId] === star}
                              onChange={() => setReviewRatings(prev => ({ ...prev, [targetId]: star }))}
                              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                            />
                            ★
                          </label>
                        ))}
                      </div>
                      <textarea
                        className="event-detail-review-comment"
                        placeholder="Comment (optional)"
                        value={reviewComments[targetId] ?? ''}
                        onChange={e => setReviewComments(prev => ({ ...prev, [targetId]: e.target.value }))}
                        maxLength={2000}
                        aria-label="Review comment"
                      />
                      <button
                        type="button"
                        className="event-detail-btn event-detail-btn-primary"
                        onClick={() => handleSubmitReview(targetId, 'Host')}
                        disabled={submitting || !reviewRatings[targetId]}
                      >
                        {submitting ? 'Submitting…' : 'Submit Review'}
                      </button>
                      {result?.error && (
                        <p className="event-detail-review-error">{result.error}</p>
                      )}
                    </>
                  )}
                </div>
              )
            })()}
            {isHost && (event.participants ?? []).map(participant => {
              const targetId = participant.userId
              const result = reviewResults[targetId]
              const submitting = reviewSubmitting[targetId] ?? false
              return (
                <div key={targetId} className="event-detail-review-card">
                  <p className="event-detail-review-target">Rate player: {participant.username}</p>
                  {result?.success ? (
                    <p className="event-detail-review-success">Review submitted!</p>
                  ) : result?.alreadyReviewed ? (
                    <p className="event-detail-review-success">You&apos;ve already reviewed this player.</p>
                  ) : (
                    <>
                      <div className="event-detail-star-selector" role="group" aria-label="Rating">
                        {[5, 4, 3, 2, 1].map(star => (
                          <label key={star}>
                            <input
                              type="radio"
                              name={`rating-${targetId}`}
                              value={star}
                              checked={reviewRatings[targetId] === star}
                              onChange={() => setReviewRatings(prev => ({ ...prev, [targetId]: star }))}
                              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                            />
                            ★
                          </label>
                        ))}
                      </div>
                      <textarea
                        className="event-detail-review-comment"
                        placeholder="Comment (optional)"
                        value={reviewComments[targetId] ?? ''}
                        onChange={e => setReviewComments(prev => ({ ...prev, [targetId]: e.target.value }))}
                        maxLength={2000}
                        aria-label="Review comment"
                      />
                      <button
                        type="button"
                        className="event-detail-btn event-detail-btn-primary"
                        onClick={() => handleSubmitReview(targetId, 'Player')}
                        disabled={submitting || !reviewRatings[targetId]}
                      >
                        {submitting ? 'Submitting…' : 'Submit Review'}
                      </button>
                      {result?.error && (
                        <p className="event-detail-review-error">{result.error}</p>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </section>
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
