import express from "express";
import { healthRoutes } from "./healthRoutes";
import { productRoutes } from "./productRoutes";

// Builds the Express app but does NOT start listening.
// Keeping this separate from index.ts means tests (Phase 7) can use the app
// without opening a real network port.
export function createApp() {
  const app = express();

  // Parse JSON request bodies (needed later for POST /follow, admin approve etc.)
  app.use(express.json());

  app.use(healthRoutes);
  app.use(productRoutes);

  return app;
}
