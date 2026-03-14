/**
 * Event summary returned by GET /api/v1/events (search).
 * Aligned with BE-5.5 contract.
 */
export interface EventSummary {
  id: string
  title: string
  boardGameNames?: string[]
  startsAt: string
  endsAt?: string
  location?: string
  hostName?: string
  hostRating?: number
  reviewCount?: number
  minPlayers?: number
  maxPlayers?: number
  availableSlots?: number
}

export interface EventSearchParams {
  location?: string
  gameName?: string
  dateFrom?: string
  dateTo?: string
  minPlayers?: number
  maxPlayers?: number
  hostRatingMin?: number
  latitude?: number
  longitude?: number
  radiusKm?: number
  sortBy?: 'date' | 'distance' | 'hostRating'
  page?: number
  pageSize?: number
}

export function buildEventsSearchQuery(params: EventSearchParams): string {
  const searchParams = new URLSearchParams()
  if (params.location !== undefined && params.location !== '')
    searchParams.set('location', params.location)
  if (params.gameName !== undefined && params.gameName !== '')
    searchParams.set('gameName', params.gameName)
  if (params.dateFrom !== undefined && params.dateFrom !== '')
    searchParams.set('dateFrom', params.dateFrom)
  if (params.dateTo !== undefined && params.dateTo !== '')
    searchParams.set('dateTo', params.dateTo)
  if (params.minPlayers !== undefined)
    searchParams.set('minPlayers', String(params.minPlayers))
  if (params.maxPlayers !== undefined)
    searchParams.set('maxPlayers', String(params.maxPlayers))
  if (params.hostRatingMin !== undefined)
    searchParams.set('hostRatingMin', String(params.hostRatingMin))
  if (params.latitude !== undefined)
    searchParams.set('latitude', String(params.latitude))
  if (params.longitude !== undefined)
    searchParams.set('longitude', String(params.longitude))
  if (params.radiusKm !== undefined)
    searchParams.set('radiusKm', String(params.radiusKm))
  if (params.sortBy !== undefined)
    searchParams.set('sortBy', params.sortBy)
  if (params.page !== undefined)
    searchParams.set('page', String(params.page))
  if (params.pageSize !== undefined)
    searchParams.set('pageSize', String(params.pageSize))
  return searchParams.toString()
}

/**
 * Event details returned by GET /api/v1/events/{id}.
 * Aligned with BE-5.2 contract.
 */
export interface EventDetail {
  id: string
  title: string
  boardGameNames?: string[]
  hostUserId: string
  hostName?: string
  hostRating?: number
  reviewCount?: number
  startsAt: string
  endsAt?: string
  location?: string
  description?: string
  minPlayers?: number
  maxPlayers?: number
  availableSlots?: number
  participantNames?: string[]
  isCurrentUserParticipant?: boolean
  isCurrentUserHost?: boolean
  hasCurrentUserPendingJoinRequest?: boolean
}

export type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

/**
 * Fetch event details by id. Returns null on 404 or network error.
 */
export async function getEventDetail(
  baseUrl: string,
  fetchWithAuth: AuthFetch,
  eventId: string
): Promise<EventDetail | null> {
  if (!baseUrl) return null
  try {
    const res = await fetchWithAuth(`${baseUrl}/api/v1/events/${encodeURIComponent(eventId)}`)
    if (res.status === 404) return null
    if (!res.ok) return null
    return (await res.json()) as EventDetail
  } catch {
    return null
  }
}

/**
 * Request to join an event. Returns true if request was created (201) or already pending (400 with existing request).
 */
export async function postJoinRequest(
  baseUrl: string,
  fetchWithAuth: AuthFetch,
  eventId: string
): Promise<{ success: boolean; alreadyParticipant?: boolean; alreadyPending?: boolean }> {
  if (!baseUrl) return { success: false }
  try {
    const res = await fetchWithAuth(`${baseUrl}/api/v1/events/${encodeURIComponent(eventId)}/join-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.status === 201) return { success: true }
    if (res.status === 400) {
      const body = await res.json().catch(() => ({})) as { message?: string }
      const msg = (body.message ?? '').toLowerCase()
      return {
        success: false,
        alreadyParticipant: msg.includes('participant') || msg.includes('already joined'),
        alreadyPending: msg.includes('pending') || msg.includes('request'),
      }
    }
    return { success: false }
  } catch {
    return { success: false }
  }
}

/**
 * Leave an event (current user as non-host participant). Calls DELETE /api/v1/events/{id}/participants/me.
 */
export async function leaveEvent(
  baseUrl: string,
  fetchWithAuth: AuthFetch,
  eventId: string
): Promise<boolean> {
  if (!baseUrl) return false
  try {
    const res = await fetchWithAuth(
      `${baseUrl}/api/v1/events/${encodeURIComponent(eventId)}/participants/me`,
      { method: 'DELETE' }
    )
    return res.status === 204 || res.status === 200
  } catch {
    return false
  }
}
