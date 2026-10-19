# Archer Product Specification

**Status:** Evolving MVP scope  
**Product:** Archer freelance marketplace

This document describes product behavior and user-facing features. It is expected to change as product decisions evolve. Architecture, contribution boundaries, and setup instructions belong in `AGENTS.md` and `README.md`.

## Product

Archer helps clients find and hire freelancers. Clients post work and review proposals; freelancers present their skills, find work, and apply. After hiring, both parties can coordinate and track the work in Archer.

The experience is intended for web and mobile. All monetary amounts are shown in either **USD** or **MMK**.

## Users and roles

- **Visitor:** Browse public jobs and freelancer profiles, then register or sign in.
- **Freelancer:** Maintain a professional profile, browse and save jobs, send proposals, and manage hired projects.
- **Client:** Maintain a client profile, post jobs, review proposals, hire a freelancer, and manage projects.
- **Administrator:** Review reports, moderate listings and accounts, and resolve issues requiring administrator action.

One account may use both client and freelancer features. Each role's private actions are available only to the account that owns the relevant content or participates in the project. Administrator actions are restricted.

## Features and workflows

### Accounts and profiles

- Register with a name, email address, and password; sign in and sign out.
- Choose client, freelancer, or both roles.
- Add and edit profile information.
- Freelancer profiles include a headline, biography, skills, optional rate, location, time zone, and portfolio links.
- Client profiles include a display name and optional description and location.
- View public freelancer profiles and report inappropriate accounts or content.

### Job discovery and listings

- Clients create, edit, publish, pause, close, and delete eligible job listings.
- A listing includes a title, description, category, skills, budget type, optional budget range, currency, optional experience level, and status.
- Visitors and freelancers can browse open listings. Freelancers can search by keyword and filter by category, skill, budget type, currency, and experience level; newest listings appear first by default.
- Freelancers can save and remove saved listings.

### Proposals and hiring

- A freelancer can submit one proposal per job with a cover message, proposed amount in the job's currency, and optional estimated duration.
- A freelancer can edit or withdraw a pending proposal.
- A client can review the proposals on their own job, see each freelancer's name and profile, and shortlist, decline, or hire a candidate.
- A job can have at most one hire and stops accepting proposals after hiring.
- Hiring records the agreed scope, amount, currency, and project status. It does not represent a payment.
- Proposal notifications identify the freelancer and open the relevant job's proposal list.

### Projects and communication

- A client and hired freelancer can view their project, the agreed scope and amount, status, and activity.
- Project statuses are `active`, `submitted`, `completed`, and `cancelled`.
- The freelancer can submit work; the client can mark it complete. Either participant can request cancellation. An administrator can resolve a cancellation request.
- Project participants can exchange text messages in the project workspace.
- Participants receive in-app notifications about proposals, hiring, messages, submitted work, completion, and moderation events. Notifications can be marked read individually or together.

### Reviews and safety

- After a project is complete, each participant may leave one 1–5 rating and written review for the other participant.
- Users can report jobs, profiles, proposals, or messages.
- Administrators can review reports, hide listings, suspend accounts, and record moderation actions.

## Currency and payments

- Jobs, proposals, freelancer rates, and project agreements use `USD` or `MMK` and display the currency explicitly.
- A proposal must use the job's currency. Currency values are not converted or compared across currencies.
- MMK is displayed in whole kyat; USD is displayed in dollars and cents.
- Archer does not collect, hold, transfer, or process payments in the MVP. It does not provide escrow, payouts, deposits, invoices, or exchange-rate conversion.

## Experience expectations

- Web and mobile layouts support their common screen sizes and interaction patterns.
- The web experience is available in English and Burmese. Users can switch languages from the site header, and their choice is saved for later visits.
- The API localizes supported user-facing errors according to the request's `Accept-Language` header; English is the fallback.
- Forms and actions communicate validation errors and recovery steps. Changes that fail are not reported as successful.
- Controls are keyboard-usable and screen-reader labeled where the platform supports it; text and controls have usable contrast.
- Lists of jobs, proposals, messages, and notifications support browsing without overwhelming users with a single unbounded list.

## MVP acceptance

- A visitor can create an account, sign in, and set up one or both marketplace roles.
- A client can publish a USD or MMK job and review the proposals received on it.
- A freelancer can find a job, save it, and submit a proposal in the job's currency.
- A client can shortlist or decline proposals, hire one freelancer, and see the resulting project.
- The client and freelancer can message one another and move the project through submission and completion.
- Both participants can leave a review after completion.
- Users can see and act on their notifications; administrators can perform restricted moderation actions.
- No Archer workflow represents or processes a payment as completed.

## Product questions still open

- Should account creation require email verification or support social sign-in?
- Should the mobile MVP include every workflow or focus first on discovery, proposals, messaging, and notifications?
- What account deletion and deactivation experience should users have?
