// Run: npm test
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normaliseUrl, validateReport, type ValidationContext } from "./validateReport";

// A made-up but realistic finding, as Claude would return it in report_findings.
const goodFinding = {
  marketCode: "EU",
  proposedStage: "AUTHORISED",
  eventDate: "2027-07-01",
  eventDatePrecision: "DAY",
  title: "Commission authorises Solein as a novel food",
  summary: "The European Commission added Solein to the Union list of novel foods.",
  sourceUrl: "https://eur-lex.europa.eu/eli/reg_impl/2027/1234/oj",
  sourceType: "OFFICIAL",
  evidenceQuote: "authorising the placing on the market of dried biomass of Xanthobacter sp. as a novel food",
  confidence: 0.92,
};

const context: ValidationContext = {
  productSlug: "solein",
  category: "NOVEL_FOOD",
  marketCodes: ["EU", "US", "SG"],
  seenUrls: new Set(["https://eur-lex.europa.eu/eli/reg_impl/2027/1234/oj", "https://www.solarfoods.com/news/"]),
  today: "2027-07-15",
};

function report(findings: unknown[]) {
  return { productSlug: "solein", findings, notes: "" };
}

describe("validateReport", () => {
  test("accepts a valid finding", () => {
    const result = validateReport(report([goodFinding]), context);
    assert.ok(result.ok);
    assert.equal(result.findings.length, 1);
    assert.equal(result.rejected.length, 0);
    assert.deepEqual(result.findings[0]?.warnings, []);
  });

  test("accepts an empty report (nothing new)", () => {
    const result = validateReport({ productSlug: "solein", findings: [], notes: "No new events." }, context);
    assert.ok(result.ok);
    assert.equal(result.findings.length, 0);
  });

  test("rejects the whole report if it is not the right shape", () => {
    assert.equal(validateReport("not an object", context).ok, false);
    assert.equal(validateReport({ findings: [] }, context).ok, false);
  });

  test("rejects a report about another product", () => {
    const result = validateReport({ productSlug: "nmn", findings: [], notes: "" }, context);
    assert.equal(result.ok, false);
  });

  test("rejects a source URL Claude never saw (invented)", () => {
    const invented = { ...goodFinding, sourceUrl: "https://eur-lex.europa.eu/made-up-page" };
    const result = validateReport(report([invented]), context);
    assert.ok(result.ok);
    assert.equal(result.findings.length, 0);
    assert.match(result.rejected[0]?.reason ?? "", /not among the pages Claude saw/);
  });

  test("accepts the same URL with www, a trailing slash or a #fragment", () => {
    const variant = { ...goodFinding, sourceUrl: "https://solarfoods.com/news#latest", sourceType: "COMPANY" };
    const result = validateReport(report([variant]), context);
    assert.ok(result.ok);
    assert.equal(result.findings.length, 1);
  });

  test("rejects a quote of 25 words or more", () => {
    const longQuote = { ...goodFinding, evidenceQuote: Array(25).fill("word").join(" ") };
    const result = validateReport(report([longQuote]), context);
    assert.ok(result.ok);
    assert.match(result.rejected[0]?.reason ?? "", /under 25 words/);
  });

  test("rejects confidence outside 0–1, an unknown stage and a future date", () => {
    const result = validateReport(
      report([
        { ...goodFinding, confidence: 1.4 },
        { ...goodFinding, proposedStage: "APPROVED" },
        { ...goodFinding, eventDate: "2030-01-01" },
      ]),
      context,
    );
    assert.ok(result.ok);
    assert.equal(result.findings.length, 0);
    assert.equal(result.rejected.length, 3);
  });

  test("rejects a market the product isn't tracked in", () => {
    const result = validateReport(report([{ ...goodFinding, marketCode: "UK" }]), context);
    assert.ok(result.ok);
    assert.match(result.rejected[0]?.reason ?? "", /not tracked/);
  });

  test("keeps good findings when one finding in the report is bad", () => {
    const result = validateReport(report([goodFinding, { ...goodFinding, confidence: -1 }]), context);
    assert.ok(result.ok);
    assert.equal(result.findings.length, 1);
    assert.equal(result.rejected.length, 1);
  });

  test("flags health-claim wording on supplements (but does not reject it)", () => {
    const supplementContext = { ...context, productSlug: "nmn", category: "SUPPLEMENT_INGREDIENT" as const };
    const claim = { ...goodFinding, summary: "NMN boosts energy and is now allowed in the EU." };
    const result = validateReport({ productSlug: "nmn", findings: [claim], notes: "" }, supplementContext);
    assert.ok(result.ok);
    assert.equal(result.findings.length, 1);
    assert.match(result.findings[0]?.warnings[0] ?? "", /boosts, energy/);
  });

  test("does not flag the same wording on a novel food", () => {
    const result = validateReport(report([{ ...goodFinding, summary: "Gas fermentation uses renewable energy." }]), context);
    assert.ok(result.ok);
    assert.deepEqual(result.findings[0]?.warnings, []);
  });
});

describe("normaliseUrl", () => {
  test("treats www, trailing slashes and fragments as the same page", () => {
    assert.equal(normaliseUrl("https://www.Example.com/a/b/#x"), normaliseUrl("https://example.com/a/b"));
  });
  test("keeps query strings (they can point to different documents)", () => {
    assert.notEqual(normaliseUrl("https://x.org/doc?id=1"), normaliseUrl("https://x.org/doc?id=2"));
  });
});
