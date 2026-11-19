import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client";

export const followRoutes = Router();

// Body for follow/unfollow. marketCode is optional: left out (null) = all markets.
// The app follows whole products for now; per-market following can use the same route later.
const followBody = z.object({
  deviceId: z.uuid(),
  productSlug: z.string().min(1),
  marketCode: z.string().min(2).nullable().default(null),
});

type FollowInput = z.infer<typeof followBody>; // the TypeScript type, derived from the schema

async function findProductId(slug: string): Promise<string | null> {
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  return product?.id ?? null;
}

// Creates the follow unless it already exists.
// We check first instead of relying on the database: in PostgreSQL two NULLs count as
// different values, so @@unique([deviceId, productId, marketCode]) would allow the same
// "all markets" follow (marketCode = NULL) twice.
async function addFollow(input: FollowInput, productId: string): Promise<void> {
  // The device may not be registered yet if the app's start-up registration failed.
  await prisma.device.upsert({ where: { id: input.deviceId }, update: {}, create: { id: input.deviceId } });

  const existing = await prisma.follow.findFirst({
    where: { deviceId: input.deviceId, productId, marketCode: input.marketCode },
  });
  if (existing) return;

  await prisma.follow.create({
    data: { deviceId: input.deviceId, productId, marketCode: input.marketCode },
  });
}

// POST /follows – follow a product. Calling it twice is harmless.
followRoutes.post("/follows", async (req, res) => {
  const parsed = followBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Body must be { deviceId: <uuid>, productSlug: string, marketCode?: string }" });
    return;
  }
  const productId = await findProductId(parsed.data.productSlug);
  if (!productId) {
    res.status(404).json({ error: `No product with slug "${parsed.data.productSlug}"` });
    return;
  }
  await addFollow(parsed.data, productId);
  res.status(204).end();
});

// DELETE /follows – unfollow. Also harmless if the follow doesn't exist.
followRoutes.delete("/follows", async (req, res) => {
  const parsed = followBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Body must be { deviceId: <uuid>, productSlug: string, marketCode?: string }" });
    return;
  }
  const productId = await findProductId(parsed.data.productSlug);
  if (productId) {
    await prisma.follow.deleteMany({
      where: { deviceId: parsed.data.deviceId, productId, marketCode: parsed.data.marketCode },
    });
  }
  res.status(204).end();
});

// GET /devices/:deviceId/follows – what this device follows (product slugs).
followRoutes.get("/devices/:deviceId/follows", async (req, res) => {
  const deviceId = z.uuid().safeParse(req.params.deviceId);
  if (!deviceId.success) {
    res.status(400).json({ error: "deviceId must be a uuid" });
    return;
  }
  const follows = await prisma.follow.findMany({
    where: { deviceId: deviceId.data },
    select: { marketCode: true, product: { select: { slug: true } } },
  });
  res.json(follows.map((follow) => ({ productSlug: follow.product.slug, marketCode: follow.marketCode })));
});
