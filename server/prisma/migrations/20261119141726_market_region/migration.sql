-- Edited by hand: Prisma's version added a NOT NULL column in one step, which fails
-- because Market already has rows. So: add it nullable, fill it, then make it required.

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('EUROPE', 'AMERICAS', 'ASIA');

-- 1. Add the column without NOT NULL
ALTER TABLE "Market" ADD COLUMN "region" "Region";

-- 2. Give every existing market its region
UPDATE "Market" SET "region" = 'EUROPE'   WHERE "code" IN ('EU', 'UK');
UPDATE "Market" SET "region" = 'AMERICAS' WHERE "code" = 'US';
UPDATE "Market" SET "region" = 'ASIA'     WHERE "code" = 'SG';

-- 3. Now every row has a value, so the column can be required.
--    (If a market was missed above, this fails and the whole migration is rolled back.)
ALTER TABLE "Market" ALTER COLUMN "region" SET NOT NULL;
