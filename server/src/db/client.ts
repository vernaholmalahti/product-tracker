import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { config } from "../config";

// The adapter is Prisma 7's link to PostgreSQL (it uses the standard `pg` driver).
const adapter = new PrismaPg({ connectionString: config.databaseUrl });

// One shared client for the whole process. It keeps a pool of database
// connections, so creating a new client per request would waste connections.
// The API and (later) the worker both import this.
export const prisma = new PrismaClient({ adapter });
