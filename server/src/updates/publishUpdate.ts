import { prisma } from "../db/client";
import type { DatePrecision, PublishedBy } from "../generated/prisma/client";
import { stageLabel } from "../content/stageLabels";
import { notifyFollowers } from "../notifications/notifyFollowers";

// An error the API can turn into a clear HTTP answer.
export class UpdateError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
  }
}

type PublishOptions = {
  publishedBy: Extract<PublishedBy, "ADMIN" | "AUTO">; // ADMIN = approved by a person, AUTO = official-source rule (Phase 6)
  eventDate?: string; // "YYYY-MM-DD" – required if the pending update has no date
  eventDatePrecision?: DatePrecision;
};

// Turns a PendingUpdate into a published StatusEvent (ground rule 2: the ONLY way to publish).
// Everything inside the transaction succeeds together or not at all.
export async function publishUpdate(pendingUpdateId: string, options: PublishOptions) {
  const published = await prisma.$transaction(async (tx) => {
    // Claim the update: only succeeds if it is still PENDING. If two admins click
    // Approve at the same time, the second one gets count 0 and stops here.
    const claimed = await tx.pendingUpdate.updateMany({
      where: { id: pendingUpdateId, status: "PENDING" },
      data: { status: options.publishedBy === "AUTO" ? "AUTO_PUBLISHED" : "APPROVED" },
    });
    if (claimed.count === 0) throw new UpdateError("Update not found or already reviewed.", 409);

    const update = await tx.pendingUpdate.findUniqueOrThrow({
      where: { id: pendingUpdateId },
      include: { productMarketStatus: { include: { product: true, market: true } } },
    });

    const eventDate = options.eventDate ? new Date(options.eventDate) : update.eventDate;
    if (!eventDate) throw new UpdateError("This update has no event date – send eventDate (YYYY-MM-DD).", 400);

    const event = await tx.statusEvent.create({
      data: {
        productMarketStatusId: update.productMarketStatusId,
        stage: update.proposedStage,
        eventDate,
        eventDatePrecision: options.eventDatePrecision ?? update.eventDatePrecision,
        title: update.title,
        summary: update.summary,
        sourceUrl: update.sourceUrl, // ground rule 3: always stored with its source
        sourceType: update.sourceType,
        publishedBy: options.publishedBy,
      },
    });

    await tx.productMarketStatus.update({
      where: { id: update.productMarketStatusId },
      data: { currentStage: update.proposedStage, lastCheckedAt: new Date() },
    });

    return { event, status: update.productMarketStatus };
  });

  // After the transaction: a failed notification must not undo the published event.
  const { product, market } = published.status;
  try {
    await notifyFollowers(product.id, {
      title: `${product.name} – ${market.name}`,
      body: `New status: ${stageLabel(published.event.stage, product.category, market.code)}. Open Ripe to see the source.`,
      marketCode: market.code,
    });
  } catch (error) {
    console.warn("Published, but sending notifications failed:", error);
  }

  return published.event;
}

// Marks a PendingUpdate as rejected with a reason. Nothing is published.
export async function rejectUpdate(pendingUpdateId: string, reviewNote: string): Promise<void> {
  const result = await prisma.pendingUpdate.updateMany({
    where: { id: pendingUpdateId, status: "PENDING" },
    data: { status: "REJECTED", reviewNote },
  });
  if (result.count === 0) throw new UpdateError("Update not found or already reviewed.", 409);
}
