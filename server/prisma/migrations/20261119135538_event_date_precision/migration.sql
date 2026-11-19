-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('DAY', 'MONTH');

-- AlterTable
ALTER TABLE "PendingUpdate" ADD COLUMN     "eventDatePrecision" "DatePrecision" NOT NULL DEFAULT 'DAY';

-- AlterTable
ALTER TABLE "StatusEvent" ADD COLUMN     "eventDatePrecision" "DatePrecision" NOT NULL DEFAULT 'DAY';
