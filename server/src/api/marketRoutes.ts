import { Router } from "express";
import { prisma } from "../db/client";

export const marketRoutes = Router();

// GET /markets – all markets with their region, for the app's market filter.
// Includes markets that no product has data for yet (e.g. UK).
marketRoutes.get("/markets", async (_req, res) => {
  const markets = await prisma.market.findMany({
    orderBy: [{ region: "asc" }, { name: "asc" }],
    select: { code: true, name: true, region: true },
  });
  res.json(markets);
});
