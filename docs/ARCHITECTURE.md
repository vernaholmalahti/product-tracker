# Architecture

## Overview

```mermaid
flowchart TD
    CRON[Daily worker job] --> OFF[Official source checks<br/>plain code: feeds, page hashes]
    CRON --> AI[AI search<br/>Claude + web search tool]
    OFF --> DIFF[Compare with database]
    AI --> DIFF
    DIFF -->|no change| STOP[Log and stop]
    DIFF -->|change| PEND[PendingUpdate]
    PEND -->|official source| AUTO[Auto-publish]
    PEND -->|news / press release| REVIEW[Admin review]
    REVIEW -->|approve| PUB[StatusEvent saved]
    AUTO --> PUB
    PUB --> PUSH[Push notification to followers]
    PUB --> APP[Mobile app shows new status]
```

## Components

### 1. Mobile app (`apps/mobile`)
- Expo + Expo Router + TypeScript.
- Consumer screens: product list, product detail with timelines, followed products, settings.
- Admin screen: pending updates (only visible after admin login).
- Talks **only** to our own API. Never calls the AI or external sites directly.

### 2. API server (`server/src/api`)
- Express + TypeScript.
- Public routes: products, timelines, follow/unfollow, register push token.
- Admin routes: list/approve/reject pending updates (protected).
- Sends push notifications through the Expo push service.

### 3. Worker (`server/src/worker`)
- Separate process from the API so a slow AI call never slows down the app.
- Runs daily with `node-cron`; can also be run manually with `npm run worker`.
- Steps:
  1. Load all tracked product + market pairs.
  2. Run official source checks (cheap, no AI).
  3. Run AI search for each product (limited number of calls).
  4. Validate AI output with zod.
  5. Compare with the current status in the database.
  6. Create `PendingUpdate`s for real changes.
  7. Apply approval rules (auto-publish official sources, otherwise wait for review).
  8. Write an `UpdateRun` log row.

### 4. Database (PostgreSQL + Prisma)
See `DATA_MODEL.md`.

## Key decisions

| Decision | Why |
|---|---|
| AI only in backend worker | Keeps the API key secret and controls costs (runs once a day, not once per user). |
| AI proposes, rules/humans approve | Language models can misread articles; a wrong "approved!" notification would destroy trust. |
| Official sources checked with plain code first | Cheaper, faster and more reliable than AI for structured sources. |
| Source URL required on every status | Users can verify everything themselves. |
| Anonymous device IDs for consumers | No login needed to follow products; fewer privacy concerns. |

## Environment variables (`server/.env`)

```
DATABASE_URL=postgresql://user:password@localhost:5432/ripe
ANTHROPIC_API_KEY=your-key-here
ANTHROPIC_MODEL=claude-sonnet-5-5
AI_MAX_CALLS_PER_RUN=10
ADMIN_TOKEN=change-me
WORKER_CRON=0 6 * * *
```
