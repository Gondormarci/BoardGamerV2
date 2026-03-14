import { Outlet, Link } from 'react-router-dom'
import Nav from './Nav'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout-header">
        <Nav />
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
      <footer className="layout-footer">
        <Link to="/privacy">Privacy Policy</Link>
        <span aria-hidden="true"> · </span>
        <Link to="/cookies">Cookie Policy</Link>
      </footer>
    </div>
  )
}
