// Checks that ANTHROPIC_API_KEY and ANTHROPIC_MODEL work, without spending money:
// the Models API only returns information about the model (no tokens, no searches).
//
//   npm run ai:check
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../src/config";
import { getAnthropicClient, isAiConfigured } from "../src/worker/ai/anthropicClient";

async function main(): Promise<void> {
  if (!isAiConfigured()) {
    console.log("ANTHROPIC_API_KEY is not set in server/.env yet (or still the placeholder).");
    process.exitCode = 1;
    return;
  }
  try {
    const model = await getAnthropicClient().models.retrieve(config.anthropicModel);
    console.log(`✓ API key works. Model: ${model.display_name} (${model.id})`);
    console.log(`  Context window: ${model.max_input_tokens} tokens, max output: ${model.max_tokens} tokens`);
    console.log(`  AI calls allowed per worker run: ${config.aiMaxCallsPerRun}`);
  } catch (error) {
    // Typed SDK errors, most specific first, so the message says what to fix.
    if (error instanceof Anthropic.AuthenticationError) {
      console.log("✗ The API key was rejected (401). Check ANTHROPIC_API_KEY in server/.env.");
    } else if (error instanceof Anthropic.NotFoundError) {
      console.log(`✗ Model "${config.anthropicModel}" not found (404). Check ANTHROPIC_MODEL.`);
    } else if (error instanceof Anthropic.APIConnectionError) {
      console.log("✗ Could not reach the Anthropic API. Check your internet connection.");
    } else {
      throw error;
    }
    process.exitCode = 1;
  }
}

void main();
