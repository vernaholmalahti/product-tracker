// Run: npm test
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { diffFindings, type MarketState } from "./diffFindings";
import type { CheckedFinding } from "./validateReport";

function finding(overrides: Partial<CheckedFinding>): CheckedFinding {
  return {
    marketCode: "EU",
    proposedStage: "AUTHORISED",
    eventDate: "2027-07-01",
    eventDatePrecision: "DAY",
    title: "Commission authorises Solein",
    summary: "The European Commission added Solein to the Union list.",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg_impl/2027/1234/oj",
    sourceType: "OFFICIAL",
    evidenceQuote: "authorising the placing on the market",
    confidence: 0.9,
    warnings: [],
    ...overrides,
  };
}

// Solein EU today: application submitted (2021) and EFSA opinion (2026) on the timeline.
const euState: MarketState = {
  marketCode: "EU",
  eventStages: ["APPLICATION_SUBMITTED", "POSITIVE_SAFETY_OPINION"],
  latestEventDate: "2026-08-31",
  pendingStages: [],
};

describe("diffFindings", () => {
  test("a new stage after the latest event is fresh", () => {
    const { fresh, known } = diffFindings([finding({})], [euState]);
    assert.equal(fresh.length, 1);
    assert.equal(known.length, 0);
  });

  test("a stage already on the timeline is known", () => {
    const { fresh, known } = diffFindings([finding({ proposedStage: "POSITIVE_SAFETY_OPINION" })], [euState]);
    assert.equal(fresh.length, 0);
    assert.match(known[0]?.reason ?? "", /already on the timeline/);
  });

  test("a stage already waiting for review is known", () => {
    const state = { ...euState, pendingStages: ["AUTHORISED" as const] };
    const { fresh, known } = diffFindings([finding({})], [state]);
    assert.equal(fresh.length, 0);
    assert.match(known[0]?.reason ?? "", /waiting for review/);
  });

  test("an event older than the latest known event is known", () => {
    const { fresh, known } = diffFindings([finding({ proposedStage: "UNDER_ASSESSMENT", eventDate: "2023-01-10" })], [euState]);
    assert.equal(fresh.length, 0);
    assert.match(known[0]?.reason ?? "", /older/);
  });

  test("a finding without a date is not rejected for being old", () => {
    const { fresh } = diffFindings([finding({ eventDate: null })], [euState]);
    assert.equal(fresh.length, 1);
  });

  test("two findings for the same market and stage: keeps the more confident one", () => {
    const weak = finding({ confidence: 0.6, sourceType: "NEWS" });
    const strong = finding({ confidence: 0.95 });
    const { fresh, known } = diffFindings([weak, strong], [euState]);
    assert.equal(fresh.length, 1);
    assert.equal(fresh[0]?.confidence, 0.95);
    assert.match(known[0]?.reason ?? "", /duplicate/);
  });

  test("a market with no timeline yet accepts its first event", () => {
    const empty: MarketState = { marketCode: "US", eventStages: [], latestEventDate: null, pendingStages: [] };
    const { fresh } = diffFindings([finding({ marketCode: "US", proposedStage: "UNDER_ASSESSMENT" })], [empty]);
    assert.equal(fresh.length, 1);
  });
});
