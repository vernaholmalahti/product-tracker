-- AlterTable
ALTER TABLE "SourceWatch" ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "lastChangedAt" TIMESTAMP(3),
ADD COLUMN     "lastError" TEXT;

-- AlterTable
ALTER TABLE "UpdateRun" ADD COLUMN     "itemsChecked" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceChanges" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE UNIQUE INDEX "SourceWatch_url_key" ON "SourceWatch"("url");

