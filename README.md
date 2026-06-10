# The Flock

Twitter/X clone technical challenge scaffold.

## Goals

- Monorepo with `apps/api` and `apps/web`
- Dockerized local development
- Production-style tooling from the first commit
- Incremental delivery with tests on every step

## Stack

- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL
- Frontend: React, Vite, React Router, TanStack Query, Tailwind CSS
- Testing: Vitest, Supertest, React Testing Library
- Infrastructure: Docker Compose

## Quick Start

1. Copy `.env.example` to `.env`
2. Start PostgreSQL with `docker compose up --build -d db`
3. Apply schema and seed demo data with `docker compose run --rm api npm run db:setup --workspace api`
4. Start the full stack with `docker compose up --build`
5. Sign in with `demo@example.com` / `Password123!`

## Available Scripts

- `npm run lint`
- `npm run format`
- `npm run test`
- `npm run test:coverage`
- `npm run build`
- `npm run db:setup`
- `npm run test:e2e`
- `npm run test:e2e:ui`

## Applications

### API

- Entry point: `apps/api/src/server.ts`
- Health endpoint: `GET /health`
- Prisma schema: `apps/api/prisma/schema.prisma`
- Prisma client singleton: `apps/api/src/lib/prisma.ts`
- Auth endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
  - `POST /auth/logout`
- Tweet endpoints:
  - `POST /tweets`
  - `DELETE /tweets/:id`
  - `GET /tweets/:tweetId`
  - `GET /tweets/user/:username?limit=`
  - `POST /tweets/:tweetId/like`
  - `DELETE /tweets/:tweetId/like`
- Follow endpoints:
  - `GET /users/:username`
  - `POST /users/:userId/follow`
  - `DELETE /users/:userId/follow`
  - `GET /users/:username/followers?limit=`
  - `GET /users/:username/following?limit=`
  - `GET /users/search?q=&limit=`
- Timeline endpoint:
  - `GET /timeline`

## Database Commands

Generate the Prisma client:

```bash
npm run prisma:generate --workspace api
```

Apply committed migrations from the host:

```bash
npm run prisma:migrate:deploy --workspace api
```

Apply committed migrations inside Docker:

```bash
docker compose run --rm api npm run prisma:migrate:deploy --workspace api
```

Run the full database setup from the host:

```bash
npm run db:setup
```

Run the full database setup inside Docker:

```bash
docker compose run --rm api npm run db:setup --workspace api
```

Run the demo seed script:

```bash
npm run db:seed
```

Run the seed inside Docker:

```bash
docker compose run --rm api npm run db:seed --workspace api
```

Demo credentials:

```text
demo@example.com
Password123!

kevin@example.com
Password123!
```

### Web

- Entry point: `apps/web/src/main.tsx`
- Initial UI routes:
  - `/`
  - `/login`
  - `/register`
  - `/search`
  - `/profile/:username`

## End-to-End Testing

Playwright covers the most stable authenticated user flows in the first E2E slice:

- login and logout
- timeline rendering
- tweet creation
- search
- profile loading
- follow/unfollow from profile

The second E2E slice adds:

- like/unlike on timeline tweets
- followers page navigation
- following page navigation

### Prerequisites

1. Install dependencies:

```bash
npm install
```

2. Install the Playwright Chromium browser:

```bash
npx playwright install chromium
```

3. Start the Dockerized app and seed the database:

```bash
docker compose up --build -d db
docker compose run --rm api npm run db:setup --workspace api
docker compose up --build -d
```

### Run Playwright Locally

Run the headless suite:

```bash
npm run test:e2e
```

Open the Playwright UI runner:

```bash
npm run test:e2e:ui
```

### Optional Environment Overrides

By default, Playwright targets:

- web: `http://localhost:5173`
- api: `http://localhost:3000`

You can override them if needed:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5173
PLAYWRIGHT_API_URL=http://localhost:3000
```

## Coverage

Generate coverage for backend, frontend, and an overall combined summary:

```bash
npm run test:coverage
```

Run per-app coverage if you only need one side:

```bash
npm run test:coverage --workspace api
npm run test:coverage --workspace web
```

Coverage reports are written to:

- `apps/api/coverage`
- `apps/web/coverage`

## Next Steps

- Add auth flows and JWT issuance
- Add database-backed API features
- Add shared contracts package if cross-app types become useful
