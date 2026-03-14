# BoardGamer — Jira Backlog (Kanban)

Detailed tasks with acceptance criteria for implementing the PRD and Technical Architecture. Use this to create Epics, Stories, and Tasks in Jira and move them across Kanban columns (To Do → In Progress → Done).

**References:** PRD, [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)

---

## Epic 1: Frontend

**Epic name:** BoardGamer React Frontend  
**Summary:** React SPA (TypeScript, Vite) with Keycloak auth, event discovery, hosting, chat, reviews, and GDPR-compliant UI.

---

### Story FE-1: Application shell and routing

**As a** user **I want** a single-page app with consistent layout and navigation **so that** I can move between main areas (Home, Search, Host, My Events, Profile).

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-1.1 | Create React + TypeScript + Vite project | • Project created under `src/frontend`<br>• TypeScript strict mode enabled<br>• ESLint + Prettier configured |
| FE-1.2 | Configure React Router v6 | • Routes defined for: `/`, `/search`, `/events/:id`, `/events/create`, `/my-events`, `/profile`, `/login`, `/register`, `/admin/*`<br>• 404 route present |
| FE-1.3 | Implement main navigation bar | • Nav shows: Home, Search Events, Host Event, My Events, Profile, Admin (conditional), Login/Logout<br>• Active route visually indicated<br>• Responsive (mobile-friendly) |
| FE-1.4 | Add layout component (header + outlet) | • Shared layout wraps all main pages<br>• Footer with links to Privacy Policy and Cookie Policy |

---

### Story FE-2: Authentication (Keycloak integration)

**As a** user **I want** to log in and register via Keycloak **so that** I can access protected features with a secure identity.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-2.1 | Integrate Keycloak JS adapter | • `keycloak-js` or `@react-keycloak/web` installed and configured<br>• Realm URL, client ID, redirect URIs from env |
| FE-2.2 | Implement login flow (PKCE) | • Unauthenticated user can trigger login; redirects to Keycloak and returns with tokens<br>• Access token stored in memory (no long-lived secrets in storage) |
| FE-2.3 | Implement logout | • Logout clears tokens and redirects to Keycloak logout then back to app home |
| FE-2.4 | Protected route wrapper | • Routes for Create Event, My Events, Profile require auth; redirect to login if not authenticated |
| FE-2.5 | HTTP client with Bearer token | • All API requests include `Authorization: Bearer <token>`<br>• On 401, refresh token or redirect to login |
| FE-2.6 | Login page | • Login page at `/login` with “Log in” CTA that triggers Keycloak login |

---

### Story FE-3: Registration and consent

**As a** new user **I want** to register and accept GDPR and cookie policies **so that** I can use the platform in a compliant way.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-3.1 | Registration page | • Page at `/register`; fields: Username, Email, Password (or use Keycloak registration if applicable)<br>• Links to Privacy Policy and Cookie Policy |
| FE-3.2 | GDPR and cookie consent at registration | • Checkboxes or explicit “I accept” for GDPR policy and Cookie policy<br>• Registration cannot be submitted without acceptance |
| FE-3.3 | Password reset link | • Link to “Forgot password” that directs to Keycloak password reset flow |

---

### Story FE-4: Home page

**As a** visitor **I want** a clear home page **so that** I understand the platform and can find or host events.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-4.1 | Home page content | • Platform description (what BoardGamer does)<br>• Featured or upcoming events section (if API available) |
| FE-4.2 | Home page CTAs | • “Find Events” → `/search`<br>• “Host a Game” → `/events/create` (or login if not authenticated) |

---

### Story FE-5: Event search page

**As a** user **I want** to search events with filters **so that** I can find games near me that match my preferences.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-5.1 | Search filters UI | • Filters: Location, Board game name, Date/time range, Number of players needed, Host rating, Distance radius<br>• “Search” button triggers request to `GET /api/v1/events` with query params |
| FE-5.2 | Event results list | • Results displayed as cards/list<br>• Each card shows: Event title, Board game(s), Date/time, Location, Host name, Average host rating, Number of reviews, Available player slots |
| FE-5.3 | Sorting options | • User can sort results by date, distance, host rating (as per API support) |
| FE-5.4 | Empty and loading states | • Loading indicator while fetching<br>• Empty state when no results |

