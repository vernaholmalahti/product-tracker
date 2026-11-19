// Development tool for the Phase 3 demo: sends followers a notification about a
// product's CURRENT status in one market.
//
//   1. Change the stage in Prisma Studio (ProductMarketStatus.currentStage)
//   2. npm run notify:status -- solein EU
//
// In the real app this happens automatically when an admin approves an update (Phase 4).
import { prisma } from "../src/db/client";
import { stageLabel } from "../src/content/stageLabels";
import { notifyFollowers } from "../src/notifications/notifyFollowers";

async function main(): Promise<void> {
  const [slug, marketCode] = process.argv.slice(2);
  if (!slug || !marketCode) {
    console.error("Usage: npm run notify:status -- <product-slug> <market-code>   e.g. solein EU");
    process.exitCode = 1;
    return;
  }

  const status = await prisma.productMarketStatus.findFirst({
    where: { product: { slug }, marketCode },
    include: { product: true, market: true },
  });
  if (!status) {
    console.error(`No status for "${slug}" in market "${marketCode}".`);
    process.exitCode = 1;
    return;
  }

  const label = stageLabel(status.currentStage, status.product.category, marketCode);
  const result = await notifyFollowers(status.productId, {
    title: `${status.product.name} – ${status.market.name}`,
    body: `New status: ${label}. Open Ripe to see the source.`,
    marketCode,
  });
  console.log(`Sent ${result.sent}, failed ${result.failed}, removed ${result.invalidTokens.length} dead tokens.`);
  if (result.sent === 0 && result.failed === 0) {
    console.log("Nobody to notify: follow the product in the app (with notifications allowed) first.");
  }
}

main()
  .catch((error: unknown) => {
    console.error("Notify failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
