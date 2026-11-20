// Run: npm test
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { type AutoPublishInput, evaluateAutoPublish } from "./approvalRules";
import { isOfficialSource } from "./officialDomains";
import { isForwardMove } from "./stageOrder";
import { normaliseForMatch, quoteAppearsInText } from "./verifyQuote";

// An update that passes all 7 rules: EU Commission authorisation of Solein on EUR-Lex.
const perfect: AutoPublishInput = {
  category: "NOVEL_FOOD",
  marketCode: "EU",
  currentStage: "POSITIVE_SAFETY_OPINION",
  proposedStage: "AUTHORISED",
  sourceType: "OFFICIAL",
  sourceUrl: "https://eur-lex.europa.eu/eli/reg_impl/2027/1234/oj",
  confidence: 0.92,
  eventDate: "2027-07-01",
  title: "Commission authorises Solein as a novel food",
  summary: "The European Commission added Solein to the Union list of novel foods.",
  quoteFoundOnPage: true,
};

function decide(changes: Partial<AutoPublishInput>) {
  return evaluateAutoPublish({ ...perfect, ...changes });
}

describe("evaluateAutoPublish", () => {
  test("publishes automatically when every rule passes", () => {
    assert.deepEqual(decide({}), { autoPublish: true, failedRules: [] });
  });

  // One test per rule: break exactly that rule and check it alone stops publishing.
  const cases: [string, Partial<AutoPublishInput>, RegExp][] = [
    ["1. company source", { sourceType: "COMPANY" }, /official domain/],
    ["1. labelled OFFICIAL but a news site", { sourceUrl: "https://www.foodnavigator.com/x" }, /official domain/],
    ["1. official domain of another market", { sourceUrl: "https://www.fda.gov/food/x" }, /official domain/],
    ["2. quote not on the page", { quoteFoundOnPage: false }, /quote was not found/],
    ["2. quote couldn't be checked", { quoteFoundOnPage: null }, /could not check/],
    ["3. low confidence", { confidence: 0.84 }, /confidence below/],
    ["3. no confidence (source check)", { confidence: null }, /confidence below/],
    ["4. ON_MARKET", { proposedStage: "ON_MARKET" }, /always needs human review/],
    ["5. backwards move", { currentStage: "AUTHORISED", proposedStage: "UNDER_ASSESSMENT" }, /not a forward move/],
    ["6. no date", { eventDate: null }, /no event date/],
    [
      "7. health claim on a supplement",
      { category: "SUPPLEMENT_INGREDIENT", summary: "NMN boosts NAD+ levels and is now authorised." },
      /health claim/,
    ],
  ];
  for (const [name, changes, reason] of cases) {
    test(`stops on rule ${name}`, () => {
      const result = decide(changes);
      assert.equal(result.autoPublish, false);
      assert.equal(result.failedRules.length, 1, `expected only one failed rule, got: ${result.failedRules.join(" | ")}`);
      assert.match(result.failedRules[0] ?? "", reason);
    });
  }

  // REJECTED isn't on the normal path, so it breaks rule 4 AND rule 5 – both reasons are true.
  test("REJECTED always goes to a human (rules 4 and 5)", () => {
    const result = decide({ proposedStage: "REJECTED" });
    assert.equal(result.autoPublish, false);
    assert.ok(result.failedRules.some((r) => /always needs human review/.test(r)));
  });

  test("lists every failed rule, so the admin sees all reasons at once", () => {
    const result = decide({ sourceType: "NEWS", confidence: 0.5, eventDate: null });
    assert.equal(result.failedRules.length, 3);
  });

  test("allows skipping steps forward (assessment straight to authorisation)", () => {
    assert.equal(decide({ currentStage: "UNDER_ASSESSMENT" }).autoPublish, true);
  });
});

describe("isOfficialSource", () => {
  test("accepts the domain and its subdomains", () => {
    assert.ok(isOfficialSource("https://www.efsa.europa.eu/en/news", "EU"));
    assert.ok(isOfficialSource("https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2026.1234", "EU"));
    assert.ok(isOfficialSource("https://data.food.gov.uk/regulated-products", "UK"));
  });
  test("rejects look-alike domains", () => {
    assert.equal(isOfficialSource("https://fakefda.gov/news", "US"), false);
    assert.equal(isOfficialSource("https://fda.gov.example.com/news", "US"), false);
  });
  test("rejects http (not https) and broken URLs", () => {
    assert.equal(isOfficialSource("http://www.fda.gov/food", "US"), false);
    assert.equal(isOfficialSource("not a url", "US"), false);
  });
  test("rejects unknown markets", () => {
    assert.equal(isOfficialSource("https://www.fda.gov/food", "XX"), false);
  });
});

describe("isForwardMove", () => {
  test("forward, including skipped steps", () => {
    assert.ok(isForwardMove("APPLICATION_SUBMITTED", "UNDER_ASSESSMENT"));
    assert.ok(isForwardMove("UNDER_ASSESSMENT", "AUTHORISED"));
  });
  test("not forward: same stage, backwards, or out of an ending", () => {
    assert.equal(isForwardMove("AUTHORISED", "AUTHORISED"), false);
    assert.equal(isForwardMove("AUTHORISED", "UNDER_ASSESSMENT"), false);
    assert.equal(isForwardMove("REJECTED", "APPLICATION_SUBMITTED"), false);
    assert.equal(isForwardMove("UNDER_ASSESSMENT", "WITHDRAWN"), false);
  });
});

describe("quote matching", () => {
  const page =
    "Article 1. The novel food “dried biomass of Xanthobacter sp. SoF1” is authorised – as specified in the Annex.";
  test("finds an exact quote", () => {
    assert.ok(quoteAppearsInText("dried biomass of Xanthobacter sp. SoF1", page));
  });
  test("ignores case, curly quotes, dashes and extra spaces", () => {
    assert.ok(quoteAppearsInText('"Dried  biomass of xanthobacter SP SoF1" is AUTHORISED', page));
  });
  test("does not match a paraphrase", () => {
    assert.equal(quoteAppearsInText("Xanthobacter biomass was approved", page), false);
  });
  test("an empty quote never matches", () => {
    assert.equal(quoteAppearsInText("   ", page), false);
  });
  test("normalises non-English letters correctly", () => {
    assert.equal(normaliseForMatch("Säilyvyys – Österreich"), "säilyvyys - österreich");
  });
});
