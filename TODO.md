# Archer MVP roadmap

This list tracks work needed to finish and prepare the current product scope in [`SPEC.md`](SPEC.md).

## Mobile app

- [ ] Scaffold `mobile/` as an independent Expo React Native app with its own dependencies and scripts.
- [ ] Connect mobile to the versioned API contract in `api/openapi.yaml`; do not access SQLite directly.
- [ ] Implement authentication, profile setup, job discovery, saved jobs, proposals, client proposal review, projects, messages, and in-app notifications.
- [ ] Add English and Burmese translations and language-aware typography for mobile layouts.

## Workflow verification

- [ ] Walk through client and freelancer journeys using seeded demo accounts, including proposal submission, review, hiring, project messaging, work submission, completion, and reviews.
- [ ] Verify proposal and project notifications identify the relevant person and navigate to the correct workflow.
- [ ] Check authorization, validation, loading, empty, and recovery states across the web app and API.
- [ ] Review web layouts and Burmese typography at desktop and mobile widths.

## Release readiness

- [ ] Choose hosting and deployment environments for the web app and API, keeping their build and release processes independent.
- [ ] Document production configuration, database backup and migration steps, and operational health checks.
- [ ] Review accessibility, security headers, rate limits, logging, and error reporting before public launch.
