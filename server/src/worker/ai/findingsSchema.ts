import { z } from "zod";
import { Stage } from "../../generated/prisma/client";

// The shape of Claude's answer (docs/AI_UPDATE_PIPELINE.md section 5), defined twice on purpose:
//  1. findingsToolSchema(): JSON Schema for the strict `report_findings` tool. Strict tools
//     don't allow constraints like maxLength, so it only describes the structure.
//  2. reportSchema (zod): checks the same structure PLUS the limits, after the answer arrives
//     (ground rule 5). Keep the two in sync when changing fields.

const STAGES = Object.values(Stage); // ["NOT_SUBMITTED", "APPLICATION_SUBMITTED", ...]

export const REPORT_TOOL_NAME = "report_findings";

export function findingsToolSchema(marketCodes: string[]) {
  return {
    name: REPORT_TOOL_NAME,
    description:
      "Report NEW regulatory events for this product found in this search. " +
      "Call it exactly once at the end, with an empty findings list if nothing new was found.",
    strict: true, // the API guarantees the input matches this schema
    input_schema: {
      type: "object" as const,
      properties: {
        productSlug: { type: "string" },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              marketCode: { type: "string", enum: marketCodes },
              proposedStage: { type: "string", enum: STAGES },
              eventDate: { anyOf: [{ type: "string", format: "date" }, { type: "null" }] },
              eventDatePrecision: { type: "string", enum: ["DAY", "MONTH"] },
              title: { type: "string" },
              summary: { type: "string" },
              sourceUrl: { type: "string", format: "uri" },
              sourceType: { type: "string", enum: ["OFFICIAL", "COMPANY", "NEWS"] },
              evidenceQuote: { type: "string" },
              confidence: { type: "number" },
            },
            required: [
              "marketCode", "proposedStage", "eventDate", "eventDatePrecision", "title",
              "summary", "sourceUrl", "sourceType", "evidenceQuote", "confidence",
            ],
            additionalProperties: false,
          },
        },
        notes: { type: "string" },
      },
      required: ["productSlug", "findings", "notes"],
      additionalProperties: false,
    },
  };
}

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export const findingSchema = z.object({
  marketCode: z.string().min(2),
  proposedStage: z.enum(STAGES),
  eventDate: z.iso.date().nullable(),
  eventDatePrecision: z.enum(["DAY", "MONTH"]),
  title: z.string().min(5).max(120),
  summary: z.string().min(10).max(400),
  sourceUrl: z.url({ protocol: /^https?$/ }),
  sourceType: z.enum(["OFFICIAL", "COMPANY", "NEWS"]),
  evidenceQuote: z.string().min(3).refine((q) => wordCount(q) < 25, "evidenceQuote must be under 25 words"),
  confidence: z.number().min(0).max(1),
});

export const reportSchema = z.object({
  productSlug: z.string(),
  findings: z.array(z.unknown()).max(10), // each finding is checked on its own (one bad finding ≠ all bad)
  notes: z.string().max(500),
});

export type Finding = z.infer<typeof findingSchema>;