---

### Story FE-6: Event details page

**As a** user **I want** to see full event information and actions **so that** I can decide to join and interact with participants.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-6.1 | Event information section | • Displays: Event title, Board game(s), Host, Date/time, Location, Description, Player list, Remaining slots |
| FE-6.2 | Request to join button | • “Request to Join” visible to authenticated users who are not participants<br>• Calls `POST /api/v1/events/{id}/join-requests`<br>• Shows pending state after request |
| FE-6.3 | Leave event button | • “Leave event” for current participant (non-host); calls appropriate API |
| FE-6.4 | Host information | • Host name and host rating (and review count) displayed |

---

### Story FE-7: Create event page

**As a** host **I want** to create a new event **so that** others can find and join my game.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-7.1 | Create event form | • Required fields: Event title, Board game(s), Location, Date & time, Min players, Max players, Description<br>• Optional: Additional notes, Equipment, Snacks |
| FE-7.2 | Form validation | • Client-side validation; required fields enforced; date in future |
| FE-7.3 | Submit and redirect | • On submit: `POST /api/v1/events` with payload<br>• On success: redirect to event details or My Events |

---

### Story FE-8: My events page

**As a** user **I want** to see my hosted and joined events and pending requests **so that** I can manage my participation.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-8.1 | Hosted events section | • List of events created by the user; link to event detail and edit if supported |
| FE-8.2 | Joined events section | • List of events the user has joined |
| FE-8.3 | Pending join requests (for hosts) | • For each hosted event, show pending join requests with Approve/Reject<br>• Calls approve/reject API endpoints |

---

### Story FE-9: Event chat

**As a** participant **I want** to chat with other event participants **so that** we can coordinate (snacks, transport, rules).

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-9.1 | SignalR client setup | • `@microsoft/signalr` used; connection to hub with Bearer token<br>• Join group `event_{eventId}` when on event details page and user is participant |
| FE-9.2 | Chat UI on event details page | • Chat section visible only to event participants<br>• Message list and send input<br>• Messages displayed in near real-time (sent and received via SignalR) |
| FE-9.3 | Chat behaviour | • Messages show sender and timestamp<br>• No XSS: user content sanitized/escaped |

---

### Story FE-10: Profile page

**As a** user **I want** to view and edit my profile and see my ratings **so that** others can trust me and I can manage my identity.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-10.1 | View own profile | • Shows: Username, Bio, Host rating, Player rating, Events hosted count, Events attended count<br>• Data from `GET /api/v1/users/me` and/or public profile |
| FE-10.2 | Edit profile | • Form to update bio (and other editable fields); `PUT /api/v1/users/me` |
| FE-10.3 | Reviews received | • List of reviews received (from `GET /api/v1/users/me/reviews` or `/users/{id}/reviews`) with star rating and comment |
| FE-10.4 | Public profile view | • View other users’ profiles (e.g. from event detail or search); shows public info only (username, ratings, counts, reviews) |

---

### Story FE-11: Reviews and ratings UI

**As a** user **I want** to give and see reviews after events **so that** we can build trust.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-11.1 | Submit review (post-event) | • After an event, user can submit review: 1–5 stars + optional comment<br>• Target: host and/or other players as per API<br>• Calls `POST /api/v1/events/{id}/reviews` |
| FE-11.2 | Display ratings on search and profile | • Search result cards show host rating as e.g. “⭐ 4.6 (32 reviews)”<br>• Profile shows host rating and player rating with review count |

---

### Story FE-12: Cookie consent and policy pages

**As a** visitor **I want** to accept or reject cookies and read policies **so that** the app is GDPR and cookie-policy compliant.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-12.1 | Cookie consent banner | • Banner on first visit with Accept / Reject (or “Manage”)<br>• Preference stored (localStorage and/or sent to backend)<br>• Non-essential cookies only if accepted |
| FE-12.2 | Privacy policy page | • Dedicated page with privacy policy content; linked from footer and registration |
| FE-12.3 | Cookie policy page | • Dedicated page with cookie policy; linked from footer and registration |

---

### Story FE-13: Admin panel

