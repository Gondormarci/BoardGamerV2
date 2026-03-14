import { useKeycloak } from '@react-keycloak/web'

export default function LoginPage() {
  const { keycloak } = useKeycloak()

  return (
    <main>
      <h1>Login</h1>
      <p>Sign in to access your events and profile.</p>
      <button type="button" onClick={() => keycloak.login()}>
        Log in
      </button>
    </main>
  )
}
