import type { AuthFetch } from './events'

export interface UserProfileResponse {
  id: string
  username: string
  bio?: string
  hostRating: number
  hostReviewCount: number
  playerRating: number
  playerReviewCount: number
  eventsHostedCount: number
  eventsAttendedCount: number
}

export interface UpdateMyProfileRequest {
  bio?: string
}

export async function getMyProfile(
  fetchWithAuth: AuthFetch,
  base: string
): Promise<UserProfileResponse | null> {
  if (!base) return null
  try {
    const res = await fetchWithAuth(`${base}/api/v1/users/me`)
    if (!res.ok) return null
    return (await res.json()) as UserProfileResponse
  } catch (err) {
    console.error('getMyProfile failed', err)
    return null
  }
}

export async function getUserProfile(
  fetchWithAuth: AuthFetch,
  base: string,
  userId: string
): Promise<UserProfileResponse | null> {
  if (!base) return null
  try {
    const res = await fetchWithAuth(`${base}/api/v1/users/${encodeURIComponent(userId)}`)
    if (res.status === 404) return null
    if (!res.ok) return null
    return (await res.json()) as UserProfileResponse
  } catch (err) {
    console.error('getUserProfile failed', { userId, err })
    return null
  }
}

export async function updateMyProfile(
  fetchWithAuth: AuthFetch,
  base: string,
  data: UpdateMyProfileRequest
): Promise<UserProfileResponse | null> {
  if (!base) return null
  try {
    const res = await fetchWithAuth(`${base}/api/v1/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    return (await res.json()) as UserProfileResponse
  } catch (err) {
    console.error('updateMyProfile failed', err)
    return null
  }
}
