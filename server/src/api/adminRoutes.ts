import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client";
import { publishUpdate, rejectUpdate, UpdateError } from "../updates/publishUpdate";
import { requireAdmin } from "./requireAdmin";

export const adminRoutes = Router();

// Every route in this router needs the admin token.
adminRoutes.use("/admin", requireAdmin);

// GET /admin/check – lets the login form test a token (204 = correct, 401 = wrong).
adminRoutes.get("/admin/check", (_req, res) => {
  res.status(204).end();
});

// GET /admin/pending-updates – updates waiting for review, oldest first.
adminRoutes.get("/admin/pending-updates", async (_req, res) => {
  const updates = await prisma.pendingUpdate.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      productMarketStatus: {
        select: {
          currentStage: true,
          marketCode: true,
          market: { select: { name: true } },
          product: { select: { slug: true, name: true, category: true } },
        },
      },
    },
  });
  res.json(
    updates.map(({ productMarketStatus: pms, ...update }) => ({
      id: update.id,
      product: pms.product,
      marketCode: pms.marketCode,
      marketName: pms.market.name,
      currentStage: pms.currentStage,
      proposedStage: update.proposedStage,
      eventDate: update.eventDate?.toISOString().slice(0, 10) ?? null,
      eventDatePrecision: update.eventDatePrecision,
      title: update.title,
      summary: update.summary,
      sourceUrl: update.sourceUrl,
      sourceType: update.sourceType,
      evidenceQuote: update.evidenceQuote,
      checkNotes: update.checkNotes, // why it was not auto-published
      confidence: update.confidence,
      origin: update.origin,
      createdAt: update.createdAt,
    })),
  );
});

// GET /admin/update-runs – the latest worker runs, newest first (default 10, max 50).
adminRoutes.get("/admin/update-runs", async (req, res) => {
  const limit = z.coerce.number().int().min(1).max(50).catch(10).parse(req.query.limit);
  const runs = await prisma.updateRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
  res.json(runs);
});

const approveBody = z.object({
  eventDate: z.iso.date().optional(), // "YYYY-MM-DD", only needed if the update has no date
  eventDatePrecision: z.enum(["DAY", "MONTH"]).optional(),
});

// POST /admin/pending-updates/:id/approve – publish it (creates the timeline event, notifies followers).
adminRoutes.post("/admin/pending-updates/:id/approve", async (req, res) => {
  const body = approveBody.safeParse(req.body ?? {});
  if (!body.success) {
    res.status(400).json({ error: "Optional body: { eventDate: 'YYYY-MM-DD', eventDatePrecision: 'DAY' | 'MONTH' }" });
    return;
  }
  try {
    const event = await publishUpdate(req.params.id, { publishedBy: "ADMIN", ...body.data });
    res.json({ published: event.id });
  } catch (error) {
    if (error instanceof UpdateError) {
      res.status(error.httpStatus).json({ error: error.message });
      return;
    }
    throw error; // unexpected: let Express answer 500
  }
});

const rejectBody = z.object({
  reviewNote: z.string().trim().min(3, "Give a short reason (at least 3 characters)."),
});

// POST /admin/pending-updates/:id/reject – mark as rejected with a reason.
adminRoutes.post("/admin/pending-updates/:id/reject", async (req, res) => {
  const body = rejectBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Body must be { reviewNote: string } with a short reason." });
    return;
  }
  try {
    await rejectUpdate(req.params.id, body.data.reviewNote);
    res.status(204).end();
  } catch (error) {
    if (error instanceof UpdateError) {
      res.status(error.httpStatus).json({ error: error.message });
      return;
    }
    throw error;
  }
});
