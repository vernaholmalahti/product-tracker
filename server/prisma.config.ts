// Prisma CLI configuration (used by `prisma migrate`, `prisma generate`, `prisma db seed`).
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Load server/.env with Node's built-in loader (same approach as src/config.ts, no dotenv package).
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