**As an** admin **I want** to moderate events, users, and reviews **so that** the platform stays safe and accurate.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-13.1 | Admin route guard | • `/admin` and child routes only accessible to users with admin role<br>• Non-admins redirected or shown 403 |
| FE-13.2 | Admin dashboard | • List/search events; edit any event; delete any event<br>• List users; moderate (e.g. disable) as per API<br>• List reviews; remove inappropriate reviews as per API |
| FE-13.3 | Admin API integration | • All actions call corresponding ` /api/v1/admin/*` endpoints with auth |

---

### Story FE-14: GDPR — data export and account deletion (UI)

**As a** user **I want** to export my data and delete my account **so that** my rights under GDPR are met.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-14.1 | Data export | • Profile/settings section has “Export my data”<br>• Triggers `GET /api/v1/users/me/export`; user can download JSON (or file) |
| FE-14.2 | Account deletion | • “Delete my account” with confirmation (e.g. type “DELETE”)<br>• Calls `DELETE /api/v1/users/me`; on success, logout and redirect to home |

---

### Story FE-15: Accessibility and performance (NFRs)

**As a** user **I want** the app to be usable and fast **so that** I can use it comfortably.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| FE-15.1 | WCAG basics | • Semantic HTML; form labels; keyboard navigation works; focus visible<br>• Colour contrast meets basic WCAG level |
| FE-15.2 | Page load performance | • Initial load (or LCP) target &lt; 2 s on typical connection<br>• Code splitting / lazy loading for routes where applicable |

---

## Epic 2: Backend

**Epic name:** BoardGamer ASP.NET Core Backend  
**Summary:** REST API, Keycloak JWT auth, PostgreSQL persistence, SignalR chat, and admin/GDPR endpoints.

---

### Story BE-1: Solution and project structure

**As a** developer **I want** a clear .NET solution layout **so that** we can maintain API, domain, and infrastructure separately.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-1.1 | Create solution and projects | • Solution under `src/backend` with projects: BoardGamer.Api, BoardGamer.Application, BoardGamer.Domain, BoardGamer.Infrastructure, BoardGamer.Contracts |
| BE-1.2 | Project references | • Api → Application, Infrastructure, Contracts; Application → Domain, Contracts; Infrastructure → Application, Domain<br>• No circular references |
| BE-1.3 | API base setup | • ASP.NET Core 8 Web API; URL path versioning `/api/v1`; Swagger/OpenAPI for dev |

---

### Story BE-2: Database schema and migrations

**As a** developer **I want** PostgreSQL schema and EF Core migrations **so that** we have a single source of truth for the data model.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-2.1 | Domain entities | • Entities: User, Event, BoardGame, EventGame, JoinRequest, EventParticipant, Review; optional: ChatMessage, CookieConsent<br>• User: Id (UUID), KeycloakSubjectId, Username, Bio, CreatedAt, UpdatedAt<br>• Event: Id, Title, HostUserId, Location (address + lat/long), StartsAt, EndsAt, MinPlayers, MaxPlayers, Description, Status, etc. |
| BE-2.2 | EF Core DbContext and configurations | • DbContext in Infrastructure; entity configurations; relationships and indexes defined |
| BE-2.3 | Migrations | • Initial migration created; migrations runnable against PostgreSQL<br>• Indexes on StartsAt, HostUserId; optional PostGIS for location search |

---

### Story BE-3: Keycloak JWT authentication

**As a** service **I want** to validate Keycloak JWTs **so that** only authenticated users can call protected endpoints.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-3.1 | JWT Bearer configuration | • Use `Microsoft.AspNetCore.Authentication.JwtBearer`; validate issuer (Keycloak realm URL), audience, signature; load JWKS from Keycloak |
| BE-3.2 | Role-based authorization | • Policies for roles: User, Host, Admin; map Keycloak realm roles to claims<br>• `[Authorize]` and policy checks on controllers |
| BE-3.3 | User resolution | • Middleware or service resolves Keycloak `sub` to app User (create if first login); current user available in controllers |

---

### Story BE-4: User profile API

