import { Link } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <h1>BoardGamer</h1>
        <p className="home-tagline">
          Find and host in-person board game events near you. Discover local
          game nights, join as a player, or host your own and build your
          community.
        </p>
        <div className="home-ctas">
          <Link to="/search" className="home-cta home-cta-primary">
            Find Events
          </Link>
          <Link to="/events/create" className="home-cta home-cta-secondary">
            Host a Game
          </Link>
        </div>
        <p className="home-cta-hint">
          You’ll need to log in to host an event. New?{' '}
          <Link to="/register">Create an account</Link>.
        </p>
      </section>
      <section className="home-events" aria-labelledby="upcoming-events-heading">
        <h2 id="upcoming-events-heading">Upcoming events</h2>
        <p className="home-events-placeholder">
          Events will appear here once search is available. For now, use{' '}
          <Link to="/search">Find Events</Link> to explore.
        </p>
      </section>
    </div>
  )
}
