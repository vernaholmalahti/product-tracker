import { existsSync } from "node:fs";
import path from "node:path";

// server/.env – resolved from this file's folder, so it works from src/ (tsx) and dist/ (built).
const envFilePath = path.resolve(__dirname, "../.env");

// Node 24 can read .env files itself, so we don't need the "dotenv" package.
// The file is optional: on a hosting platform the variables are set in its dashboard instead.
if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

// Reads a setting that must exist. Fails at startup with a clear message
// instead of crashing later with a confusing database error.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy server/.env.example to server/.env and fill it in.`);
  }
  return value;
}

// The Anthropic key is optional: without it the worker still checks official pages
// and skips the AI part. The placeholder from .env.example counts as "not set".
function readApiKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "sk-ant-your-key-here") return null;
  return key;
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a whole number ≥ 0 (got "${raw}").`);
  }
  return value;
}

// One typed place for all settings. Other files import `config` instead of
// reading process.env directly. Settings are added here as later phases need them.
export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: requireEnv("DATABASE_URL"),
  adminToken: requireEnv("ADMIN_TOKEN"), // protects /admin/* routes (Phase 4)
  // When the daily worker runs (cron: minute hour day month weekday), and in which time zone.
  workerCron: process.env.WORKER_CRON ?? "0 6 * * *",
  workerTimezone: process.env.WORKER_TIMEZONE ?? "Europe/Helsinki",
  // AI search (Phase 6) – used ONLY by the worker, never by the API or the app (ground rule 1).
  anthropicApiKey: readApiKey(),
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
  aiMaxCallsPerRun: readPositiveInt("AI_MAX_CALLS_PER_RUN", 10), // cost limit (ground rule 6)
};

// The placeholder from .env.example is fine on your laptop, but never in production.
if (config.adminToken === "change-me") {
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_TOKEN is still the placeholder 'change-me'. Set a long random value.");
  }
  console.warn("⚠️  ADMIN_TOKEN is the placeholder 'change-me' – fine for local development only.");
}
