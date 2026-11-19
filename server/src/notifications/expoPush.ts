// Sends push notifications through Expo's push service, which forwards them to
// Firebase (Android) or Apple (iOS). Docs: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const MAX_MESSAGES_PER_REQUEST = 100; // Expo's limit per request

export type PushMessage = {
  to: string; // ExponentPushToken[...]
  title: string;
  body: string;
  data?: Record<string, string>; // read by the app when the notification is tapped
};

// Expo answers with one "ticket" per message, in the same order.
type PushTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message: string; details?: { error?: string } };

export type PushResult = {
  sent: number;
  failed: number;
  invalidTokens: string[]; // tokens of uninstalled apps – should be removed from the database
};

function splitIntoChunks<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function sendChunk(messages: PushMessage[]): Promise<PushTicket[]> {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages.map((m) => ({ ...m, sound: "default", channelId: "default" }))),
  });
  if (!response.ok) {
    throw new Error(`Expo push service answered ${response.status}: ${await response.text()}`);
  }
  const json = (await response.json()) as { data: PushTicket[] };
  return json.data;
}

export async function sendPushMessages(messages: PushMessage[]): Promise<PushResult> {
  const result: PushResult = { sent: 0, failed: 0, invalidTokens: [] };

  for (const chunk of splitIntoChunks(messages, MAX_MESSAGES_PER_REQUEST)) {
    const tickets = await sendChunk(chunk);
    tickets.forEach((ticket, index) => {
      if (ticket.status === "ok") {
        result.sent++;
        return;
      }
      result.failed++;
      console.warn(`Push failed for ${chunk[index]?.to}: ${ticket.message}`);
      // "DeviceNotRegistered" = the app was uninstalled or the token expired.
      if (ticket.details?.error === "DeviceNotRegistered" && chunk[index]) {
        result.invalidTokens.push(chunk[index].to);
      }
    });
  }
  return result;
}
