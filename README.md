# Archer

Archer is a freelance marketplace where clients post work, freelancers submit proposals, and both parties coordinate after hiring. Amounts are shown in USD or MMK. The MVP does not process payments.

## Projects

This repository is Archer's monorepo. Each project remains self-contained:

- [`app/`](app/README.md): React web application.
- [`api/`](api/README.md): Express API, SQLite database, Prisma migrations, and demo seed data.
- `mobile/`: planned Expo React Native application; it has not been scaffolded yet.

Each project owns its dependencies, setup, build, and release process. There is no root package workspace or shared runtime code; clients communicate with the API over its versioned HTTP contract.

The web app supports English and Burmese. Choose a language from the app header; the selection is saved in the browser.

## Run locally

Start the API first, in one terminal:

```sh
cd api
npm install
cp .env.example .env
```

Set `JWT_ACCESS_SECRET` in `api/.env` to a random local secret of at least 32 characters, then initialize the local database and start the API:

```sh
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

The seed command resets the local demo records before recreating them. Do not point it at a database containing data you need to keep.

In a second terminal, start the web app:

```sh
cd app
npm install
cp .env.example .env
npm run dev
```

The app's default API URL is `http://localhost:4000/api/v1`. The web app runs at `http://localhost:5173` by default. See the [API README](api/README.md) and [app README](app/README.md) for project-specific details.

## Local demo accounts

After seeding, use the shared local password `ArcherDemo2026!` with these example accounts:

- Admin: `admin1@archer.local`
- Freelancer: `member3@archer.local`
- Client: `member41@archer.local`

These credentials are for local development only. Never reuse them outside the demo database.

## Project documents

- [`SPEC.md`](SPEC.md) describes current features and user-facing behavior.
- [`TODO.md`](TODO.md) tracks the remaining work to complete the MVP.
- [`AGENTS.md`](AGENTS.md) defines shared implementation and repository boundaries.
- [`CLAUDE.md`](CLAUDE.md) directs Claude Code to the shared guidelines.
