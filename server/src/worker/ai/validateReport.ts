import { findBannedWords } from "../../content/bannedWords";
import { findingSchema, type Finding, reportSchema } from "./findingsSchema";

export type ValidationContext = {
  productSlug: string;
  category: "NOVEL_FOOD" | "SUPPLEMENT_INGREDIENT";
  marketCodes: string[]; // markets this product is tracked in
  seenUrls: Set<string>; // URLs Claude was shown in this conversation (askClaude.ts)
  today: string; // "YYYY-MM-DD"
};

export type CheckedFinding = Finding & {
  warnings: string[]; // reasons a human must look at it (e.g. possible health claim)
};

export type RejectedFinding = { reason: string; raw: unknown };

export type ValidationResult =
  | { ok: true; findings: CheckedFinding[]; rejected: RejectedFinding[]; notes: string }
  | { ok: false; error: string }; // the whole report is unusable

// Compares URLs loosely: same page even with/without "www.", a trailing slash or a #fragment.
export function normaliseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/+$/, "") : "";
    return `${host}${path}${parsed.search}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

// Checks one finding beyond the schema. Returns a reason string if it must be rejected.
function rejectionReason(finding: Finding, context: ValidationContext, seen: Set<string>): string | null {
  if (!context.marketCodes.includes(finding.marketCode)) {
    return `market ${finding.marketCode} is not tracked for this product`;
  }
  if (finding.eventDate !== null && finding.eventDate > context.today) {
    return `eventDate ${finding.eventDate} is in the future`;
  }
  if (!seen.has(normaliseUrl(finding.sourceUrl))) {
    return `sourceUrl was not among the pages Claude saw (possibly invented): ${finding.sourceUrl}`;
  }
  return null;
}

function warningsFor(finding: Finding, context: ValidationContext): string[] {
  if (context.category !== "SUPPLEMENT_INGREDIENT") return [];
  const words = findBannedWords(`${finding.title} ${finding.summary}`);
  return words.length > 0 ? [`possible health claim or dosing wording: ${words.join(", ")}`] : [];
}

// Validates Claude's raw report_findings input (ground rule 5). Never throws:
// a broken report returns ok:false, a broken finding is rejected individually.
export function validateReport(raw: unknown, context: ValidationContext): ValidationResult {
  const report = reportSchema.safeParse(raw);
  if (!report.success) {
    return { ok: false, error: `report does not match the schema: ${report.error.issues[0]?.message ?? "unknown"}` };
  }
  if (report.data.productSlug !== context.productSlug) {
    return { ok: false, error: `report is about "${report.data.productSlug}", expected "${context.productSlug}"` };
  }

  const seen = new Set([...context.seenUrls].map(normaliseUrl));
  const findings: CheckedFinding[] = [];
  const rejected: RejectedFinding[] = [];

  for (const rawFinding of report.data.findings) {
    const parsed = findingSchema.safeParse(rawFinding);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      rejected.push({ reason: `schema: ${issue?.path.join(".")} ${issue?.message}`, raw: rawFinding });
      continue;
    }
    const reason = rejectionReason(parsed.data, context, seen);
    if (reason) {
      rejected.push({ reason, raw: rawFinding });
      continue;
    }
    findings.push({ ...parsed.data, warnings: warningsFor(parsed.data, context) });
  }
  return { ok: true, findings, rejected, notes: report.data.notes };
}