**As a** client **I want** to read and update user profiles **so that** the frontend can show and edit profile data.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-4.1 | GET /api/v1/users/me | • Returns current user profile (from Keycloak sub); includes Username, Bio, host/player rating aggregates, event counts<br>• 401 if not authenticated |
| BE-4.2 | GET /api/v1/users/{id} | • Returns public profile for any user: username, bio, host rating, player rating, review count, events hosted/attended counts<br>• 404 if user not found |
| BE-4.3 | PUT /api/v1/users/me | • Update current user (e.g. Bio); validate input; return updated profile<br>• 401 if not authenticated |

---

### Story BE-5: Events API (CRUD and search)

**As a** client **I want** to create, read, update, delete, and search events **so that** users can host and discover events.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-5.1 | POST /api/v1/events | • Create event; required: Title, HostUserId (from token), Location, StartsAt, EndsAt, MinPlayers, MaxPlayers, Description; optional: notes, games<br>• 201 with location and body |
| BE-5.2 | GET /api/v1/events/{id} | • Return event details including host, games, participants, slots; 404 if not found |
| BE-5.3 | PUT /api/v1/events/{id} | • Update event; allowed only for event owner or admin; same fields as create where applicable |
| BE-5.4 | DELETE /api/v1/events/{id} | • Delete event; allowed for owner (own) or admin (any); 204 or 200 |
| BE-5.5 | GET /api/v1/events (search) | • Query params: location (or lat/long + radius), game name, date from/to, min/max players, host rating min<br>• Paginated results; response includes list with event summary (title, game, date, location, host, host rating, review count, slots)<br>• Search responds in &lt; 1 s with proper indexes |

---

### Story BE-6: Join requests API

**As a** client **I want** to request to join events and for hosts to approve/reject **so that** event participation is controlled.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-6.1 | POST /api/v1/events/{id}/join-requests | • Create join request for current user; 400 if already participant or request exists; 404 if event not found |
| BE-6.2 | List join requests (for host) | • GET endpoint for pending join requests for an event (host or admin only); returns requester id, username, player rating, review count |
| BE-6.3 | Approve join request | • POST .../join-requests/{requestId}/approve; host or admin; add user to EventParticipants; update JoinRequest status |
| BE-6.4 | Reject join request | • POST .../join-requests/{requestId}/reject; host or admin; update JoinRequest status |

---

### Story BE-7: Reviews API

**As a** client **I want** to submit and read reviews **so that** trust and ratings work.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-7.1 | POST /api/v1/events/{id}/reviews | • Submit review: ReviewerUserId (from token), TargetUserId, RatingType (Host/Player), Rating (1–5), Comment optional<br>• Only participants of completed event can review; one review per (reviewer, target, event) |
| BE-7.2 | GET /api/v1/users/{id}/reviews | • List reviews for user (as target); paginated; includes rating, comment, reviewer, event, date |

---

### Story BE-8: GDPR — data export and account deletion

**As a** user **I want** to export my data and delete my account **so that** we comply with GDPR.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-8.1 | GET /api/v1/users/me/export | • Returns JSON (or file) with user profile, events (hosted/joined), reviews given/received; only for authenticated user |
| BE-8.2 | DELETE /api/v1/users/me | • Deletes or anonymizes user and related PII in app DB; optional: call Keycloak admin API to remove user<br>• Requires confirmation (e.g. passed in body); 204 on success |

---

### Story BE-9: SignalR event chat

**As a** participant **I want** real-time chat per event **so that** we can coordinate.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-9.1 | EventChatHub | • Hub with group `event_{eventId}`; on connect, verify user is participant (DB/cache); reject if not |
| BE-9.2 | Send message | • Client sends message; server broadcasts to group; optional: persist to ChatMessages table for moderation |
| BE-9.3 | Redis backplane (optional) | • If multiple instances, configure SignalR Redis backplane so all instances share groups |

---

### Story BE-10: Admin API

**As an** admin **I want** to moderate events, users, and reviews **so that** the platform is safe.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-10.1 | Admin authorization | • All admin routes require Admin role; 403 otherwise |
| BE-10.2 | Admin event actions | • Edit any event (PUT); delete any event (DELETE)<br>• List events with filter (optional) |
| BE-10.3 | Admin user moderation | • Endpoint(s) to list users, disable/ban user (as per product rules) |
| BE-10.4 | Admin review moderation | • Delete/hide inappropriate review by id; only admin |

