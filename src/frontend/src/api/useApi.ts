import { useCallback } from 'react'
import { useKeycloak } from '@react-keycloak/web'

/**
 * Hook that returns a fetch function which adds the Bearer token and redirects to login on 401.
 * Use for all API requests to the backend.
 */
export function useApi() {
  const { keycloak } = useKeycloak()

  const fetchWithAuth = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const token = keycloak.token
      const headers = new Headers(init?.headers)
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      const response = await fetch(input, { ...init, headers })
      if (response.status === 401) {
        keycloak.login()
        return response
      }
      return response
    },
    [keycloak]
  )

  return { fetchWithAuth }
}
