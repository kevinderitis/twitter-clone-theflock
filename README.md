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
2. Install dependencies with `npm install`
3. Start the stack with `docker compose up --build`

## Available Scripts

- `npm run lint`
- `npm run format`
- `npm run test`
- `npm run build`

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
  - `POST /tweets/:tweetId/like`
  - `DELETE /tweets/:tweetId/like`
- Follow endpoints:
  - `POST /users/:userId/follow`
  - `DELETE /users/:userId/follow`
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

Run the placeholder seed script:

```bash
npm run prisma:seed --workspace api
```

### Web

- Entry point: `apps/web/src/main.tsx`
- Placeholder routes:
  - `/login`
  - `/register`
  - `/timeline`
  - `/profile/:username`

## Next Steps

- Add auth flows and JWT issuance
- Add database-backed API features
- Add shared contracts package if cross-app types become useful
