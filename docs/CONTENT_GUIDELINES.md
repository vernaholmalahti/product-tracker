# Content guidelines

## What the stages mean per market

| Stage | EU | US | UK | Singapore |
|---|---|---|---|---|
| APPLICATION_SUBMITTED | Novel food application sent to the European Commission | GRAS notice or NDI notification filed with FDA | Application to FSA | Application to SFA |
| UNDER_ASSESSMENT | EFSA risk assessment ongoing | FDA reviewing | FSA assessing | SFA assessing |
| POSITIVE_SAFETY_OPINION | EFSA publishes a positive scientific opinion | (self-affirmed GRAS can be shown here with a note) | FSA safety assessment positive | – |
| AUTHORISED | Commission implementing act adopted; added to the Union list | FDA "no questions" letter (GRAS) / NDI acknowledged without objection | Authorised in GB | Approved |
| ON_MARKET | First consumer products on sale | same | same | same |

Explain in the app, in plain language, that a positive safety opinion is **not yet** permission to sell in the EU.

## Wording rules

- Neutral and factual: "EFSA concluded it is safe under the proposed conditions of use" – not "proven safe" or "healthy".
- **Supplements: no health claims, no dosing advice, no "anti-ageing" promises.** Show legal status and link to sources/research.
- Mark company forecasts clearly: "Company estimate: authorisation June–August 2027".
- Always show source + "last checked" date.
- Short quotes only (under 25 words); otherwise summarise in our own words.
- Don't use photos of real people; use our own images or licensed ones.

## Supplement disclaimer (shown on supplement pages)

> Ripe shows regulatory status only. It is not medical advice. Talk to a doctor or pharmacist before starting any supplement.

## Seed data (verify each fact against its source before launch)

Facts collected in November 2026. Claude Code: put these in `prisma/seed.ts`, and add the source URLs as `sourceUrl`.

### Solein (Solar Foods) – `NOVEL_FOOD`
Protein powder made from microbes grown using CO₂ and hydrogen (gas fermentation).

| Market | Stage | Event | Date | Source |
|---|---|---|---|---|
| SG | ON_MARKET | Approved as novel food in Singapore; products later launched (e.g. with Ajinomoto) | Sep 2022 | foodbev.com / Solar Foods press releases |
| US | POSITIVE_SAFETY_OPINION (note: self-affirmed GRAS) | Self-affirmed GRAS status; GRAS notice filed with FDA, "no questions" letter pending | Sep 2024 | proteinproductiontechnology.com, foodbusinessmea.com |
| EU | APPLICATION_SUBMITTED | Novel food application submitted | 2021-10-29 | proteinproductiontechnology.com |
| EU | POSITIVE_SAFETY_OPINION | EFSA positive safety opinion published; Commission vote next. Company estimate: authorisation Jun–Aug 2027. Fazer ready to launch products after approval. | Nov 2026 | foodingredientsfirst.com/news/solar-foods-efsa-solein-fazer.html |

### NMN (nicotinamide mononucleotide) – `SUPPLEMENT_INGREDIENT`

| Market | Stage | Event | Date | Source |
|---|---|---|---|---|
| US | AUTHORISED | FDA reversed its earlier position; NMN is again a lawful dietary supplement ingredient (NDI status restored for SyncoZymes) | 2025-12-02 | cirs-group.com |
| EU | POSITIVE_SAFETY_OPINION | EFSA positive safety opinion on EffePharm's β-NMN. Not yet authorised: cannot be sold legally as food/supplement in the EU until the Commission adopts an implementing act. | 2026-05-11 | nutraingredients.com (2026-05-13 article) |

Note for NMN: EU authorisation, if granted, may apply to one applicant's specific NMN product first. Show this in the summary.
