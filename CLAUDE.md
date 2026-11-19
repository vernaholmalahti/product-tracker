# CLAUDE.md

Instructions for Claude Code. Read this file first, then the files in `docs/` before writing any code.

## What we are building

**Ripe** is a mobile-first app where consumers can follow new food products and supplement ingredients (for example Solein and NMN) through the regulatory process until they reach shops. Each product has a timeline per market (EU, US, UK, Singapore...). Users follow products and get a push notification when a product moves to a new stage.

An AI-assisted backend job checks for news once a day and proposes updates. Updates are only published automatically when they come from an official source; everything else waits for a human to approve it in an admin view.

Full details:
- `docs/PROJECT_PLAN.md` – phases and checklists (work through these in order)
- `docs/ARCHITECTURE.md` – components and how data flows
- `docs/DATA_MODEL.md` – database tables
- `docs/AI_UPDATE_PIPELINE.md` – the AI search/update job, JSON schema and approval rules
- `docs/CONTENT_GUIDELINES.md` – regulatory stages, wording rules for supplements, seed data
- `docs/BRANDING.md` – app name, logo files, Expo icon setup, colours and font
- `docs/COMPANY_PORTAL.md` – Phase 8: companies add their own products (don't build before Phase 8, but keep the data model easy to extend). Section 4, AI product discovery, is built earlier in Phase 6b

## How to work with me (important)

I am a student building this as a portfolio project and I want to **understand the code, not just copy it**.

- Walk through changes **one step at a time** and explain **why** each change is needed.
- Do **not** tell me to replace whole files. Show the specific part that changes and where it goes.
- Before starting a new phase, give me a short plan (3–6 bullet points) and wait for my OK.
- After each step, tell me how to run or test it so I can see it working.
- If you need to make a choice that changes the architecture, ask me first and explain the trade-off.
- Keep explanations in plain English; introduce new concepts briefly when they first appear.

## Tech stack

- **Mobile app:** Expo (React Native) + TypeScript + Expo Router
- **Backend API:** Node.js + TypeScript + Express
- **Database:** PostgreSQL with Prisma ORM
- **Scheduled job:** `node-cron` inside a separate worker process
- **AI:** Anthropic API (Claude) with the web search tool, called **only from the backend worker**
- **Push notifications:** Expo Notifications (Expo push tokens)
- **Monorepo layout:**

```
ripe/
  apps/
    mobile/        # Expo app (consumer screens on phone + admin review as a web page)
  server/
    src/
      api/         # Express routes
      worker/      # daily update job (sources + AI + diff)
      db/          # Prisma client
    prisma/
      schema.prisma
      seed.ts
  docs/
  CLAUDE.md
  README.md
```

## Ground rules (never break these)

1. **No AI calls or API keys in the mobile app.** All keys live in `server/.env`, which is git-ignored. Add `.env.example` with placeholder values.
2. **Never publish an unverified status change.** AI output always becomes a `PendingUpdate` first. Only the approval rules in `docs/AI_UPDATE_PIPELINE.md` may publish it.
3. **Every status change must store a source URL** and the date it was checked. The app always shows the source link.
4. **No health claims or dosing advice** for supplements. Show regulatory status and links to evidence only (see `docs/CONTENT_GUIDELINES.md`).
5. **Validate all AI output** with a schema (zod) before using it. Invalid output is logged and discarded.
6. **Cost limits:** the worker runs at most once a day per product by default, with a configurable max number of AI calls per run.
7. Use TypeScript strict mode. Write small functions with clear names.

## Commands (fill in as they are created)

```bash
# database (PostgreSQL 18 in Docker, run from repo root; Docker Desktop must be running)
docker compose up -d            # start (data kept in volume ripe-db-data)
docker compose down             # stop (data is kept)
docker compose exec db psql -U ripe   # SQL prompt inside the database

# server (API on http://localhost:4000, PORT in server/.env)
cd server && cp .env.example .env   # first time only
cd server && npm run dev        # start API with auto-restart; GET /health also checks the database
cd server && npm run typecheck  # strict TypeScript check, no output = OK
cd server && npm run build      # compile to dist/
cd server && npm start          # run compiled dist/index.js
cd server && npm run notify:status -- solein EU   # push current status to followers (dev tool, Phase 3 demo)

# prisma (7.10.1, pinned – npm "latest" tag points to an 8.0 RC; config in server/prisma.config.ts)
cd server && npx prisma migrate dev --name <change>   # after editing schema.prisma
cd server && npx prisma generate      # rebuild client in src/generated/prisma (also runs on npm install)
cd server && npx prisma studio        # browse the database in the browser
cd server && npx prisma db seed       # add seed data from prisma/seed.ts (safe to run again)
# note: after migrate dev, also run prisma generate (Prisma 7 no longer does it automatically)

# mobile (Expo SDK 58, routes in src/app/)
cd apps/mobile && npx expo start      # scan QR with Expo Go; --tunnel if Wi-Fi blocks it; w = open in browser
cd apps/mobile && npm run typecheck
cd apps/mobile && npx expo install <package>   # add packages (SDK-compatible versions)

# not created yet
cd server && npm run worker     # run update job once (Phase 5)
```

Note: port 3000 is used by another local project on this machine, so the API uses 4000.

## Definition of done for each step

- It runs without errors.
- I have been told how to test it.
- Any new environment variables are added to `.env.example`.
- `docs/PROJECT_PLAN.md` checklist is updated.
