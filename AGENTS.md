# Archer project boundaries

These guidelines apply across the Archer monorepo. A more specific `AGENTS.md` inside a project may add local instructions, but should preserve these shared boundaries.

## Document ownership

- `SPEC.md` is the current source for user-facing features, product behavior, and product scope. It is intentionally evolvable; update it when an agreed feature behavior changes.
- The root `README.md` explains Archer and how developers run the workspace. `app/README.md` and `api/README.md` document setup and operation for those projects.
- `AGENTS.md` defines durable implementation and repository boundaries. Do not turn it into a second feature spec or setup manual.
- `CLAUDE.md` points Claude Code to this file. Keep shared policy here instead of maintaining a second, conflicting rule set.

## Project and repository boundaries

- Archer is maintained in one Git monorepo with `app/`, `api/`, and `mobile/` as separate projects.
- Each project owns its dependencies, environment, build, and release process. Do not add a root package workspace or make one project import another project's runtime source.
- Cross-project communication uses the versioned HTTP API. `api/openapi.yaml` is the canonical API contract for the web and mobile clients.
- The API owns persistence, authentication, authorization, validation, and shared business rules. Client-side checks may improve usability but never replace API enforcement.
- Web and mobile clients must not access the API's SQLite database directly.

## Shared invariants

- Keep user-facing behavior aligned with `SPEC.md`; do not silently add features that change its product boundaries.
- For Burmese translations or bilingual UI typography and layout, follow `.agents/skills/burmese-i18n/SKILL.md` and keep styling responsive to the selected language.
- Preserve the USD/MMK rules in the spec. Store and display a currency with each amount; never infer an exchange rate or compare amounts across currencies.
- Do not add payment processing, escrow, payouts, or payment-provider integrations unless the product scope is explicitly changed.
- Keep secrets and local credentials in ignored environment files. Update `.env.example` when configuration changes; never commit real secrets or personal data.
- Make database schema changes through new Prisma migrations in `api/`. Do not rewrite migrations that have already been applied to a shared database.
- Keep seed data fictional and useful for the workflows in the spec. The API seed command resets local demo records, so document that behavior and use it only against a local development database.

## Cross-project changes

- When an API request or response changes, update `api/openapi.yaml` and every client affected by that contract change.
- Keep currencies, lifecycle statuses, role behavior, and user-visible authorization outcomes consistent across web, API, and mobile.
- Keep user-facing setup and operation instructions in the relevant README. Record product behavior in `SPEC.md`; record durable contributor boundaries here.
