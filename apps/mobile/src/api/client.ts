import { API_URL } from "./config";
import type { Market, ProductDetail, ProductSummary } from "./types";

// Fetches JSON from our API. Throws a readable error if the server is down
// or answers with an error status, so screens can show a message.
async function fetchJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`);
  } catch {
    throw new Error(`Can't reach the Ripe server at ${API_URL}. Is it running?`);
  }
  if (!response.ok) {
    throw new Error(`Server answered ${response.status} for ${path}`);
  }
  return (await response.json()) as T;
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
