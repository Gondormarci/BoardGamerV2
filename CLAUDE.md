# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BoardGamer V2 is a full-stack board game event platform. Players can create/join local events, chat in real time, and rate each other. The stack is ASP.NET Core 10 (backend) + React 19/Vite (frontend), authenticated via Keycloak OIDC, with PostgreSQL and real-time chat over SignalR.

## Commands

### Backend (src/backend/)

```bash
# Build
dotnet build

# Run API (HTTP on :5106, HTTPS on :7208)
dotnet run --project BoardGamer.Api

# Apply EF Core migrations
dotnet ef database update --project BoardGamer.Infrastructure --startup-project BoardGamer.Api

# Add a new migration
dotnet ef migrations add <MigrationName> --project BoardGamer.Infrastructure --startup-project BoardGamer.Api
```

### Frontend (src/frontend/)

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # tsc + vite build
npm run lint       # ESLint
npm run format     # Prettier (src/**/*.{ts,tsx,css})
```

### Local dev startup order

1. PostgreSQL running on localhost:5432
2. Keycloak running and reachable at the configured URL
3. `dotnet run --project BoardGamer.Api` (applies migrations automatically or run manually)
4. `npm run dev` in `src/frontend/`

## Configuration

**Frontend** — create `src/frontend/.env`:
```
VITE_API_URL=http://localhost:5106
VITE_KEYCLOAK_URL=https://<keycloak-host>
VITE_KEYCLOAK_REALM=boardgamer
VITE_KEYCLOAK_CLIENT_ID=boardgamer-spa
```

**Backend** — use .NET User Secrets (preferred) or `appsettings.Development.json`:
```bash
cd src/backend/BoardGamer.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=BoardGamer;Username=postgres;Password=..."
dotnet user-secrets set "Authentication:Keycloak:Authority" "https://<keycloak-host>/realms/boardgamer"
dotnet user-secrets set "Authentication:Keycloak:Audience" "boardgamer-api"
```

## Architecture

### Backend — Clean Architecture

```
BoardGamer.Api           → Controllers, SignalR hubs, middleware, DI wiring
BoardGamer.Application   → Use cases, service interfaces, DTOs
BoardGamer.Domain        → Entities, value objects, domain rules
BoardGamer.Infrastructure → EF Core DbContext, repositories, Identity/Keycloak glue
BoardGamer.Contracts     → Shared request/response DTOs (consumed by API and potentially clients)
```

Dependencies flow inward: `Api → Application → Domain ← Infrastructure`.

### Authentication & Authorization

- **Keycloak** is the sole identity provider (OIDC/OAuth2, PKCE flow).
- Backend validates JWTs via `Microsoft.AspNetCore.Authentication.JwtBearer`; `realm_access.roles` claim is mapped to `ClaimTypes.Role`.
- Roles: `guest`, `user`, `host`, `admin` — enforced via `[Authorize(Roles = "...")]` and named policies.
- On first login, `CurrentUserService` auto-creates a local `User` entity keyed by `KeycloakSubjectId`.
- Frontend uses `keycloak-js` + `@react-keycloak/web`; token is injected into every API call.

### Real-time Chat (SignalR)

- Hub: `EventChatHub` at `/hubs/eventchat` — participants join a SignalR group `event_{eventId}`.
- Auth: token is passed as a query-string parameter (`?access_token=...`) because browsers cannot send `Authorization` headers on WebSocket upgrades.
- Frontend hook: `useEventChat` (in `src/frontend/src/`) builds the `HubConnection`, handles reconnect, and exposes `messages[]`, `sendMessage`, and `connectionState`.

### Frontend Structure

- React Router v7 for routing; `@react-keycloak/web` wraps the app for auth context.
- API calls use the Keycloak access token as a Bearer header against `VITE_API_URL`.
- No state management library — component-local state and custom hooks.

### Database

PostgreSQL 15+ via EF Core 10 (Npgsql provider). Key tables: `Users`, `Events`, `EventParticipants`, `JoinRequests`, `Reviews`, `ChatMessages`, `BoardGames`, `EventGames`, `CookieConsent`.

## No Tests Yet

There are currently no test projects (backend or frontend). The solution has no xUnit/NUnit or Vitest/Jest setup.
