import { prisma } from "../db/client";
import { sendPushMessages, type PushResult } from "./expoPush";

export type FollowerMessage = {
  title: string;
  body: string;
  marketCode?: string; // the market that changed; followers of "all markets" are always included
};

// Push tokens of devices that follow this product (for all markets, or for this market).
async function findFollowerTokens(productId: string, marketCode?: string): Promise<string[]> {
  const devices = await prisma.device.findMany({
    where: {
      expoPushToken: { not: null },
      follows: {
        some: {
          productId,
          OR: [{ marketCode: null }, ...(marketCode ? [{ marketCode }] : [])],
        },
      },
    },
    select: { expoPushToken: true },
  });
  return devices.flatMap((device) => (device.expoPushToken ? [device.expoPushToken] : []));
}

// Tokens Expo says are dead (app uninstalled): forget them so we stop sending.
async function removeInvalidTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await prisma.device.updateMany({
    where: { expoPushToken: { in: tokens } },
    data: { expoPushToken: null },
  });
}

// Sends a push notification to everyone who follows the product.
// Used when a status change is published (Phase 4 approve, Phase 6 auto-publish).
export async function notifyFollowers(productId: string, message: FollowerMessage): Promise<PushResult> {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, select: { slug: true } });
  const tokens = await findFollowerTokens(productId, message.marketCode);
  if (tokens.length === 0) return { sent: 0, failed: 0, invalidTokens: [] };

  const result = await sendPushMessages(
    tokens.map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: { productSlug: product.slug }, // lets the app open the product when tapped
    })),
  );
  await removeInvalidTokens(result.invalidTokens);
  return result;
}
