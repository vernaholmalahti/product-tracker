// Development tool: creates a FAKE pending update to try the admin review flow
// before the real update worker exists (Phase 5–6).
//
//   npm run pending:fake -- solein EU AUTHORISED
//
// Clearly marked as test data; remove it with `npm run test-data:clean`.
import { prisma } from "../src/db/client";
import { Stage } from "../src/generated/prisma/client";
import { TEST_SOURCE_URL } from "./testData";

function isStage(value: string): value is Stage {
  return Object.values(Stage).includes(value as Stage);
}

async function main(): Promise<void> {
  const [slug, marketCode, stage] = process.argv.slice(2);
  if (!slug || !marketCode || !stage || !isStage(stage)) {
    console.error(`Usage: npm run pending:fake -- <slug> <market> <stage>\nStages: ${Object.values(Stage).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const status = await prisma.productMarketStatus.findFirst({
    where: { product: { slug }, marketCode },
    include: { product: true },
  });
  if (!status) {
    console.error(`No status for "${slug}" in market "${marketCode}".`);
    process.exitCode = 1;
    return;
  }

  const update = await prisma.pendingUpdate.create({
    data: {
      productMarketStatusId: status.id,
      proposedStage: stage,
      eventDate: new Date(new Date().toISOString().slice(0, 10)), // today, date only
      title: `[TEST] ${status.product.name}: ${stage} in ${marketCode}`,
      summary: "Fake update created by `npm run pending:fake` to test the admin review flow. Not real news.",
      sourceUrl: TEST_SOURCE_URL,
      sourceType: "NEWS",
      evidenceQuote: "Test data – this is not a real source.",
      confidence: 0.5,
      origin: "AI_SEARCH",
    },
  });
  console.log(`Created fake pending update ${update.id} (${slug} ${marketCode} → ${stage}).`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
