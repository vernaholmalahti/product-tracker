# Project plan

Work through the phases in order. Each phase should end with something that runs and can be shown.
Claude Code: tick the boxes as steps are finished.

## Phase 0 – Setup
- [x] Create monorepo folders (`apps/mobile`, `server`, `docs`)
- [x] Init git, add `.gitignore` (node_modules, `.env`, build output)
- [x] Server: Node + TypeScript + Express "hello world" on `/health`
- [x] Mobile: Expo app with Expo Router and TypeScript, one placeholder screen
- [x] `.env.example` for the server

**Demo:** app opens, server answers `/health`.

## Phase 1 – Data model and seed data
- [ ] PostgreSQL + Prisma set up
- [ ] Create tables from `docs/DATA_MODEL.md`
- [ ] Seed Solein and NMN with the data in `docs/CONTENT_GUIDELINES.md`
- [ ] API routes: `GET /products`, `GET /products/:slug`

**Demo:** API returns Solein with its EU, US and Singapore timelines.

## Phase 2 – Consumer app (read-only)
- [ ] Product list screen (name, category, short status per market)
- [ ] Product detail screen with a vertical timeline per market
- [ ] Each stage shows date, source link and "last checked" date
- [ ] Market filter (EU / US / UK / Singapore)
- [ ] Disclaimer on supplement pages

**Demo:** browse Solein and NMN on a phone.

## Phase 3 – Follow + push notifications
- [ ] Anonymous device ID (no login needed for consumers at first)
- [ ] Register Expo push token with the server
- [ ] Follow / unfollow a product
- [ ] Server function `notifyFollowers(productId, message)`
- [ ] Test by changing a status manually in the database

**Demo:** change a status → phone gets a notification.

## Phase 4 – Admin review
- [ ] Simple admin login (one admin account, password hash in DB, or an admin token in `.env` for the first version)
- [ ] Admin screen: list of `PendingUpdate`s with source, quote and proposed stage
- [ ] Approve → creates a `StatusEvent`, updates the product, sends notifications
- [ ] Reject → marks the update as rejected with a reason

**Demo:** create a fake pending update, approve it, phone gets notified.

## Phase 5 – Daily update worker (no AI yet)
- [ ] Worker process with `node-cron` (daily), plus `npm run worker` to run once
- [ ] Source checkers for official sources (see `docs/AI_UPDATE_PIPELINE.md`): fetch page/feed, detect changes by content hash
- [ ] Changes create `PendingUpdate`s
- [ ] `UpdateRun` log table: started, finished, items checked, errors

## Phase 6 – AI search
- [ ] Anthropic SDK in the worker, key from `.env`
- [ ] Prompt + JSON schema from `docs/AI_UPDATE_PIPELINE.md`
- [ ] Validate output with zod; discard invalid output
- [ ] Diff against current status; only real changes become `PendingUpdate`s
- [ ] Auto-publish rule for official sources; everything else needs review
- [ ] Limits: max AI calls per run, timeout, error handling

**Demo:** run the worker; see proposed updates appear in the admin screen with sources.

## Phase 7 – Polish for portfolio
- [ ] Empty states, loading states, error messages
- [ ] Simple branding (name, icon, colours)
- [ ] README screenshots and a short "how the AI pipeline works" section
- [ ] Basic tests: zod schema validation, diff logic, approval rules
- [ ] Deploy server (e.g. Render/Railway/Fly) and build the app with EAS

## Phase 8 – Company portal and product discovery
Details: `docs/COMPANY_PORTAL.md`
- [ ] `Company`, `CompanyUser` and `ProductSuggestion` tables + changes to existing tables
- [ ] Company sign-up with email domain verification
- [ ] Admin tab: verify companies
- [ ] Company web portal: suggest product, claim product, propose status change with source
- [ ] Company submissions go into the existing `PendingUpdate` review queue
- [ ] "From the company" card and verified badge in the app
- [ ] Weekly AI discovery of new products → `ProductSuggestion`s
- [ ] Admin tab: product suggestions
- [ ] Terms of service, privacy policy, rate limits, audit log

**Demo:** a test company signs up, gets verified, submits a product, admin approves it, it appears in the app.

## Later ideas (not in scope yet)
- Paid Pro plan for companies (see `docs/COMPANY_PORTAL.md`)
- More products (precision-fermented proteins, cultivated meat, new sweeteners)
- "Where can I buy it?" links once products launch
- Finnish language version
- Users can suggest products to track
