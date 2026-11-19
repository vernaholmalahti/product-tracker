// Development tool: runs ONE AI check for ONE product and prints what Claude reported.
// It does NOT save anything (no PendingUpdates) – it's for seeing the raw output.
//
// This costs real money (roughly $0.10–0.15), so it refuses to run without --spend:
//
//   npm run ai:test -- solein --spend
import { prisma } from "../src/db/client";
import { askClaudeAboutProduct } from "../src/worker/ai/askClaude";
import { isAiConfigured } from "../src/worker/ai/anthropicClient";
import { estimateCostUsd } from "../src/worker/ai/costEstimate";
import { loadProductInput } from "../src/worker/ai/productInput";

async function main(): Promise<void> {
  const slug = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!slug) {
    console.error("Usage: npm run ai:test -- <product-slug> --spend");
    process.exitCode = 1;
    return;
  }
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!product) {
    console.error(`No product with slug "${slug}".`);
    process.exitCode = 1;
    return;
  }
  const input = await loadProductInput(product.id, []);

  if (!process.argv.includes("--spend")) {
    console.log("Dry run – nothing was sent. This is what Claude would be told:\n");
    console.log(JSON.stringify(input, null, 2));
    console.log("\nAdd --spend to make the real call (costs roughly $0.10–0.15).");
    return;
  }
  if (!isAiConfigured()) {
    console.error("ANTHROPIC_API_KEY is not set in server/.env. Run `npm run ai:check` first.");
    process.exitCode = 1;
    return;
  }

  console.log(`Asking Claude about ${product.name}… (this can take a minute)`);
  const started = Date.now();
  const result = await askClaudeAboutProduct(input, new Date().toISOString().slice(0, 10));

  console.log(`\nDone in ${Math.round((Date.now() - started) / 1000)} s.`);
  console.log(`Problem: ${result.problem ?? "none"}`);
  console.log(`Report (raw, not validated yet):\n${JSON.stringify(result.report, null, 2)}`);
  console.log(`\nURLs Claude saw (${result.seenUrls.size}):`);
  for (const url of result.seenUrls) console.log(`  ${url}`);
  console.log(`\nUsage: ${JSON.stringify(result.usage)}`);
  console.log(`Estimated cost: $${estimateCostUsd(result.usage).toFixed(3)}`);
}

main()
  .catch((error: unknown) => {
    console.error("AI test failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
