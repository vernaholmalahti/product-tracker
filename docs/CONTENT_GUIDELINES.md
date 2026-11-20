# Content guidelines

## What the stages mean per market

| Stage | EU | US | UK | Singapore |
|---|---|---|---|---|
| APPLICATION_SUBMITTED | Novel food application sent to the European Commission | GRAS notice or NDI notification filed with FDA | Application to FSA | Application to SFA |
| UNDER_ASSESSMENT | EFSA risk assessment ongoing | FDA reviewing | FSA assessing | SFA assessing |
| POSITIVE_SAFETY_OPINION | EFSA publishes a positive scientific opinion | – (not used, see note below) | FSA safety assessment positive | – |
| AUTHORISED | Commission implementing act adopted; added to the Union list | FDA "no questions" letter (GRAS) / NDI acknowledged without objection | Authorised in GB | Approved |
| ON_MARKET | First consumer products on sale | same | same | same |

Explain in the app, in plain language, that a positive safety opinion is **not yet** permission to sell in the EU.

**Self-affirmed GRAS is not a stage (decision 20 Nov 2026).** A US company can conclude with its own expert panel that an ingredient is GRAS and start selling. That is the company's conclusion, not an FDA step, so it doesn't change the stage. Mention it in the summary of the US event instead. Reason: FDA's review of the GRAS notice (`UNDER_ASSESSMENT`) comes *after* self-affirmation in real life, so using `POSITIVE_SAFETY_OPINION` for it would make the FDA steps look like a move backwards.

**Label for US supplement ingredients:** FDA does not "authorise" supplement ingredients. For a `SUPPLEMENT_INGREDIENT` in the US, the stage `AUTHORISED` is stored as normal but the app shows the label **"Allowed in supplements"** instead of "Authorised".

## Markets

- A market is one jurisdiction with its own regulator: a country, or the EU. Never a region like "East Asia", because each country there approves products separately.
- The app shows full market names ("Singapore", not "SG").
- The market filter groups markets by region: **Europe** (EU, UK), **Americas** (US), **Asia** (Singapore). Japan, South Korea and China can be added later as separate markets once there is sourced data.

## Dates

- If the exact day of an event is known, use it (`eventDatePrecision = DAY`).
- If only the month is known (e.g. "Sep 2022"), store the 1st of the month and set `eventDatePrecision = MONTH`. The app then shows "Sep 2022", never an invented day.
- Use the date of the real-world event (e.g. the day EFSA's panel adopted an opinion), not the date a news article was published.

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
| US | APPLICATION_SUBMITTED | GRAS notice filed with FDA, "no questions" letter pending. Summary mentions self-affirmed GRAS since Sep 2024 (company conclusion, not a stage) | 2025-09-16 | Solar Foods press release |
| EU | APPLICATION_SUBMITTED | Novel food application submitted | 2021-10-29 | proteinproductiontechnology.com |
| EU | POSITIVE_SAFETY_OPINION | EFSA positive safety opinion published; Commission vote next. Company estimate: authorisation Jun–Aug 2027. Fazer ready to launch products after approval. | Nov 2026 | foodingredientsfirst.com/news/solar-foods-efsa-solein-fazer.html |

### NMN (nicotinamide mononucleotide) – `SUPPLEMENT_INGREDIENT`

| Market | Stage | Event | Date | Source |
|---|---|---|---|---|
| US | AUTHORISED | FDA reversed its earlier position; NMN is again a lawful dietary supplement ingredient (NDI status restored for SyncoZymes) | 2025-12-02 | cirs-group.com |
| EU | POSITIVE_SAFETY_OPINION | EFSA positive safety opinion on EffePharm's β-NMN. Not yet authorised: cannot be sold legally as food/supplement in the EU until the Commission adopts an implementing act. | 2026-05-11 | nutraingredients.com (2026-05-13 article) |

Note for NMN: EU authorisation, if granted, may apply to one applicant's specific NMN product first. Show this in the summary.
