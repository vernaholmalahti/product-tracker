-- AlterTable
ALTER TABLE "PendingUpdate" ADD COLUMN     "checkNotes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "lastAiCheckAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UpdateRun" ADD COLUMN     "aiCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;
