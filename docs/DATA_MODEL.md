# Data model

Written as plain tables so it is easy to read. Claude Code should turn this into `server/prisma/schema.prisma`.

## Product
A food ingredient or supplement ingredient we track.

| Field | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| slug | string, unique | e.g. `solein`, `nmn` |
| name | string | "Solein" |
| category | enum | `NOVEL_FOOD`, `SUPPLEMENT_INGREDIENT` |
| company | string? | e.g. "Solar Foods" |
| shortDescription | string | 1–2 sentences, plain language |
| imageUrl | string? | product/ingredient image (own or licensed only) |
| searchKeywords | string[] | used by the AI search, e.g. `["Solein", "Solar Foods", "Xanthobacter"]` |
| createdAt / updatedAt | datetime | |

## Market
| Field | Type | Notes |
|---|---|---|
| code | string, primary key | `EU`, `US`, `UK`, `SG` |
| name | string | "European Union" |

## ProductMarketStatus
Current status of one product in one market.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| productId | fk → Product | |
| marketCode | fk → Market | |
| currentStage | enum Stage | see below |
| expectedNext | string? | e.g. "Authorisation expected Jun–Aug 2027 (company estimate)" |
| lastCheckedAt | datetime | updated every worker run |
| unique | (productId, marketCode) | |

## Stage (enum)
Generic stages so every market can be shown on the same kind of timeline. Meaning per market is in `CONTENT_GUIDELINES.md`.

`NOT_SUBMITTED` → `APPLICATION_SUBMITTED` → `UNDER_ASSESSMENT` → `POSITIVE_SAFETY_OPINION` → `AUTHORISED` → `ON_MARKET`
plus `REJECTED`, `WITHDRAWN`

## StatusEvent
The timeline. One row per stage change. Never deleted, only added.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| productMarketStatusId | fk | |
| stage | Stage | |
| eventDate | date | date of the real-world event |
| title | string | "EFSA publishes positive safety opinion" |
| summary | string | 1–3 sentences, plain language |
| sourceUrl | string | required |
| sourceType | enum | `OFFICIAL`, `COMPANY`, `NEWS` |
| publishedBy | enum | `SEED`, `AUTO`, `ADMIN` |
| createdAt | datetime | |

## PendingUpdate
Proposed change from the worker, waiting for approval.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| productMarketStatusId | fk | |
| proposedStage | Stage | |
| eventDate | date? | |
| title / summary | string | |
| sourceUrl | string | |
| sourceType | enum | |
| evidenceQuote | string | short quote from the source (under 25 words) |
| confidence | float? 0–1 | from AI output; null for `SOURCE_CHECK` updates |
| origin | enum | `SOURCE_CHECK`, `AI_SEARCH` |
| status | enum | `PENDING`, `APPROVED`, `REJECTED`, `AUTO_PUBLISHED` |
| reviewNote | string? | reason for rejection etc. |
| updateRunId | fk? → UpdateRun | null for manually created updates (admin test data, Phase 8 company submissions) |
| createdAt | datetime | |

## Device
Anonymous consumer device.

| Field | Type | Notes |
|---|---|---|
| id | uuid | generated in the app and stored locally |
| expoPushToken | string? | |
| createdAt | datetime | |

## Follow
| Field | Type | Notes |
|---|---|---|
| id | uuid | own primary key (the unique below allows a null marketCode, so it cannot be the key) |
| deviceId | fk → Device | |
| productId | fk → Product | |
| marketCode | fk? → Market | null = all markets |
| unique | (deviceId, productId, marketCode) | |

## SourceWatch
Official pages/feeds the worker checks without AI.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| productId | fk? | null = general source |
| marketCode | fk → Market | |
| url | string | |
| kind | enum | `RSS`, `PAGE_HASH`, `SEARCH_PAGE` |
| lastHash | string? | |
| lastCheckedAt | datetime? | |

## Coming in Phase 8
`Company`, `CompanyUser`, `ProductSuggestion` and a few new fields/enum values – see `COMPANY_PORTAL.md` section 5. Not needed before Phase 8.

## UpdateRun
Log of every worker run.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| startedAt / finishedAt | datetime | |
| aiCallsUsed | int | |
| changesFound | int | |
| errors | json | |
