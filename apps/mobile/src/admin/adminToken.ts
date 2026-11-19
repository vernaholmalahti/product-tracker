// Where the admin page keeps the admin token while you're logged in.
//
// sessionStorage (not localStorage): the token is forgotten when the browser tab closes.
// Trade-off: any script running on this page could read it. Fine for a single admin on
// their own computer in this first version; a later version should use an HttpOnly cookie,
// which page scripts can't read at all.
const KEY = "ripe.adminToken";

function storage(): Storage | null {
  return typeof globalThis.sessionStorage === "undefined" ? null : globalThis.sessionStorage;
}

export function loadAdminToken(): string | null {
  return storage()?.getItem(KEY) ?? null;
}

export function saveAdminToken(token: string): void {
  storage()?.setItem(KEY, token);
}

export function clearAdminToken(): void {
  storage()?.removeItem(KEY);
}
