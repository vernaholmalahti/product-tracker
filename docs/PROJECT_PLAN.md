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
- [x] PostgreSQL + Prisma set up
- [x] Create tables from `docs/DATA_MODEL.md`
- [x] Seed Solein and NMN with the data in `docs/CONTENT_GUIDELINES.md`
- [x] API routes: `GET /products`, `GET /products/:slug`

**Demo:** API returns Solein with its EU, US and Singapore timelines.

## Phase 2 – Consumer app (read-only)
- [x] Landing screen: browse Novel foods or Supplements
- [x] Product list screen (name, category, short status per market)
- [x] Product detail screen with a vertical timeline per market
- [x] Each stage shows date, source link and "last checked" date
- [x] Market filter (EU / US / UK / Singapore)
- [x] Disclaimer on supplement pages

**Demo:** browse Solein and NMN on a phone.

## Phase 3 – Follow + push notifications
- [x] Anonymous device ID (no login needed for consumers at first)
- [ ] Register Expo push token with the server
- [x] Follow / unfollow a product
- [x] Server function `notifyFollowers(productId, message)`
- [ ] Test by changing a status manually in the database

**Demo:** change a status → phone gets a notification.

## Phase 4 – Admin review (web page)
The admin side is a **web page**: reviewing sources and reading quotes is easier on a computer. It is built with Expo for web from the same codebase, so it also works in a phone's browser.
- [x] Simple admin login (one admin account, password hash in DB, or an admin token in `.env` for the first version)
- [x] Admin web page: list of `PendingUpdate`s with source link, quote and proposed stage, laid out for a desktop browser
- [x] Approve → creates a `StatusEvent`, updates the product, sends notifications
- [x] Reject → marks the update as rejected with a reason

**Demo:** create a fake pending update, approve it in the browser, phone gets notified.

## Phase 5 – Daily update worker (no AI yet)
- [x] Worker process with `node-cron` (daily), plus `npm run worker` to run once
- [x] Source checkers for official sources (see `docs/AI_UPDATE_PIPELINE.md`): fetch page/feed, detect changes by content hash
- [x] Changes are recorded (in the `UpdateRun` log and `SourceWatch`), not turned into `PendingUpdate`s yet – a hash change doesn't say which stage (decision in `docs/AI_UPDATE_PIPELINE.md` section 10)
- [x] `UpdateRun` log table: started, finished, items checked, errors

**Demo:** run `npm run worker`; see which official pages changed in the `UpdateRun` log.

## Phase 6 – AI search
- [x] Anthropic SDK in the worker, key from `.env`
- [x] Prompt + JSON schema from `docs/AI_UPDATE_PIPELINE.md`
- [x] Changed official pages from Phase 5 are given to the AI first; findings create `PendingUpdate`s
- [x] Validate output with zod; discard invalid output
- [x] Diff against current status; only real changes become `PendingUpdate`s
- [x] Auto-publish rule for official sources; everything else needs review
- [x] Limits: max AI calls per run, timeout, error handling, cheaper schedule (AI only when an official page changed + weekly full check)
- [x] End-to-end test with a fake Claude: `npm run ai:fake-run`
- [ ] Live test with a real API key (`npm run ai:check`, then `npm run ai:test -- solein --spend`) – waiting until a key is added

**Demo:** run the worker; see proposed updates appear in the admin web page with sources.

## Phase 6b – AI product discovery
Moved here from Phase 8: it only depends on the AI worker from Phase 6, so the app can grow on its own much sooner. Details: `docs/COMPANY_PORTAL.md` section 4.
- [ ] `ProductSuggestion` table (`origin`: `AI_DISCOVERY` for now; `COMPANY` and `USER` are added later)
- [ ] Weekly worker job: check new EFSA novel food opinions, EU Union list additions and new FDA GRAS notices
- [ ] AI extracts product name, company, ingredient and market → `ProductSuggestion` (validated with zod, never a product directly)
- [ ] Admin web page tab: product suggestions → approve creates the product, reject with a reason
- [ ] Limits: max AI calls per discovery run, skip suggestions that already exist

**Demo:** run the discovery job; a new product suggestion appears in the admin web page; approve it and it shows up in the app.

## Phase 7 – Polish for portfolio
- [ ] Empty states, loading states, error messages
- [ ] Branding: name **Ripe**, ripening-ring logo, palette Sprout #1FA463, Zest #A6D93B, Amber #FFB020, Ripe #FF5A1F, Plum #2B1B3D (text/dark), Cream #FFF7EC (background), font Outfit. Use the four ring colours for the timeline stages, always with text labels.
- [ ] README screenshots and a short "how the AI pipeline works" section
- [x] Basic tests: zod schema validation, diff logic, approval rules (+ schedule, API routes – `npm test`)
- [x] GitHub Actions CI: typechecks + all tests on a fresh PostgreSQL on every push
- [ ] Personal setup instead of public hosting (decision 20 Nov 2026): Mac as server, phone reaches it over Tailscale, real admin token, worker time when the Mac is awake, `preview` EAS build (standalone APK)
- [ ] Later, if the app goes public: deploy server (e.g. Render/Railway/Fly) and publish with EAS

## Phase 8 – Company portal
Details: `docs/COMPANY_PORTAL.md` (product discovery was moved to Phase 6b)
- [ ] `Company` and `CompanyUser` tables + changes to existing tables (add `COMPANY` origin to `ProductSuggestion`)
- [ ] Company sign-up with email domain verification
- [ ] Admin web page tab: verify companies
- [ ] Company web portal: suggest product (→ `ProductSuggestion`), claim product, propose status change with source
- [ ] Company submissions go into the existing `PendingUpdate` review queue
- [ ] "From the company" card and verified badge in the app
- [ ] Terms of service, privacy policy, rate limits, audit log

**Demo:** a test company signs up, gets verified, submits a product, admin approves it, it appears in the app.

## Later ideas (not in scope yet)
- Paid Pro plan for companies (see `docs/COMPANY_PORTAL.md`)
- More products (precision-fermented proteins, cultivated meat, new sweeteners)
- "Where can I buy it?" links once products launch
- Finnish language version
- Users can suggest products to track
