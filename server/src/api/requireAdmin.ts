import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config";

// Compares two secrets in constant time. A normal === stops at the first different
// character, so an attacker could measure response times to guess the token bit by bit.
// Hashing first gives both sides the same length, which timingSafeEqual requires.
function secretsMatch(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// Express middleware: runs before every /admin route. Lets the request continue
// (next()) only with the header "Authorization: Bearer <ADMIN_TOKEN>".
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token || !secretsMatch(token, config.adminToken)) {
    res.status(401).json({ error: "Admin token missing or wrong." });
    return;
  }
  next();
}
