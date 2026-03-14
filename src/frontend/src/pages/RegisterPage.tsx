import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'

export default function RegisterPage() {
  const { keycloak } = useKeycloak()
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [acceptCookies, setAcceptCookies] = useState(false)

  const canRegister = acceptPrivacy && acceptCookies

  const handleRegister = () => {
    if (!canRegister) return
    keycloak.register()
  }

  const handleForgotPassword = () => {
    keycloak.login({ action: 'reset-credentials' })
  }

  return (
    <main>
      <h1>Register</h1>
      <p>
        Create an account to host and join board game events. By registering you
        agree to our policies.
      </p>
      <p>
        <Link to="/privacy">Privacy Policy</Link>
        {' · '}
        <Link to="/cookies">Cookie Policy</Link>
      </p>
      <div className="consent-checkboxes">
        <label>
          <input
            type="checkbox"
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
            aria-describedby="privacy-desc"
          />
          <span id="privacy-desc">I accept the Privacy Policy</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={acceptCookies}
            onChange={(e) => setAcceptCookies(e.target.checked)}
            aria-describedby="cookies-desc"
          />
          <span id="cookies-desc">I accept the Cookie Policy</span>
        </label>
      </div>
      <button
        type="button"
        onClick={handleRegister}
        disabled={!canRegister}
        aria-disabled={!canRegister}
      >
        Register
      </button>
      <p className="forgot-password">
        <button
          type="button"
          className="link-button"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </button>
      </p>
      <p>
        <Link to="/login">Already have an account? Log in</Link>
      </p>
    </main>
  )
}
