import { Router } from "express";
import { prisma } from "../db/client";

export const productRoutes = Router();

// Dates in the database are date-only (@db.Date). Send them as "YYYY-MM-DD"
// instead of "2022-09-01T00:00:00.000Z" so the app never shows a fake time or timezone shift.
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─── Queries ────────────────────────────────────────────────────────────────

// List view: each product with its current stage per market (no timelines).
async function findAllProducts() {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      category: true,
      company: true,
      shortDescription: true,
      imageUrl: true,
      marketStatuses: {
        orderBy: { marketCode: "asc" },
        select: {
          marketCode: true,
          market: { select: { name: true } },
          currentStage: true,
          expectedNext: true,
          lastCheckedAt: true,
        },
      },
    },
  });
}

// Detail view: one product with the full timeline (oldest event first) per market.
async function findProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      category: true,
      company: true,
      shortDescription: true,
      imageUrl: true,
      marketStatuses: {
        orderBy: { marketCode: "asc" },
        select: {
          marketCode: true,
          market: { select: { name: true } },
          currentStage: true,
          expectedNext: true,
          lastCheckedAt: true,
          events: {
            orderBy: { eventDate: "asc" },
            select: {
              stage: true,
              eventDate: true,
              eventDatePrecision: true,
              title: true,
              summary: true,
              sourceUrl: true,
              sourceType: true,
            },
          },
        },
      },
    },
  });
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /products – all products with a short status per market.
productRoutes.get("/products", async (_req, res) => {
  const products = await findAllProducts();
  res.json(
    products.map(({ marketStatuses, ...product }) => ({
      ...product,
      markets: marketStatuses.map(({ market, ...status }) => ({
        ...status,
        marketName: market.name,
      })),
    })),
  );
});

// GET /products/:slug – one product with its timelines. 404 if the slug is unknown.
productRoutes.get("/products/:slug", async (req, res) => {
  const product = await findProductBySlug(req.params.slug);
  if (!product) {
    res.status(404).json({ error: `No product with slug "${req.params.slug}"` });
    return;
  }

  const { marketStatuses, ...fields } = product;
  res.json({
    ...fields,
    markets: marketStatuses.map(({ market, events, ...status }) => ({
      ...status,
      marketName: market.name,
      events: events.map((event) => ({ ...event, eventDate: toDateString(event.eventDate) })),
    })),
  });
});
