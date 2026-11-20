// Run: npm test
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { relevantChangedPages, shouldCheckProduct } from "./schedule";

const now = new Date("2026-11-20T06:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const decide = (lastAiCheckAt: Date | null, hasRelevantChangedPage: boolean) =>
  shouldCheckProduct({ lastAiCheckAt, hasRelevantChangedPage, now, fullCheckDays: 7 });

describe("shouldCheckProduct", () => {
  test("a product that was never checked is checked", () => {
    assert.equal(decide(null, false).check, true);
  });
  test("a changed official page triggers a check (yesterday's check is old enough)", () => {
    assert.equal(decide(hoursAgo(24), true).check, true);
  });
  test("no change and checked 3 days ago: wait", () => {
    const decision = decide(hoursAgo(72), false);
    assert.equal(decision.check, false);
    assert.match(decision.reason, /next full check in 4 days/);
  });
  test("no change but 7 days since the last check: weekly full check", () => {
    assert.equal(decide(hoursAgo(7 * 24), false).check, true);
  });
  test("never twice within 20 hours, even if a page changed", () => {
    assert.equal(decide(hoursAgo(5), true).check, false);
    assert.equal(decide(hoursAgo(19.9), true).check, false);
    assert.equal(decide(hoursAgo(20), true).check, true);
  });
});

describe("relevantChangedPages", () => {
  const pages = [
    { label: "EU Union list", url: "https://a", marketCode: "EU", productId: null },
    { label: "UK register", url: "https://b", marketCode: "UK", productId: null },
    { label: "Solein page", url: "https://c", marketCode: "UK", productId: "solein-id" },
    { label: "Other product page", url: "https://d", marketCode: "EU", productId: "other-id" },
  ];
  test("general pages for the product's markets and pages about the product itself", () => {
    const labels = relevantChangedPages("solein-id", ["EU", "US", "SG"], pages).map((p) => p.label);
    assert.deepEqual(labels, ["EU Union list", "Solein page"]);
  });
  test("nothing relevant for a product in other markets", () => {
    assert.deepEqual(relevantChangedPages("nmn-id", ["US"], pages), []);
  });
});
