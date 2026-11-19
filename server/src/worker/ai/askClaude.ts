import type Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config";
import { getAnthropicClient } from "./anthropicClient";
import { findingsToolSchema, REPORT_TOOL_NAME } from "./findingsSchema";
import { buildUserMessage, type ProductPromptInput, SYSTEM_PROMPT } from "./prompt";

type BetaMessage = Anthropic.Beta.Messages.BetaMessage;
type BetaContentBlock = Anthropic.Beta.Messages.BetaContentBlock;
type BetaMessageParam = Anthropic.Beta.Messages.BetaMessageParam;

const MAX_REQUESTS = 4; // pause_turn continuations + one reminder; stops runaway loops
const MAX_SEARCHES = 5; // per product (AI_UPDATE_PIPELINE.md section 8)
const MAX_FETCHES = 3; // for opening the changed official pages

export type AiUsage = {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches: number;
};

export type AiResult = {
  report: unknown | null; // raw report_findings input – NOT trusted yet, validated by the caller
  seenUrls: Set<string>; // every URL that came back from web search / web fetch in this conversation
  usage: AiUsage;
  problem: string | null; // why there is no report (refusal, max_tokens, no tool call…)
};

// URLs Claude was actually shown: search results, fetched pages and cited pages.
// A finding's sourceUrl must be one of these (AI_UPDATE_PIPELINE.md section 5).
function collectUrls(content: BetaContentBlock[], into: Set<string>): void {
  for (const block of content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const result of block.content) into.add(result.url);
    }
    if (block.type === "web_fetch_tool_result" && block.content.type === "web_fetch_result") {
      into.add(block.content.url);
    }
    if (block.type === "text") {
      for (const citation of block.citations ?? []) {
        if (citation.type === "web_search_result_location") into.add(citation.url);
      }
    }
  }
}

function addUsage(total: AiUsage, message: BetaMessage): void {
  total.requests++;
  total.inputTokens += message.usage.input_tokens;
  total.outputTokens += message.usage.output_tokens;
  total.cacheReadTokens += message.usage.cache_read_input_tokens ?? 0;
  total.cacheWriteTokens += message.usage.cache_creation_input_tokens ?? 0;
  total.webSearches += message.usage.server_tool_use?.web_search_requests ?? 0;
}

function findReport(content: BetaContentBlock[]): unknown | null {
  const call = content.find((block) => block.type === "tool_use" && block.name === REPORT_TOOL_NAME);
  return call && call.type === "tool_use" ? call.input : null;
}

// One AI check for one product: Claude searches the web and ends by calling report_findings.
export async function askClaudeAboutProduct(input: ProductPromptInput, today: string): Promise<AiResult> {
  const client = getAnthropicClient();
  const usage: AiUsage = { requests: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, webSearches: 0 };
  const seenUrls = new Set<string>();
  const messages: BetaMessageParam[] = [{ role: "user", content: buildUserMessage(input, today) }];
  let reminded = false;

  for (let i = 0; i < MAX_REQUESTS; i++) {
    const message = await client.beta.messages.create({
      model: config.anthropicModel,
      max_tokens: 16_000,
      // Stable system prompt with a cache breakpoint: repeated calls (one per product) reuse it.
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: MAX_FETCHES },
        findingsToolSchema(input.markets.map((m) => m.marketCode)),
      ],
      output_config: { effort: "medium" },
      // If a safety classifier declines, the API retries on a suitable fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages,
    });
    addUsage(usage, message);
    collectUrls(message.content, seenUrls);

    const report = findReport(message.content);
    if (report !== null) return { report, seenUrls, usage, problem: null };

    if (message.stop_reason === "pause_turn") {
      // Long server-side search turn: send it back unchanged and the API continues.
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    if (message.stop_reason === "refusal") return { report: null, seenUrls, usage, problem: "refusal" };
    if (message.stop_reason === "max_tokens") return { report: null, seenUrls, usage, problem: "max_tokens" };

    // Finished without calling the tool (we can't force it on this model): remind once.
    if (!reminded) {
      reminded = true;
      messages.push({ role: "assistant", content: message.content });
      messages.push({
        role: "user",
        content: `Please call ${REPORT_TOOL_NAME} now with your findings (an empty list if nothing new).`,
      });
      continue;
    }
    return { report: null, seenUrls, usage, problem: `no ${REPORT_TOOL_NAME} call (stop_reason ${message.stop_reason})` };
  }
  return { report: null, seenUrls, usage, problem: `gave up after ${MAX_REQUESTS} requests` };
}
