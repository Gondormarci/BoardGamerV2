import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '../api/useApi'
import { getApiBase } from '../api/config'
import {
  getMyProfile,
  getUserProfile,
  updateMyProfile,
  type UserProfileResponse,
} from '../api/users'
import './ProfilePage.css'

const BIO_MAX = 2000

function StarRating({ value }: { value: number }) {
  if (value === 0) return <span>—</span>
  return <span>★ {value.toFixed(1)}</span>
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>()
  const isOwnProfile = userId === undefined

  const { fetchWithAuth } = useApi()
  const base = getApiBase()

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [bioInput, setBioInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    const data = isOwnProfile
      ? await getMyProfile(fetchWithAuth, base)
      : await getUserProfile(fetchWithAuth, base, userId)
    setLoading(false)
    if (!data) {
      setError(isOwnProfile ? 'Failed to load your profile.' : 'User not found.')
    }
    setProfile(data)
  }, [base, fetchWithAuth, isOwnProfile, userId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  function handleEditClick() {
    setBioInput(profile?.bio ?? '')
    setSaveError(null)
    setIsEditing(true)
  }

  function handleCancelClick() {
    setIsEditing(false)
    setSaveError(null)
  }

  async function handleSaveClick() {
    if (bioInput.length > BIO_MAX) return
    setSaving(true)
    setSaveError(null)
    const updated = await updateMyProfile(fetchWithAuth, base, { bio: bioInput })
    setSaving(false)
    if (!updated) {
      setSaveError('Failed to save. Please try again.')
      return
    }
    setProfile(updated)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="profile-page">
        <p className="profile-loading">Loading profile…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <p className="profile-not-found">{error ?? 'Profile not found.'}</p>
      </div>
    )
  }

  const charCount = bioInput.length
  const overLimit = charCount > BIO_MAX

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>{profile.username}</h1>
      </div>

      {error && <p className="profile-error">{error}</p>}

      <section className="profile-bio" aria-label="Bio">
        <h2>Bio</h2>
        {isEditing ? (
          <>
            <textarea
              className="profile-bio-textarea"
              value={bioInput}
              onChange={e => setBioInput(e.target.value)}
              maxLength={BIO_MAX + 1}
              aria-label="Edit bio"
            />
            <p className={`profile-bio-char-count${overLimit ? ' over-limit' : ''}`}>
              {charCount} / {BIO_MAX}
            </p>
            {saveError && <p className="profile-error">{saveError}</p>}
            <div className="profile-bio-actions">
              <button
                type="button"
                className="profile-btn profile-btn-primary"
                onClick={handleSaveClick}
                disabled={saving || overLimit}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="profile-btn profile-btn-secondary"
                onClick={handleCancelClick}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {profile.bio ? (
              <p className="profile-bio-text">{profile.bio}</p>
            ) : (
              <p className="profile-bio-empty">No bio yet.</p>
            )}
            {isOwnProfile && (
              <div className="profile-bio-actions">
                <button
                  type="button"
                  className="profile-btn profile-btn-secondary"
                  onClick={handleEditClick}
                >
                  Edit bio
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="profile-stats" aria-label="Event stats">
        <div className="profile-stat">
          <p className="profile-stat-label">Events Hosted</p>
          <p className="profile-stat-value">{profile.eventsHostedCount}</p>
        </div>
        <div className="profile-stat">
          <p className="profile-stat-label">Events Attended</p>
          <p className="profile-stat-value">{profile.eventsAttendedCount}</p>
        </div>
      </section>

      <section className="profile-ratings" aria-label="Ratings">
        <div className="profile-rating">
          <p className="profile-rating-label">Host Rating</p>
          <p className="profile-rating-value">
            <StarRating value={profile.hostRating} />
          </p>
          <p className="profile-rating-count">{profile.hostReviewCount} review{profile.hostReviewCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="profile-rating">
          <p className="profile-rating-label">Player Rating</p>
          <p className="profile-rating-value">
            <StarRating value={profile.playerRating} />
          </p>
          <p className="profile-rating-count">{profile.playerReviewCount} review{profile.playerReviewCount !== 1 ? 's' : ''}</p>
        </div>
      </section>
    </div>
  )
}
