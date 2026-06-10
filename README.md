# The Flock

The Flock is a full-stack Twitter/X-inspired social application built as a technical challenge submission. It includes authentication, tweet publishing, timeline consumption, likes, profile browsing, follow relationships, realistic seed data, automated tests, and Dockerized local development.

The project is structured so a reviewer can clone it, run one command, sign in with seeded users, and validate the main flows in a few minutes.

## Project Overview

- Monorepo with separate API and web applications
- Docker Compose local environment with PostgreSQL
- Database-backed backend with Prisma
- Responsive frontend with authenticated social flows
- Unit, integration, and end-to-end coverage

## Quick Evaluation Path

For evaluators:

1. `git clone <repo-url>`
2. `cd twitter-clone-theflock`
3. `cp .env.example .env`
4. `npm run setup`
5. Open [http://localhost:5173](http://localhost:5173)
6. Login with:
   - `demo@example.com`
   - `Password123!`
7. Run:
   - `npm run verify`
8. Optional E2E:
   - `npm run test:e2e`

To start the application:

```bash
npm run setup
```

## Tech Stack

- Frontend: React 19, Vite, React Router, TanStack Query, Tailwind CSS
- Backend: Node.js, TypeScript, Express
- Database: PostgreSQL 16
- ORM: Prisma
- Authentication: JWT
- Testing:
  - Backend: Vitest + Supertest
  - Frontend: Vitest + React Testing Library
  - E2E: Playwright
- Infrastructure: Docker Compose

## Architecture Overview

The repository is organized as a monorepo:

- `apps/api`
  - Express API
  - Prisma schema, migrations, and seed script
  - Domain-oriented modules for auth, tweets, timeline, likes, follows, profiles, and search
- `apps/web`
  - React single-page application
  - Route-based UI for login, register, home timeline, search, profiles, and follower/following lists
- `e2e`
  - Playwright test suites for authenticated end-to-end flows
- `scripts`
  - Project-level automation helpers such as combined coverage reporting

At runtime:

1. `web` talks to `api` over HTTP
2. `api` persists state in PostgreSQL through Prisma
3. Docker Compose runs the full stack locally

## Main Features

- Register, login, logout, and current-session loading
- JWT-protected authenticated routes
- Tweet creation and deletion
- Timeline feed from followed accounts
- Like and unlike interactions
- Public user search
- Public profiles with follower/following/tweet counts
- Follow and unfollow from profile, search, and list contexts
- Followers and following pages
- Realistic seed data for demo and manual review

## Prerequisites

Required for the standard evaluation path:

- Docker
- Docker Compose
- Git

Optional:

- Node.js 20+
- npm

Node.js is only required if you want to run commands directly on the host instead of through Docker, for example local linting, local test runs, or Playwright outside containers.

## Ports

The project uses these Docker Compose ports by default:

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000](http://localhost:3000)
- Health endpoint: [http://localhost:3000/health](http://localhost:3000/health)
- PostgreSQL: `5432`

These values are sourced from `docker-compose.yml` and `.env.example`:

- `WEB_PORT=5173`
- `API_PORT=3000`
- `POSTGRES_PORT=5432`

## Quick Start

1. Clone the repository:

```bash
git clone <repo-url>
cd twitter-clone-theflock
```

2. Copy the environment file:

```bash
cp .env.example .env
```

3. Start everything and seed the database:

```bash
npm run setup
```

4. Open the app:

```text
http://localhost:5173
```

5. Sign in with a seeded account:

```text
demo@example.com
Password123!
```

## Runbook

### Standard Evaluator Flow

```bash
cp .env.example .env
npm run setup
npm run verify
```

### What `npm run setup` Does

`npm run setup` performs the full local bootstrap:

1. Starts PostgreSQL
2. Runs Prisma generate
3. Applies committed migrations
4. Seeds the database
5. Builds and starts the full stack in Docker Compose
6. Leaves the web container ready for Playwright-based verification

After it finishes, the application is ready to use.

### What `npm run verify` Does

`npm run verify` runs the primary submission verification workflow against the running Docker stack:

1. Backend tests
2. Backend coverage
3. Frontend tests
4. Frontend build

`npm run verify` assumes the stack is already running, typically after `npm run setup`.

E2E is intentionally kept as a separate command so reviewers can run functional end-to-end validation independently from the faster verification pass.

## Environment Variables

Environment variables are defined in the root `.env` file.

### Database

- `POSTGRES_DB`
  - Database name
- `POSTGRES_USER`
  - PostgreSQL user
- `POSTGRES_PASSWORD`
  - PostgreSQL password
- `POSTGRES_PORT`
  - Exposed PostgreSQL port on the host

### Backend

- `API_PORT`
  - Port exposed by the API container
- `DATABASE_URL`
  - Prisma/PostgreSQL connection string used by the API
- `JWT_SECRET`
  - Secret used to sign and verify JWTs
- `JWT_EXPIRES_IN`
  - Token expiration window
- `WEB_ORIGIN`
  - Allowed frontend origin for CORS

### Frontend

- `WEB_PORT`
  - Port exposed by the Vite dev server
- `VITE_API_URL`
  - Public API base URL consumed by the frontend
- `VITE_API_URL_DOCKER`
  - Internal API base URL used when Playwright runs inside the `web` container

### Default Example Values

See [.env.example](/Users/kevinderitis/Documents/Proyectos/twitter-clone-theflock/.env.example:1).

## Database Setup

The API uses Prisma migrations and a PostgreSQL database.

Automatic path:

```bash
npm run setup
```

Manual path:

```bash
docker compose up --build -d db
docker compose exec api npm run db:migrate --workspace api
docker compose exec api npm run db:seed --workspace api
docker compose up --build -d
```

## Seed Data

The project ships with deterministic demo data intended for:

- quick product evaluation
- realistic manual QA
- stable authenticated E2E flows

Seed characteristics:

- 12+ demo users
- realistic tweets across multiple days
- follow graph with no isolated users
- varied like counts

Seeded demo accounts:

```text
demo@example.com
Password123!

kevin@example.com
Password123!
```

## Testing

### Root Commands

- `npm run test`
- `npm run test:coverage`
- `npm run verify`

### Backend

Run backend tests locally on the host:

```bash
npm run test --workspace api
```

Run backend coverage locally on the host:

```bash
npm run test:coverage --workspace api
```

Run backend tests inside Docker:

```bash
docker compose exec api npm test --workspace api
```

Run backend coverage inside Docker:

```bash
docker compose exec api npm run test:coverage --workspace api
```

Current backend coverage target status:

- General backend line coverage is above 80%

### Frontend

Run frontend tests locally on the host:

```bash
npm run test --workspace web
```

Run frontend coverage locally on the host:

```bash
npm run test:coverage --workspace web
```

Run frontend tests inside Docker:

```bash
docker compose exec web npm test --workspace web
```

Run frontend build inside Docker:

```bash
docker compose exec web npm run build --workspace web
```

### Combined Coverage

Generate backend coverage, frontend coverage, and an overall combined summary:

```bash
npm run test:coverage
```

Coverage reports are written to:

- `apps/api/coverage`
- `apps/web/coverage`

## E2E Testing

Playwright covers the critical authenticated flows:

- login and logout
- timeline rendering
- tweet creation
- search
- profile navigation
- follow and unfollow from profile
- like and unlike
- followers page navigation
- following page navigation

### Run E2E from the Host

Preferred reviewer path:

```bash
npm run test:e2e
```

This command runs Playwright inside the `web` container, so reviewers do not need a separate local Playwright installation after `npm run setup`.

Optional host-only path:

```bash
npm run test:e2e:host
```

Optional UI mode:

```bash
npm run test:e2e:ui
```

This host-only path assumes the app is already running at:

- `http://localhost:5173`
- `http://localhost:3000`

### Run E2E Inside Docker

```bash
docker compose exec web npm run test:e2e:docker
```

This is the same path used by `npm run test:e2e`.

The web container build installs the Chromium browser used by Playwright, so a fresh reviewer setup does not need an extra browser-install step after `npm run setup`.
The Docker E2E path starts an isolated temporary Vite server inside the `web` container with the internal Docker API hostname, so end-to-end tests do not depend on the reviewer-facing web session configuration.

## Demo Credentials

Primary reviewer account:

```text
demo@example.com
Password123!
```

Secondary seeded account:

```text
kevin@example.com
Password123!
```

## Useful Commands

### Project-Level Convenience Commands

- `npm run setup`
- `npm run verify`
- `npm run stop`
- `npm run reset`
- `npm run setup:migrate`
- `npm run setup:seed`

### Manual Docker Commands

Start containers:

```bash
docker compose up --build
```

Start in detached mode:

```bash
docker compose up --build -d
```

Stop containers:

```bash
docker compose down
```

Reset environment and volumes:

```bash
docker compose down -v
```

Run migrations:

```bash
docker compose exec api npm run db:migrate --workspace api
```

Run seed:

```bash
docker compose exec api npm run db:seed --workspace api
```

Run backend tests:

```bash
docker compose exec api npm test --workspace api
```

Run backend coverage:

```bash
docker compose exec api npm run test:coverage --workspace api
```

Run frontend tests:

```bash
docker compose exec web npm test --workspace web
```

Run frontend build:

```bash
docker compose exec web npm run build --workspace web
```

Run E2E tests:

```bash
docker compose exec web npm run test:e2e:docker
```

## Technical Decisions

### Why React + Vite

- fast local feedback loop
- lightweight SPA setup
- easy route-based product iteration
- minimal configuration overhead for a challenge repo

### Why Express + TypeScript

- predictable and explicit HTTP layer
- straightforward module boundaries
- TypeScript improves API correctness and testability
- easy to grow incrementally without over-abstracting early

### Why Prisma

- productive schema-first developer experience
- typed database access
- simple migrations and seeding workflow
- good fit for a relational social graph model

### Why PostgreSQL

- excellent fit for relational entities like users, tweets, follows, and likes
- robust local Docker story
- realistic production-facing choice for a social product backend

### Why JWT Authentication

- simple stateless auth for a project of this scope
- easy frontend integration
- clear protected-route model for API and SPA behavior

### Follow Graph Design

- follow relationships are stored explicitly
- the backend enforces no self-follow and no duplicate follow edges
- profile and list endpoints derive social views from the same underlying graph

### Timeline Design

- timeline is based on followed accounts
- pagination is kept simple and aligned with project scope
- implementation favors correctness and reviewer clarity over advanced feed ranking

### Like System Design

- likes are modeled separately from tweets
- counts are derived consistently from the like relationship
- frontend optimistic updates keep the interaction responsive

### Seed Strategy

- deterministic seed plan
- seeded users and tweets are realistic enough for demos
- social graph and likes are dense enough to make the app feel alive immediately
- seeded users support stable reviewer and E2E flows

## Trade-Offs and Limitations

- no realtime updates or websockets
- no media uploads
- no notifications
- no production deployment pipeline in this repository
- JWT is stored in local storage on the frontend for challenge simplicity
- timeline behavior is optimized for clarity and scope, not ranking sophistication
- follower/following pagination is intentionally simple and limit-based
- E2E assumes seeded data and a running stack

## AI-Assisted Development Notes

AI-assisted tooling was used during development.

Specifically:

- AI helped with scaffolding, repetitive implementation, and test generation
- generated code was reviewed and adjusted manually
- features were delivered incrementally in small slices
- Docker, unit tests, integration tests, and E2E tests were used to verify slices as the project evolved

## Submission Notes

This repository is optimized for reviewer experience:

- one-command setup
- deterministic seed data
- Dockerized runtime
- automated verification path
- clear documentation of trade-offs and decisions

If you only have a few minutes, use the Quick Evaluation Path near the top of this README.
