import { Link } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'

export default function LoginPage() {
  const { keycloak } = useKeycloak()

  const handleForgotPassword = () => {
    keycloak.login({ action: 'reset-credentials' })
  }

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in to access your events and profile.</p>
      <button type="button" onClick={() => keycloak.login()}>
        Log in
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
        <Link to="/register">Create an account</Link>
      </p>
    </main>
  )
}
