// Development test data: how to recognise it, and how to remove it.
import { prisma } from "../src/db/client";

// Fake source used by `npm run pending:fake`.
export const TEST_SOURCE_URL = "https://example.com/ripe-test-data";
// Every fake title starts with this (pending:fake and the fake-Claude test).
export const TEST_TITLE_PREFIX = "[TEST]";

const isTestData = {
  OR: [{ sourceUrl: TEST_SOURCE_URL }, { title: { startsWith: TEST_TITLE_PREFIX } }],
};

// Removes all test events and test pending updates, then puts every affected status
// back to the stage of its latest REAL event. The one deliberate exception to
// "StatusEvents are never deleted": it only touches rows that are marked as test data.
export async function cleanTestData(): Promise<{ events: number; pending: number; statuses: number }> {
  const testEvents = await prisma.statusEvent.findMany({ where: isTestData, select: { productMarketStatusId: true } });
  const affectedStatusIds = [...new Set(testEvents.map((e) => e.productMarketStatusId))];

  const events = await prisma.statusEvent.deleteMany({ where: isTestData });
  const pending = await prisma.pendingUpdate.deleteMany({ where: isTestData });

  for (const statusId of affectedStatusIds) {
    const latestReal = await prisma.statusEvent.findFirst({
      where: { productMarketStatusId: statusId },
      orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    });
    if (latestReal) {
      await prisma.productMarketStatus.update({ where: { id: statusId }, data: { currentStage: latestReal.stage } });
    }
  }
  return { events: events.count, pending: pending.count, statuses: affectedStatusIds.length };
}
