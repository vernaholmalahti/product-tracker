// Development tool: removes everything created by `npm run pending:fake`, including
// test events that were approved, and puts the affected statuses back to their
// latest REAL event's stage.
//
//   npm run test-data:clean
//
// This is the one exception to "StatusEvents are never deleted": it only touches
// rows with the test source URL, which never come from a real source.
import { prisma } from "../src/db/client";
import { TEST_SOURCE_URL } from "./testData";

async function main(): Promise<void> {
  const testEvents = await prisma.statusEvent.findMany({
    where: { sourceUrl: TEST_SOURCE_URL },
    select: { productMarketStatusId: true },
  });
  const affectedStatusIds = [...new Set(testEvents.map((e) => e.productMarketStatusId))];

  const events = await prisma.statusEvent.deleteMany({ where: { sourceUrl: TEST_SOURCE_URL } });
  const pending = await prisma.pendingUpdate.deleteMany({ where: { sourceUrl: TEST_SOURCE_URL } });

  for (const statusId of affectedStatusIds) {
    const latestReal = await prisma.statusEvent.findFirst({
      where: { productMarketStatusId: statusId },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    });
    if (latestReal) {
      await prisma.productMarketStatus.update({
        where: { id: statusId },
        data: { currentStage: latestReal.stage },
      });
    }
  }
  console.log(
    `Removed ${events.count} test events and ${pending.count} test pending updates; reset ${affectedStatusIds.length} statuses.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
