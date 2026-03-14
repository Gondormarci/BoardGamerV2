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
