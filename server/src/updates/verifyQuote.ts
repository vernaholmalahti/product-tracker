import { fetchPage } from "../worker/sources/fetchPage";

// Makes text comparable: lower case, “curly” quotes and dashes made plain, punctuation
// and repeated whitespace removed. So a quote still matches when only formatting differs.
export function normaliseForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ") // keep letters and numbers in any language
    .replace(/\s+/g, " ")
    .trim();
}

export function quoteAppearsInText(quote: string, pageText: string): boolean {
  const needle = normaliseForMatch(quote);
  return needle.length > 0 && normaliseForMatch(pageText).includes(needle);
}

// Fetches the source page ourselves and checks the quote is really on it.
// true = found, false = page read but quote not there, null = couldn't check (PDF, error…).
// Only `true` lets an update be published automatically.
export async function verifyQuoteOnPage(url: string, quote: string): Promise<boolean | null> {
  try {
    const page = await fetchPage(url, { wholePage: true });
    return quoteAppearsInText(quote, page.text);
  } catch {
    return null;
  }
}
