// Development tool: removes all fake test data (from `npm run pending:fake` and
// `npm run ai:fake-run`) and resets affected statuses to their latest real event.
//
//   npm run test-data:clean
import { prisma } from "../src/db/client";
import { cleanTestData } from "./testData";

cleanTestData()
  .then((r) =>
    console.log(`Removed ${r.events} test events and ${r.pending} test pending updates; reset ${r.statuses} statuses.`),
  )
  .catch((error: unknown) => {
    console.error("Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