---

### Story BE-11: Cookie consent and health

**As a** operator **I want** cookie consent stored and health checks **so that** we are compliant and observable.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-11.1 | Cookie consent endpoint | • POST/GET endpoint to store/retrieve user cookie consent (e.g. by user id + timestamp + type)<br>• Used by frontend to record Accept/Reject |
| BE-11.2 | Health checks | • `/health` or `/api/health` returns 200; optionally includes DB and Redis connectivity |

---

### Story BE-12: Logging and security hardening

**As a** operator **I want** structured logs and secure defaults **so that** we can operate and protect the API.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-12.1 | Structured logging | • Use ILogger; structured properties; log level configurable |
| BE-12.2 | Security headers and validation | • Input validation on all DTOs; parameterized queries only; CSP or security headers where applicable |

---

### Story BE-13: Unit and integration tests

**As a** developer **I want** tests for API and domain **so that** we can refactor safely.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| BE-13.1 | Unit tests | • Domain and application logic covered by unit tests (e.g. xUnit) |
| BE-13.2 | API integration tests | • Key endpoints (events, users, join requests, reviews) have integration tests (in-memory or test DB) |

---

## Epic 3: Infra

**Epic name:** BoardGamer AWS Infrastructure & CI/CD  
**Summary:** Terraform-managed AWS (VPC, RDS, ECS, ALB, Redis, secrets), Keycloak setup, and GitHub Actions for CI/CD in EU region.

---

### Story INF-1: Repository layout

**As a** developer **I want** a clear repo structure **so that** backend, frontend, and infra are separated.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-1.1 | Create folder structure | • `src/backend`, `src/frontend`, `infra/terraform`, `.github/workflows`, `docs` exist<br>• README at root describes layout |

---

### Story INF-2: Terraform — networking (VPC)

**As a** deployer **I want** VPC and subnets in AWS **so that** we can run ECS and RDS in a secure network.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-2.1 | VPC and subnets | • Terraform module or root: VPC in chosen EU region (e.g. eu-west-1)<br>• Public subnets (for ALB, NAT); private subnets (for ECS, RDS) |
| INF-2.2 | NAT and routing | • NAT Gateway in public subnet; private subnet route to NAT for outbound<br>• Internet-facing ALB in public subnet |

---

### Story INF-3: Terraform — RDS PostgreSQL

**As a** deployer **I want** PostgreSQL on RDS **so that** the API has a durable database.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-3.1 | RDS instance | • RDS PostgreSQL 15+ in private subnet(s)<br>• Multi-AZ for production environment |
| INF-3.2 | Security and secrets | • No public access; security group allows only ECS/API<br>• Master password in AWS Secrets Manager; referenced from Terraform without storing in state |

---

### Story INF-4: Terraform — ECS Fargate and ALB

**As a** deployer **I want** the API running on ECS behind an ALB **so that** the app is scalable and reachable via HTTPS.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-4.1 | ECS cluster and service | • ECS Fargate cluster; service running API container(s)<br>• Task definition: image from ECR; env/secrets from SSM or Secrets Manager; correct IAM role |
| INF-4.2 | Application Load Balancer | • ALB in public subnet; listener 443 (HTTPS); target group → ECS service<br>• ACM certificate attached (or created in Terraform) |
| INF-4.3 | API and SignalR on same service | • Single ECS service runs API + SignalR; path or port routing if needed (e.g. /hubs for SignalR) |

---

### Story INF-5: Terraform — ElastiCache Redis (optional)

**As a** deployer **I want** Redis for SignalR backplane (and optional cache) **so that** multiple API instances work.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-5.1 | ElastiCache Redis | • Redis cluster in private subnet; security group allows ECS only<br>• API configured to use Redis for SignalR backplane when deployed |

---

### Story INF-6: Terraform — state and secrets

**As a** deployer **I want** remote state and no secrets in code **so that** we can run Terraform safely in CI.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-6.1 | S3 + DynamoDB backend | • Terraform backend block: S3 bucket for state; DynamoDB for lock<br>• Bucket and table created (e.g. bootstrap script or separate tf) |
| INF-6.2 | Secrets Manager / SSM | • DB connection string or password from Secrets Manager; Keycloak client secret in SSM or Secrets Manager; no secrets in repo or state |

