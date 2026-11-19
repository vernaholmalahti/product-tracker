import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config";

// One shared Anthropic client for the worker. Created on first use, so the worker
// (and the API, which never imports this file) runs fine without an API key.
let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return config.anthropicApiKey !== null;
}

export function getAnthropicClient(): Anthropic {
  if (!config.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set in server/.env – AI search is skipped.");
  }
  client ??= new Anthropic({
    apiKey: config.anthropicApiKey,
    timeout: 120_000, // ms – one product check may run several web searches
    maxRetries: 2, // SDK retries rate limits (429), server errors and network errors
  });
  return client;
}
