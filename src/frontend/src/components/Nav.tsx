import { NavLink } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'
import './Nav.css'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search Events' },
  { to: '/events/create', label: 'Host Event' },
  { to: '/my-events', label: 'My Events' },
  { to: '/profile', label: 'Profile' },
  { to: '/admin', label: 'Admin' },
]

export default function Nav() {
  const { keycloak, initialized } = useKeycloak()

  return (
    <nav className="nav" aria-label="Main navigation">
      <ul className="nav-list">
        {navItems.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              end={to === '/'}
            >
              {label}
            </NavLink>
          </li>
        ))}
        {initialized &&
          (keycloak.authenticated ? (
            <li key="logout">
              <button
                type="button"
                className="nav-link nav-button"
                onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
              >
                Logout
              </button>
            </li>
          ) : (
            <>
              <li key="login">
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Login
                </NavLink>
              </li>
              <li key="register">
                <NavLink
                  to="/register"
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  Register
                </NavLink>
              </li>
            </>
          ))}
      </ul>
    </nav>
  )
}
