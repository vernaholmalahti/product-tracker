import { Router } from "express";

// A Router is a mini-app that groups related routes.
// Later we add productRoutes.ts, adminRoutes.ts etc. in the same style.
export const healthRoutes = Router();

// GET /health – lets you (and later the hosting platform) check the server is alive.
healthRoutes.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});
