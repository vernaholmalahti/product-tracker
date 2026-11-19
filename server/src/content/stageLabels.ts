import type { Category, Stage } from "../generated/prisma/client";

// Same wording as the app (apps/mobile/src/content/stages.ts) – keep them in sync.
// Used for notification text, which is written on the server.
const stageLabels: Record<Stage, string> = {
  NOT_SUBMITTED: "Not submitted",
  APPLICATION_SUBMITTED: "Application submitted",
  UNDER_ASSESSMENT: "Under assessment",
  POSITIVE_SAFETY_OPINION: "Positive safety opinion",
  AUTHORISED: "Authorised",
  ON_MARKET: "On the market",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export function stageLabel(stage: Stage, category: Category, marketCode: string): string {
  if (stage === "AUTHORISED" && category === "SUPPLEMENT_INGREDIENT" && marketCode === "US") {
    return "Allowed in supplements"; // CONTENT_GUIDELINES.md
  }
  return stageLabels[stage];
}
