import type { AiUsage } from "./askClaude";

// Claude API list prices for Claude Sonnet 5.5, November 2026 (USD). Only an estimate –
// the real bill is in the Anthropic Console. Update if prices or the model change.
const PRICE_PER_MILLION = {
  input: 2.0,
  output: 10.0,
  cacheRead: 0.1,
  cacheWrite: 2.5, // 1.25 × input, 5-minute cache
};
const PRICE_PER_SEARCH = 0.01; // $10 per 1,000 web searches

export function estimateCostUsd(usage: AiUsage): number {
  const tokens =
    usage.inputTokens * PRICE_PER_MILLION.input +
    usage.outputTokens * PRICE_PER_MILLION.output +
    usage.cacheReadTokens * PRICE_PER_MILLION.cacheRead +
    usage.cacheWriteTokens * PRICE_PER_MILLION.cacheWrite;
  return tokens / 1_000_000 + usage.webSearches * PRICE_PER_SEARCH;
}
