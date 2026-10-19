# Archer API

Express REST API for Archer. This is an independent project and repository. The web and Expo apps consume its versioned JSON API at `/api/v1`.

## Stack

- Node.js 22.5+
- Express 5 and TypeScript (ES modules)
- SQLite with Prisma ORM 7 and the `better-sqlite3` driver adapter
- JWT bearer access tokens and bcrypt password hashing

## Local setup

1. Copy `.env.example` to `.env` and replace `JWT_ACCESS_SECRET` with a random local secret of at least 32 characters.
2. Install dependencies with `npm install`.
3. Generate Prisma Client with `npm run db:generate`.
4. Apply the checked-in migrations with `npm run db:deploy`.
5. Load local demo data with `npm run db:seed`. This clears and recreates demo records in the configured database; use it only with a local development database.
6. Start the API with `npm run dev`.

Health check: `GET http://localhost:4000/health`  
API prefix: `http://localhost:4000/api/v1`

The SQLite URL is in `.env`. With the example URL, the database file is created in the API project root.

## Authentication

Register at `POST /api/v1/auth/register` with `{ "name", "email", "password", "roles": ["freelancer", "client"] }`; roles may contain either or both marketplace roles. Sign in at `POST /api/v1/auth/login`, then send `Authorization: Bearer <accessToken>` for protected routes. Access tokens are stateless, short lived, and are discarded by the client on logout. There is no refresh-token/session revocation mechanism in this first implementation.

## Money representation

All API amounts use integer `*Minor` fields. USD amounts are cents; MMK amounts are whole kyat. Every amount also includes its `currency` code (`USD` or `MMK`). There is no exchange-rate conversion and values across currencies are not comparable.

## Routes implemented

- `GET /health`
- `/api/v1/auth`: register, login, current user, logout
- `/api/v1/profiles`: public profile lookup and authenticated profile update
- `/api/v1/catalog`: categories and skills
- `/api/v1/jobs`: search, detail, authenticated owner listing (`GET /mine`), create, edit, publish, pause, close, delete
- `/api/v1/saved-jobs`: list, save, unsave
- `/api/v1/jobs/:jobId/proposals`, `/api/v1/proposals`: submit, list, edit, withdraw, shortlist, reject, hire
- `/api/v1/projects`: participant projects, submit, complete, request cancellation, messages, reviews
- `/api/v1/notifications`: list, unread count, mark one read, and mark all read
- `/api/v1/reports`: submit reports; admin list/review and user suspension

Responses use `{ "data": ... }`, paginated lists include `pagination`, and errors use `{ "error": { "code", "message", "details?" } }`. The API contract is in `openapi.yaml`.

## Demo accounts

The seed script creates local demo accounts. Their shared development password and account list are documented in `prisma/seed.ts`. Never reuse those credentials outside local development.
