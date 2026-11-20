import type { Stage } from "../generated/prisma/client";

// The normal path from left to right. REJECTED and WITHDRAWN are endings, not steps.
const NORMAL_PATH: Stage[] = [
  "NOT_SUBMITTED",
  "APPLICATION_SUBMITTED",
  "UNDER_ASSESSMENT",
  "POSITIVE_SAFETY_OPINION",
  "AUTHORISED",
  "ON_MARKET",
];

// True if `proposed` is later on the normal path than `current`. Skipping steps is allowed
// (e.g. UNDER_ASSESSMENT → AUTHORISED), going back or moving out of REJECTED/WITHDRAWN is not.
export function isForwardMove(current: Stage, proposed: Stage): boolean {
  const from = NORMAL_PATH.indexOf(current);
  const to = NORMAL_PATH.indexOf(proposed);
  return from !== -1 && to !== -1 && to > from;
}
