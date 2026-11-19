-- CreateEnum
CREATE TYPE "Category" AS ENUM ('NOVEL_FOOD', 'SUPPLEMENT_INGREDIENT');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('NOT_SUBMITTED', 'APPLICATION_SUBMITTED', 'UNDER_ASSESSMENT', 'POSITIVE_SAFETY_OPINION', 'AUTHORISED', 'ON_MARKET', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL', 'COMPANY', 'NEWS');

-- CreateEnum
CREATE TYPE "PublishedBy" AS ENUM ('SEED', 'AUTO', 'ADMIN');

-- CreateEnum
CREATE TYPE "UpdateOrigin" AS ENUM ('SOURCE_CHECK', 'AI_SEARCH');

-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_PUBLISHED');

-- CreateEnum
CREATE TYPE "SourceWatchKind" AS ENUM ('RSS', 'PAGE_HASH', 'SEARCH_PAGE');

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "company" TEXT,
    "shortDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "searchKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ProductMarketStatus" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "marketCode" TEXT NOT NULL,
    "currentStage" "Stage" NOT NULL,
    "expectedNext" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductMarketStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" UUID NOT NULL,
    "productMarketStatusId" UUID NOT NULL,
    "stage" "Stage" NOT NULL,
    "eventDate" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "publishedBy" "PublishedBy" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingUpdate" (
    "id" UUID NOT NULL,
    "productMarketStatusId" UUID NOT NULL,
    "proposedStage" "Stage" NOT NULL,
    "eventDate" DATE,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "evidenceQuote" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "origin" "UpdateOrigin" NOT NULL,
    "status" "PendingStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "updateRunId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceWatch" (
    "id" UUID NOT NULL,
    "productId" UUID,
    "marketCode" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "SourceWatchKind" NOT NULL,
    "lastHash" TEXT,
    "lastCheckedAt" TIMESTAMP(3),

    CONSTRAINT "SourceWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateRun" (
    "id" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "aiCallsUsed" INTEGER NOT NULL DEFAULT 0,
    "changesFound" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "UpdateRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL,
    "expoPushToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "marketCode" TEXT,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMarketStatus_productId_marketCode_key" ON "ProductMarketStatus"("productId", "marketCode");

-- CreateIndex
CREATE INDEX "StatusEvent_productMarketStatusId_eventDate_idx" ON "StatusEvent"("productMarketStatusId", "eventDate");

-- CreateIndex
CREATE INDEX "PendingUpdate_status_idx" ON "PendingUpdate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_deviceId_productId_marketCode_key" ON "Follow"("deviceId", "productId", "marketCode");

-- AddForeignKey
ALTER TABLE "ProductMarketStatus" ADD CONSTRAINT "ProductMarketStatus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMarketStatus" ADD CONSTRAINT "ProductMarketStatus_marketCode_fkey" FOREIGN KEY ("marketCode") REFERENCES "Market"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_productMarketStatusId_fkey" FOREIGN KEY ("productMarketStatusId") REFERENCES "ProductMarketStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingUpdate" ADD CONSTRAINT "PendingUpdate_productMarketStatusId_fkey" FOREIGN KEY ("productMarketStatusId") REFERENCES "ProductMarketStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingUpdate" ADD CONSTRAINT "PendingUpdate_updateRunId_fkey" FOREIGN KEY ("updateRunId") REFERENCES "UpdateRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceWatch" ADD CONSTRAINT "SourceWatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceWatch" ADD CONSTRAINT "SourceWatch_marketCode_fkey" FOREIGN KEY ("marketCode") REFERENCES "Market"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_marketCode_fkey" FOREIGN KEY ("marketCode") REFERENCES "Market"("code") ON DELETE SET NULL ON UPDATE CASCADE;
