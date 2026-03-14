import { NavLink } from 'react-router-dom'
import './Nav.css'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search Events' },
  { to: '/events/create', label: 'Host Event' },
  { to: '/my-events', label: 'My Events' },
  { to: '/profile', label: 'Profile' },
  { to: '/admin', label: 'Admin' },
]
const authItems = [
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
]

export default function Nav() {
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
        {authItems.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