---

### Story INF-7: Keycloak setup

**As a** deployer **I want** Keycloak realm and client configured **so that** the app can use it for auth.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-7.1 | Keycloak deployment | • Keycloak run on ECS or external; realm `boardgamer` (or equivalent) created<br>• Documented in infra README |
| INF-7.2 | Client and roles | • Public or confidential client for SPA; PKCE enabled; redirect URIs set<br>• Roles: user, host, admin (and guest if needed) |
| INF-7.3 | User attributes | • Realm configured for username, email, preferred_username; registration enabled if used |

---

### Story INF-8: GitHub Actions — backend CI

**As a** developer **I want** backend CI on push/PR **so that** we catch build and test failures early.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-8.1 | Backend workflow | • Workflow on push/PR: checkout, setup .NET, restore, build, test<br>• Runs for changes under `src/backend` (or always) |

---

### Story INF-9: GitHub Actions — frontend CI

**As a** developer **I want** frontend CI on push/PR **so that** we catch lint and test failures early.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-9.1 | Frontend workflow | • Workflow on push/PR: checkout, setup Node, install, lint, build, test<br>• Runs for changes under `src/frontend` (or always) |

---

### Story INF-10: GitHub Actions — CD (build, push, deploy)

**As a** deployer **I want** CD to build images and deploy **so that** we can release to dev/staging/prod.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-10.1 | Build and push Docker image | • On merge to main (or tag): build API Docker image; push to ECR<br>• ECR repo created (Terraform or manual) |
| INF-10.2 | Terraform plan in CI | • Job runs `terraform plan`; output visible in Actions (no apply in PR) |
| INF-10.3 | Terraform apply (dev/staging) | • On merge to develop (or main): optional auto `terraform apply` for dev environment |
| INF-10.4 | Terraform apply (prod) | • Prod apply with manual approval; then update ECS service to new image tag |

---

### Story INF-11: DNS and HTTPS

**As a** user **I want** the app on a stable URL with HTTPS **so that** it is secure and findable.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-11.1 | Route53 and ACM | • Route53 hosted zone (or delegated); A/AAAA alias record to ALB<br>• ACM certificate for domain; attached to ALB 443 listener |
| INF-11.2 | HTTPS only | • HTTP redirects to HTTPS; TLS 1.2+ |

---

### Story INF-12: EU region and documentation

**As a** stakeholder **I want** resources in EU and documented **so that** we meet data residency and audit needs.

| Task | Description | Acceptance criteria |
|------|-------------|---------------------|
| INF-12.1 | Region verification | • All Terraform resources (RDS, ECS, S3, etc.) use EU region (e.g. eu-west-1)<br>• Documented in architecture and infra README |
| INF-12.2 | Infra README | • `infra/terraform/README.md` describes how to run plan/apply, required variables, and state backend |

---

## Kanban column mapping

Use these as column names on the board; each Story or Task can move through them:

| Column | Description |
|--------|-------------|
| **Backlog** | Not yet started; refined and estimated |
| **To Do** | Ready for development; assigned |
| **In Progress** | Actively being worked on |
| **Code Review** | (Optional) PR open or under review |
| **Done** | Implemented, tested, and merged (or deployed for deploy tasks) |

---

## Dependency hints (for ordering)

- **Infra:** INF-1 → INF-2, INF-3, INF-6 → INF-4, INF-5 → INF-7, INF-11, INF-12; INF-8, INF-9, INF-10 can run in parallel after repo layout.
- **Backend:** BE-1 → BE-2 → BE-3; BE-4–BE-8 depend on BE-2, BE-3; BE-9 (SignalR) after BE-3; BE-10, BE-11, BE-12, BE-13 can be parallelised once core API is in place.
- **Frontend:** FE-1, FE-2 first; FE-3–FE-4 next; FE-5–FE-8 (events) after backend events API; FE-9 after BE-9; FE-10–FE-14 after corresponding backend; FE-15 anytime.

---

*Document version: 1.0. Update when PRD or architecture changes.*
