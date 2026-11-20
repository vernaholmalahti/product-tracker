// Words that suggest a health claim or dosing advice (ground rule 4, CONTENT_GUIDELINES.md).
// A match never publishes: the finding goes to a human with a warning. The list is
// deliberately broad – a false alarm costs one look from the admin, a missed claim costs trust.
const BANNED_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "anti-ageing", pattern: /\banti-?ag(e)?ing\b/i },
  { label: "longevity", pattern: /\blongevity\b/i },
  { label: "boosts", pattern: /\bboost(s|ed|ing)?\b/i },
  { label: "improves", pattern: /\bimprov(e|es|ed|ing)\b/i },
  { label: "supports health", pattern: /\bsupport(s|ing)? (healthy|health|the immune)\b/i },
  { label: "energy", pattern: /\benergy\b/i },
  { label: "treats", pattern: /\btreat(s|ed|ing|ment)?\b/i },
  { label: "cures", pattern: /\bcur(e|es|ed|ing)\b/i },
  { label: "prevents", pattern: /\bprevent(s|ed|ing|ion)?\b/i },
  { label: "reverses", pattern: /\brevers(e|es|ed|ing)\b/i },
  { label: "dose", pattern: /\bdos(e|es|age|ing)\b/i },
  { label: "mg amount", pattern: /\b\d+\s?(mg|g|mcg|µg)\b/i },
  { label: "recommended", pattern: /\brecommended (daily|intake|amount)\b/i },
];

// Returns the labels of all banned patterns found in the text (empty = fine).
export function findBannedWords(text: string): string[] {
  return BANNED_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ label }) => label);
}
