# Archer Web App

The Archer marketplace web client. This is an independent React application that consumes the Archer API; it does not share runtime code with the API or Expo app.

## Stack

- React 19 and TypeScript
- React Router 7
- TanStack Query
- shadcn/ui initialized with preset `beEhfqy2`
- Vite and Tailwind CSS

## Local development

Requirements: Node.js 22.12 or later and npm.

```sh
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the API origin plus version prefix. The local default is `http://localhost:4000/api/v1`.

```sh
npm run typecheck
npm run build
```

## Implemented workflows

- Public landing page, job discovery, filters, and job detail
- Account registration, sign-in, and profile settings for client and freelancer roles
- Client job posting and proposal review, shortlist, decline, and hire
- Freelancer saved jobs and proposal tracking
- Participant projects with status actions, messages, and post-completion reviews
- In-app notification list and read actions
- USD and MMK presentation, with no currency conversion or payment processing

The API is the source of truth for permissions and lifecycle rules. Configure its CORS allowlist to include the Vite development origin when using a non-default port.
