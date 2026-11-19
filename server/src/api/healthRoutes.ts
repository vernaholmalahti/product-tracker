import { Router } from "express";
import { prisma } from "../db/client";

// A Router is a mini-app that groups related routes.
// Later we add productRoutes.ts, adminRoutes.ts etc. in the same style.
export const healthRoutes = Router();

// Asks the database the smallest possible question. True if it answers.
async function isDatabaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// GET /health – lets you (and later the hosting platform) check the server
// and its database are alive. 503 = "service unavailable".
healthRoutes.get("/health", async (_req, res) => {
  const databaseOk = await isDatabaseReachable();
  res.status(databaseOk ? 200 : 503).json({
    status: databaseOk ? "ok" : "degraded",
    database: databaseOk ? "ok" : "unreachable",
    time: new Date().toISOString(),
  });
});
