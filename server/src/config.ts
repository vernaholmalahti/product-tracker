import { existsSync } from "node:fs";
import path from "node:path";

// server/.env – resolved from this file's folder, so it works from src/ (tsx) and dist/ (built).
const envFilePath = path.resolve(__dirname, "../.env");

// Node 24 can read .env files itself, so we don't need the "dotenv" package.
// The file is optional: on a hosting platform the variables are set in its dashboard instead.
if (existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

// One typed place for all settings. Other files import `config` instead of
// reading process.env directly. Settings are added here as later phases need them.
export const config = {
  port: Number(process.env.PORT ?? 4000),
};
