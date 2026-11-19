import cors from "cors";
import express from "express";
import { deviceRoutes } from "./deviceRoutes";
import { followRoutes } from "./followRoutes";
import { healthRoutes } from "./healthRoutes";
import { marketRoutes } from "./marketRoutes";
import { productRoutes } from "./productRoutes";

// Builds the Express app but does NOT start listening.
// Keeping this separate from index.ts means tests (Phase 7) can use the app
// without opening a real network port.
export function createApp() {
  const app = express();

  // CORS: lets the web preview (localhost:8081) call this API (localhost:4000).
  // Open to all origins because the data is public and we don't use cookies;
  // admin routes (Phase 4) are protected by a token instead.
  // The phone app doesn't need CORS – only browsers enforce it.
  app.use(cors());

  // Parse JSON request bodies (needed later for POST /follow, admin approve etc.)
  app.use(express.json());

  app.use(healthRoutes);
  app.use(productRoutes);
  app.use(marketRoutes);
  app.use(deviceRoutes);
  app.use(followRoutes);

  return app;
}
