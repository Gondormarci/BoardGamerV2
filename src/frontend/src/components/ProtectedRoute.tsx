import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'

export default function ProtectedRoute() {
  const { keycloak, initialized } = useKeycloak()
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        Loading…
      </div>
    )
  }

  if (!keycloak.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
