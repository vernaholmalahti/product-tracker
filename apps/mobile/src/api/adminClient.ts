import { request } from "./client";
import type { PendingUpdate, UpdateRun } from "./types";

// Admin API calls. Each one sends "Authorization: Bearer <token>" (server: requireAdmin.ts).
function adminHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// Resolves if the token is correct, throws ApiError with status 401 if not.
export async function checkAdminToken(token: string): Promise<void> {
  await request("/admin/check", { headers: adminHeaders(token) });
}

export async function getPendingUpdates(token: string): Promise<PendingUpdate[]> {
  const response = await request("/admin/pending-updates", { headers: adminHeaders(token) });
  return (await response.json()) as PendingUpdate[];
}

export async function getUpdateRuns(token: string, limit = 10): Promise<UpdateRun[]> {
  const response = await request(`/admin/update-runs?limit=${limit}`, { headers: adminHeaders(token) });
  return (await response.json()) as UpdateRun[];
}

export async function approveUpdate(token: string, id: string, eventDate?: string): Promise<void> {
  await request(`/admin/pending-updates/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    headers: adminHeaders(token),
    body: JSON.stringify(eventDate ? { eventDate } : {}),
  });
}

export async function rejectUpdate(token: string, id: string, reviewNote: string): Promise<void> {
  await request(`/admin/pending-updates/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    headers: adminHeaders(token),
    body: JSON.stringify({ reviewNote }),
  });
}
