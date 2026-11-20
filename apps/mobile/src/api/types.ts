// Shapes of the API responses (server/src/api/productRoutes.ts).
// Kept in sync by hand: if the server response changes, update these too.

export type Category = "NOVEL_FOOD" | "SUPPLEMENT_INGREDIENT";

export type Stage =
  | "NOT_SUBMITTED"
  | "APPLICATION_SUBMITTED"
  | "UNDER_ASSESSMENT"
  | "POSITIVE_SAFETY_OPINION"
  | "AUTHORISED"
  | "ON_MARKET"
  | "REJECTED"
  | "WITHDRAWN";

export type SourceType = "OFFICIAL" | "COMPANY" | "NEWS";
export type DatePrecision = "DAY" | "MONTH";
export type Region = "EUROPE" | "AMERICAS" | "ASIA";

// GET /markets
export type Market = {
  code: string;
  name: string;
  region: Region;
};

export type MarketStatus = {
  marketCode: string;
  marketName: string;
  marketRegion: Region;
  currentStage: Stage;
  expectedNext: string | null;
  lastCheckedAt: string; // ISO timestamp
};

export type StatusEvent = {
  stage: Stage;
  eventDate: string; // "YYYY-MM-DD"
  eventDatePrecision: DatePrecision;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceType: SourceType;
};

export type ProductSummary = {
  slug: string;
  name: string;
  category: Category;
  company: string | null;
  shortDescription: string;
  imageUrl: string | null;
  markets: MarketStatus[];
};

// GET /admin/pending-updates (server/src/api/adminRoutes.ts)
export type PendingUpdate = {
  id: string;
  product: { slug: string; name: string; category: Category };
  marketCode: string;
  marketName: string;
  currentStage: Stage;
  proposedStage: Stage;
  eventDate: string | null; // "YYYY-MM-DD"
  eventDatePrecision: DatePrecision;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceType: SourceType;
  evidenceQuote: string;
  confidence: number | null; // 0–1, AI updates only
  origin: "SOURCE_CHECK" | "AI_SEARCH";
  checkNotes: string[]; // why it was not published automatically (failed rules, warnings)
  createdAt: string;
};

// GET /admin/update-runs – one worker run (server: runUpdate.ts)
export type UpdateRun = {
  id: string;
  startedAt: string;
  finishedAt: string | null; // null while still running (or if it crashed hard)
  aiCallsUsed: number;
  aiCostUsd: number; // estimate
  itemsChecked: number;
  changesFound: number;
  sourceChanges: { sourceWatchId: string; label: string; url: string }[];
  errors: { where: string; message: string }[];
};

export type ProductDetail = Omit<ProductSummary, "markets"> & {
  markets: (MarketStatus & { events: StatusEvent[] })[];
};
