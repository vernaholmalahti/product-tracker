import { API_URL } from "./config";
import type { Market, ProductDetail, ProductSummary } from "./types";

// Sends a request to our API. Throws a readable error if the server is down
// or answers with an error status, so screens can show a message.
async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new Error(`Can't reach the Ripe server at ${API_URL}. Is it running?`);
  }
  if (!response.ok) {
    throw new Error(`Server answered ${response.status} for ${path}`);
  }
  return response;
}

// GET and parse the JSON answer.
async function fetchJson<T>(path: string): Promise<T> {
  const response = await request(path);
  return (await response.json()) as T;
}

// POST/DELETE with a JSON body, for calls that don't return data (HTTP 204).
async function sendJson(method: "POST" | "DELETE", path: string, body: unknown): Promise<void> {
  await request(path, {
    method,
    headers: { "Content-Type": "application/json" }, // tells Express to parse the body as JSON
    body: JSON.stringify(body),
  });
}

// ─── Follows ────────────────────────────────────────────────────────────────
// marketCode is left out = follow the whole product (all markets).

export type FollowInfo = { productSlug: string; marketCode: string | null };

export function getFollows(deviceId: string): Promise<FollowInfo[]> {
  return fetchJson<FollowInfo[]>(`/devices/${encodeURIComponent(deviceId)}/follows`);
}

export function followProduct(deviceId: string, productSlug: string): Promise<void> {
  return sendJson("POST", "/follows", { deviceId, productSlug });
}

export function unfollowProduct(deviceId: string, productSlug: string): Promise<void> {
  return sendJson("DELETE", "/follows", { deviceId, productSlug });
}

// ─── Devices ────────────────────────────────────────────────────────────────

// expoPushToken is optional: sent once the user has allowed notifications.
export function registerDevice(id: string, expoPushToken?: string): Promise<void> {
  return sendJson("POST", "/devices", { id, expoPushToken });
}

export function getProducts(): Promise<ProductSummary[]> {
  return fetchJson<ProductSummary[]>("/products");
}

export function getMarkets(): Promise<Market[]> {
  return fetchJson<Market[]>("/markets");
}

export function getProduct(slug: string): Promise<ProductDetail> {
  return fetchJson<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
}
