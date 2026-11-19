# Company portal (Phase 8)

Goal: let companies add and update their own novel food and supplement products, while users can still trust every status shown in the app.

Build this **after Phase 7**, when the core app, admin review and AI pipeline work.

## Core principle

Companies are **one more source**, not a shortcut. Their submissions go into the same `PendingUpdate` review queue as AI findings. A status change is only published when it is backed by a source document, and official stages (safety opinion, authorisation) need an official source.

## 1. Company sign-up and verification

1. Company user signs up with name, company name, website and work email.
2. **Email domain check:** the email domain must match the company website domain (e.g. `@solarfoods.com` ↔ `solarfoods.com`). Send a verification link.
3. Company status starts as `PENDING_VERIFICATION`. Admin checks it in the admin screen (website, business ID such as Finnish Y-tunnus, LinkedIn) and sets it to `VERIFIED` or `REJECTED`.
4. A company can have several users; the first user is `OWNER` and can invite colleagues with the same email domain.

Free email providers (gmail.com, outlook.com…) are not accepted for company accounts.

## 2. What companies can do

| Action | Needs review? | Notes |
|---|---|---|
| Suggest a new product | Yes | Name, category, ingredient, markets, short description, image they own |
| Claim an existing product | Yes | Links the product to their company; admin confirms |
| Propose a status change | Yes | Must include a source URL or uploaded PDF |
| Edit "From the company" text | Light review (first time), then direct | Shown in a separate, clearly labelled section |
| Add launch info / where to buy | Yes | Shown once stage is `ON_MARKET` or a launch date is announced |
| Post an announcement to followers | Yes | Limited, e.g. 1 per product per month, to avoid spam |

Companies **cannot**:
- change or delete existing `StatusEvent`s
- write health claims or dosing advice on supplements (see `CONTENT_GUIDELINES.md`)
- see who follows their products (only counts)

## 3. How it looks in the app

- **Timeline (verified by NovelTrack):** same as before; each event shows its source. Events that came from a company submission show "Source: company press release" until an official source confirms them.
- **From the company:** separate card with the company's own text, logo and links, labelled "Provided by {company}".
- **Verified company badge** next to the company name once verified.

## 4. AI discovery of new products

Extend the worker so it also finds products nobody has added yet:
- Weekly: check new EFSA novel food opinions, EU Union list additions and new FDA GRAS notices.
- AI extracts product name, company, ingredient and market, and creates a **`ProductSuggestion`** (not a product).
- Admin approves → product created; the company can later claim it.

## 5. Data model additions

### Company
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | string | |
| website | string | |
| emailDomain | string | used for verification |
| businessId | string? | e.g. Y-tunnus |
| logoUrl | string? | |
| status | enum | `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `SUSPENDED` |
| plan | enum | `FREE`, `PRO` (see business model) |
| createdAt | datetime | |

### CompanyUser
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| companyId | fk → Company | |
| email | string, unique | |
| passwordHash | string | or use an auth provider |
| role | enum | `OWNER`, `EDITOR` |
| emailVerifiedAt | datetime? | |

### Changes to existing tables
- `Product.companyId` → fk → Company (nullable; set when claimed)
- `Product.companyText` → string? ("From the company" section)
- `SourceType` enum: add `COMPANY_SUBMISSION`
- `PendingUpdate.origin` enum: add `COMPANY`
- `PendingUpdate.submittedByCompanyUserId` → fk? → CompanyUser
- `PendingUpdate.attachmentUrl` → string? (uploaded PDF)

### ProductSuggestion
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name, company, ingredient | string | |
| markets | string[] | |
| sourceUrl | string | |
| origin | enum | `AI_DISCOVERY`, `COMPANY`, `USER` |
| status | enum | `PENDING`, `ACCEPTED`, `REJECTED` |

## 6. Business model (idea)

- **Free for consumers.**
- **Free listing for companies:** product page, status updates via review.
- **Pro plan (paid):** verified badge, launch announcements to followers, "where to buy" links, follower statistics, priority review.
- Paid features never affect the verified timeline. Say this clearly on the company sign-up page.

## 7. Where to build it

- Company portal as a **web app** (Expo web or a small Next.js app) – companies work on computers.
- New API routes under `/company/*`, protected with company-user auth.
- Admin screen gets two new tabs: "Company verifications" and "Product suggestions".

## 8. Legal and safety checklist
- [ ] Terms of service for companies (they confirm submitted info is accurate and they own uploaded images)
- [ ] Privacy policy covering company user data (GDPR)
- [ ] Moderation: admin can suspend a company
- [ ] Rate limits on submissions and announcements
- [ ] Audit log of who changed what
