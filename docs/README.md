# BoardGamer Documentation

- **[TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)** — Technical architecture plan (ASP.NET Core, PostgreSQL, React, Keycloak, AWS, Terraform, GitHub Actions).
- **[JIRA_BACKLOG_KANBAN.md](JIRA_BACKLOG_KANBAN.md)** — Jira backlog: 3 epics (Frontend, Backend, Infra), detailed tasks with acceptance criteria for Kanban.
- **[diagrams/](diagrams/)** — Architecture diagrams (Mermaid):
  - [infrastructure-diagram.md](diagrams/infrastructure-diagram.md) — AWS infrastructure, network topology, CI/CD pipeline, authentication flow.
- **[infrastructure-diagram.md](infrastructure-diagram.md)** — Same diagrams at docs root (legacy).

Render Mermaid diagrams in GitHub, VS Code (Mermaid extension), or [mermaid.live](https://mermaid.live).

---

## Running the project locally

Detailed steps to run the backend API and the React frontend on your machine, including prerequisites, configuration, secrets, and dependencies.

### 1. Prerequisites

Install the following and ensure they are on your `PATH`:

| Requirement | Version / notes | Check command |
|-------------|-----------------|---------------|
| **.NET SDK** | 10.0 (backend is `net10.0`) | `dotnet --version` |
| **Node.js** | 20.x LTS or 22.x (for frontend) | `node --version` |
| **npm** | Bundled with Node | `npm --version` |
| **PostgreSQL** | 15+ (for backend database) | `psql --version` |
| **Keycloak** | 26+ (or compatible OIDC server for auth) | Run via Docker or standalone |

- **.NET 10**: [Download](https://dotnet.microsoft.com/download) or install via your package manager.
- **Node**: [nodejs.org](https://nodejs.org/) or use `nvm` / `fnm`.
- **PostgreSQL**: [postgresql.org](https://www.postgresql.org/download/) or use Docker (e.g. `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`).
- **Keycloak**: Use [Docker](https://www.keycloak.org/server/containers) or [standalone](https://www.keycloak.org/server/installation). For local dev, a single Keycloak instance with a realm and client is enough.

---

### 2. Repository layout

```
BoardGamerV2/
├── src/
│   ├── backend/          # ASP.NET Core API (.NET 10)
│   │   ├── BoardGamer.Api/
│   │   ├── BoardGamer.Application/
│   │   ├── BoardGamer.Domain/
│   │   ├── BoardGamer.Infrastructure/
│   │   └── BoardGamer.Contracts/
│   └── frontend/         # React (Vite + TypeScript)
├── docs/
└── ...
```

---

### 3. Configuration and secrets

#### 3.1 Backend (API)

The API reads configuration from:

- **appsettings.json** (committed) — default values and structure.
- **appsettings.Development.json** (optional overrides for dev).
- **Environment variables** — override any config key (e.g. `ConnectionStrings__DefaultConnection`, `Authentication__Keycloak__Authority`).
- **User Secrets** (recommended for local dev) — override without committing secrets.

**Required settings:**

| Key | Description | Example (do not commit real secrets) |
|-----|-------------|--------------------------------------|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string | `Host=localhost;Database=BoardGamer;Username=postgres;Password=yourpassword` |
| `Authentication:Keycloak:Authority` | Keycloak realm URL (issuer) | `https://localhost:8443/realms/boardgamer` |
| `Authentication:Keycloak:Audience` | Expected JWT audience | `boardgamer-api` |

**Using User Secrets (recommended):**

From the repo root:

```bash
cd src/backend/BoardGamer.Api
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=BoardGamer;Username=postgres;Password=YOUR_DB_PASSWORD"
dotnet user-secrets set "Authentication:Keycloak:Authority" "https://YOUR_KEYCLOAK_URL/realms/boardgamer"
dotnet user-secrets set "Authentication:Keycloak:Audience" "boardgamer-api"
```

Alternatively, set the same keys in **appsettings.Development.json** and ensure that file is in **.gitignore** (so secrets are not committed).

**Optional:** To call the API from the frontend dev server, you may need to enable CORS in `Program.cs` for your frontend origin (e.g. `http://localhost:5173`).

#### 3.2 Frontend

The frontend uses **Vite** and reads environment variables prefixed with `VITE_`. These are embedded at build time.

**Required file:** `src/frontend/.env` (create from `.env.example`; do not commit `.env` if it contains real URLs/secrets).

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_KEYCLOAK_URL` | Keycloak base URL | `https://localhost:8443` |
| `VITE_KEYCLOAK_REALM` | Realm name | `boardgamer` |
| `VITE_KEYCLOAK_CLIENT_ID` | Public client id for the SPA | `boardgamer-spa` |

**Create `.env`:**

```bash
cd src/frontend
cp .env.example .env
# Edit .env and set your Keycloak URL, realm, and client id.
```

**Keycloak client (SPA) setup:**

- Client type: **public**.
- Enable **PKCE** (e.g. PKCE method S256).
- **Valid redirect URIs**: include `http://localhost:5173/*` (Vite dev server).
- **Web origins**: include `http://localhost:5173` (or your frontend origin).

---

### 4. Dependencies

#### 4.1 Backend

Restore NuGet packages and build:

```bash
cd src/backend
dotnet restore
dotnet build
```

No extra global tools are required if you use the SDK’s `ef` CLI (EF Core 10 includes it).

#### 4.2 Frontend

Install npm dependencies:

```bash
cd src/frontend
npm install
```

---

### 5. Database

1. **Create the database** (if it does not exist):

   ```bash
   psql -U postgres -c "CREATE DATABASE \"BoardGamer\";"
   ```

   Or use pgAdmin / another client to create a database named `BoardGamer`.

2. **Apply migrations** (from repo root or backend folder):

   ```bash
   cd src/backend
   dotnet ef database update --project BoardGamer.Infrastructure --startup-project BoardGamer.Api
   ```

   Ensure `ConnectionStrings:DefaultConnection` in User Secrets or appsettings points to this database.

3. **Verify:** Start the API (see below); the health endpoint should respond, and the API should connect to PostgreSQL without migration errors.

---

### 6. Run the application locally

#### 6.1 Backend (API)

From the backend solution directory:

```bash
cd src/backend
dotnet run --project BoardGamer.Api
```

Or from the API project:

```bash
cd src/backend/BoardGamer.Api
dotnet run
```

- **HTTP:** Default profile uses `http://localhost:5106` (see `Properties/launchSettings.json`).
- **HTTPS:** Use the `https` launch profile if configured (e.g. `dotnet run --launch-profile https`).

**Check:** Open `http://localhost:5106/health` or `http://localhost:5106/swagger` (if Swagger is enabled).

#### 6.2 Frontend (React SPA)

In a separate terminal:

```bash
cd src/frontend
npm run dev
```

- Vite dev server runs at **http://localhost:5173** by default.
- The app will use the Keycloak URL, realm, and client id from `src/frontend/.env`.

#### 6.3 Keycloak

- Keycloak must be running and reachable at the URL you set in:
  - Backend: `Authentication:Keycloak:Authority`
  - Frontend: `VITE_KEYCLOAK_URL`
- Realm and client (including redirect URIs and PKCE) must be configured as described in **§3.2**.

---

### 7. Quick reference

| Step | Command / action |
|------|------------------|
| Backend dependencies | `cd src/backend && dotnet restore` |
| Backend build | `cd src/backend && dotnet build` |
| Backend config (secrets) | `cd src/backend/BoardGamer.Api && dotnet user-secrets set "..." "..."` |
| Database update | `cd src/backend && dotnet ef database update --project BoardGamer.Infrastructure --startup-project BoardGamer.Api` |
| Run API | `cd src/backend && dotnet run --project BoardGamer.Api` |
| Frontend dependencies | `cd src/frontend && npm install` |
| Frontend config | Copy `src/frontend/.env.example` to `src/frontend/.env` and set Keycloak values |
| Run frontend | `cd src/frontend && npm run dev` |
| Frontend build (production) | `cd src/frontend && npm run build` |
| Lint frontend | `cd src/frontend && npm run lint` |

---

### 8. Troubleshooting

- **API fails to start (DB):** Check `ConnectionStrings:DefaultConnection` and that PostgreSQL is running and the `BoardGamer` database exists. Run migrations if the schema is missing.
- **API 401 on protected endpoints:** Ensure `Authentication:Keycloak:Authority` and `Audience` match your Keycloak realm and client. Use a valid JWT from Keycloak (e.g. obtained via the frontend login).
- **Frontend login redirect fails:** Confirm Keycloak client has `http://localhost:5173/*` in Valid redirect URIs and PKCE is enabled.
- **CORS errors:** If the browser blocks requests from the frontend to the API, add and configure CORS in `BoardGamer.Api/Program.cs` to allow your frontend origin (e.g. `http://localhost:5173`).
