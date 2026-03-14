import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../api/useApi'
import { getApiBase } from '../api/config'
import {
  type CreateEventRequest,
  createEvent,
} from '../api/events'
import './CreateEventPage.css'

const MIN_PLAYERS_MIN = 1
const MIN_PLAYERS_MAX = 50
const MAX_PLAYERS_MIN = 1
const MAX_PLAYERS_MAX = 50

function parseBoardGameNames(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function CreateEventPage() {
  const navigate = useNavigate()
  const { fetchWithAuth } = useApi()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [title, setTitle] = useState('')
  const [boardGamesInput, setBoardGamesInput] = useState('')
  const [location, setLocation] = useState('')
  const [startsAtDate, setStartsAtDate] = useState('')
  const [startsAtTime, setStartsAtTime] = useState('')
  const [endsAtDate, setEndsAtDate] = useState('')
  const [endsAtTime, setEndsAtTime] = useState('')
  const [minPlayers, setMinPlayers] = useState<number>(2)
  const [maxPlayers, setMaxPlayers] = useState<number>(6)
  const [description, setDescription] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [equipment, setEquipment] = useState('')
  const [snacks, setSnacks] = useState('')

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    if (!title.trim()) errors.title = 'Event title is required.'
    if (!location.trim()) errors.location = 'Location is required.'
    if (!startsAtDate.trim()) errors.startsAt = 'Start date is required.'
    if (!startsAtTime.trim()) errors.startsAt = errors.startsAt ? 'Start date and time are required.' : 'Start time is required.'
    if (!endsAtDate.trim()) errors.endsAt = 'End date is required.'
    if (!endsAtTime.trim()) errors.endsAt = errors.endsAt ? 'End date and time are required.' : 'End time is required.'
    if (!description.trim()) errors.description = 'Description is required.'

    const startsAt = new Date(`${startsAtDate}T${startsAtTime}`)
    const endsAt = new Date(`${endsAtDate}T${endsAtTime}`)
    const now = new Date()
    if (startsAt.getTime() <= now.getTime()) {
      errors.startsAt = errors.startsAt || 'Start must be in the future.'
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      errors.endsAt = errors.endsAt || 'End must be after start.'
    }

    const min = Number(minPlayers)
    const max = Number(maxPlayers)
    if (Number.isNaN(min) || min < MIN_PLAYERS_MIN || min > MIN_PLAYERS_MAX) {
      errors.minPlayers = `Min players must be between ${MIN_PLAYERS_MIN} and ${MIN_PLAYERS_MAX}.`
    }
    if (Number.isNaN(max) || max < MAX_PLAYERS_MIN || max > MAX_PLAYERS_MAX) {
      errors.maxPlayers = `Max players must be between ${MAX_PLAYERS_MIN} and ${MAX_PLAYERS_MAX}.`
    }
    if (!errors.minPlayers && !errors.maxPlayers && min > max) {
      errors.maxPlayers = 'Max players must be at least min players.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [
    title,
    location,
    startsAtDate,
    startsAtTime,
    endsAtDate,
    endsAtTime,
    description,
    minPlayers,
    maxPlayers,
  ])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      if (!validate()) return
      setSubmitting(true)
      const payload: CreateEventRequest = {
        title: title.trim(),
        location: location.trim(),
        startsAt: `${startsAtDate}T${startsAtTime}:00`,
        endsAt: `${endsAtDate}T${endsAtTime}:00`,
        minPlayers: Number(minPlayers),
        maxPlayers: Number(maxPlayers),
        description: description.trim(),
      }
      if (additionalNotes.trim()) payload.additionalNotes = additionalNotes.trim()
      if (equipment.trim()) payload.equipment = equipment.trim()
      if (snacks.trim()) payload.snacks = snacks.trim()
      const names = parseBoardGameNames(boardGamesInput)
      if (names.length > 0) payload.boardGameNames = names

      const base = getApiBase()
      const result = await createEvent(base, fetchWithAuth, payload)
      setSubmitting(false)
      if (result) {
        navigate(`/events/${result.eventId}`, { replace: true })
      } else {
        setSubmitError('Could not create event. Please check your input and try again.')
      }
    },
    [
      title,
      location,
      startsAtDate,
      startsAtTime,
      endsAtDate,
      endsAtTime,
      minPlayers,
      maxPlayers,
      description,
      additionalNotes,
      equipment,
      snacks,
      boardGamesInput,
      validate,
      fetchWithAuth,
      navigate,
    ]
  )

  return (
    <main className="create-event-page">
      <h1>Host Event</h1>
      <p className="create-event-intro">
        Create a new board game event so others can find and join your game.
      </p>
      <form className="create-event-form" onSubmit={handleSubmit} noValidate>
        {submitError && (
          <div className="create-event-error" role="alert">
            {submitError}
          </div>
        )}

        <div className="create-event-field">
          <label htmlFor="create-event-title">
            Event title <span className="required">*</span>
          </label>
          <input
            id="create-event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Saturday Catan Night"
            maxLength={500}
            aria-required="true"
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? 'create-event-title-error' : undefined}
          />
          {fieldErrors.title && (
            <span id="create-event-title-error" className="create-event-field-error">
              {fieldErrors.title}
            </span>
          )}
        </div>

        <div className="create-event-field">
          <label htmlFor="create-event-games">Board game(s)</label>
          <input
            id="create-event-games"
            type="text"
            value={boardGamesInput}
            onChange={(e) => setBoardGamesInput(e.target.value)}
            placeholder="e.g. Catan, Ticket to Ride (comma-separated)"
            aria-invalid={false}
          />
        </div>

        <div className="create-event-field">
          <label htmlFor="create-event-location">
            Location <span className="required">*</span>
          </label>
          <input
            id="create-event-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Address or venue name"
            maxLength={500}
            aria-required="true"
            aria-invalid={!!fieldErrors.location}
            aria-describedby={fieldErrors.location ? 'create-event-location-error' : undefined}
          />
          {fieldErrors.location && (
            <span id="create-event-location-error" className="create-event-field-error">
              {fieldErrors.location}
            </span>
          )}
        </div>

        <div className="create-event-datetime">
          <div className="create-event-field">
            <label htmlFor="create-event-starts-date">
              Start date <span className="required">*</span>
            </label>
            <input
              id="create-event-starts-date"
              type="date"
              value={startsAtDate}
              onChange={(e) => setStartsAtDate(e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.startsAt}
              aria-describedby={fieldErrors.startsAt ? 'create-event-starts-error' : undefined}
            />
          </div>
          <div className="create-event-field">
            <label htmlFor="create-event-starts-time">Start time <span className="required">*</span></label>
            <input
              id="create-event-starts-time"
              type="time"
              value={startsAtTime}
              onChange={(e) => setStartsAtTime(e.target.value)}
              aria-required="true"
            />
          </div>
          {fieldErrors.startsAt && (
            <span id="create-event-starts-error" className="create-event-field-error create-event-field-error-block">
              {fieldErrors.startsAt}
            </span>
          )}
        </div>

        <div className="create-event-datetime">
          <div className="create-event-field">
            <label htmlFor="create-event-ends-date">
              End date <span className="required">*</span>
            </label>
            <input
              id="create-event-ends-date"
              type="date"
              value={endsAtDate}
              onChange={(e) => setEndsAtDate(e.target.value)}
              aria-required="true"
              aria-invalid={!!fieldErrors.endsAt}
              aria-describedby={fieldErrors.endsAt ? 'create-event-ends-error' : undefined}
            />
          </div>
          <div className="create-event-field">
            <label htmlFor="create-event-ends-time">End time <span className="required">*</span></label>
            <input
              id="create-event-ends-time"
              type="time"
              value={endsAtTime}
              onChange={(e) => setEndsAtTime(e.target.value)}
              aria-required="true"
            />
          </div>
          {fieldErrors.endsAt && (
            <span id="create-event-ends-error" className="create-event-field-error create-event-field-error-block">
              {fieldErrors.endsAt}
            </span>
          )}
        </div>

        <div className="create-event-players">
          <div className="create-event-field">
            <label htmlFor="create-event-min-players">
              Min players <span className="required">*</span>
            </label>
            <input
              id="create-event-min-players"
              type="number"
              min={MIN_PLAYERS_MIN}
              max={MIN_PLAYERS_MAX}
              value={minPlayers}
              onChange={(e) => setMinPlayers(Number(e.target.value) || 0)}
              aria-required="true"
              aria-invalid={!!fieldErrors.minPlayers}
              aria-describedby={fieldErrors.minPlayers ? 'create-event-min-players-error' : undefined}
            />
            {fieldErrors.minPlayers && (
              <span id="create-event-min-players-error" className="create-event-field-error">
                {fieldErrors.minPlayers}
              </span>
            )}
          </div>
          <div className="create-event-field">
            <label htmlFor="create-event-max-players">
              Max players <span className="required">*</span>
            </label>
            <input
              id="create-event-max-players"
              type="number"
              min={MAX_PLAYERS_MIN}
              max={MAX_PLAYERS_MAX}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value) || 0)}
              aria-required="true"
              aria-invalid={!!fieldErrors.maxPlayers}
              aria-describedby={fieldErrors.maxPlayers ? 'create-event-max-players-error' : undefined}
            />
            {fieldErrors.maxPlayers && (
              <span id="create-event-max-players-error" className="create-event-field-error">
                {fieldErrors.maxPlayers}
              </span>
            )}
          </div>
        </div>

        <div className="create-event-field">
          <label htmlFor="create-event-description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="create-event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What players can expect (rules, vibe, experience level…)"
            rows={4}
            maxLength={4000}
            aria-required="true"
            aria-invalid={!!fieldErrors.description}
            aria-describedby={fieldErrors.description ? 'create-event-description-error' : undefined}
          />
          {fieldErrors.description && (
            <span id="create-event-description-error" className="create-event-field-error">
              {fieldErrors.description}
            </span>
          )}
        </div>

        <div className="create-event-field">
          <label htmlFor="create-event-notes">Additional notes</label>
          <textarea
            id="create-event-notes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Anything else participants should know"
            rows={2}
          />
        </div>

        <div className="create-event-field">
          <label htmlFor="create-event-equipment">Equipment</label>
          <input
            id="create-event-equipment"
            type="text"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="e.g. Bring your own dice"
          />
        </div>

        <div className="create-event-field">
          <label htmlFor="create-event-snacks">Snacks</label>
          <input
            id="create-event-snacks"
            type="text"
            value={snacks}
            onChange={(e) => setSnacks(e.target.value)}
            placeholder="e.g. Snacks provided, or BYO"
          />
        </div>

        <div className="create-event-actions">
          <button
            type="submit"
            className="create-event-submit"
            disabled={submitting}
            aria-disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create event'}
          </button>
        </div>
      </form>
    </main>
  )
}
