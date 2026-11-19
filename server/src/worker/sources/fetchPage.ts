import { createHash } from "node:crypto";

// Identifies our worker to the sites we check (polite crawling). No personal details.
const USER_AGENT = "RipeBot/0.1 (regulatory status tracker; one request per page per day)";
const TIMEOUT_MS = 20_000;
const MAX_BYTES = 5_000_000; // ignore anything bigger than 5 MB

export type FetchedPage = {
  text: string; // normalised plain text – what we hash and (in Phase 6) give to the AI
  hash: string; // SHA-256 of `text`
};

// Parts of an HTML page that change without the content changing (scripts, menus,
// cookie banners, footers). Removed before hashing so the hash only follows real content.
const NOISE_ELEMENTS = ["script", "style", "noscript", "svg", "template", "iframe", "nav", "header", "footer", "form"];

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };

function removeElements(html: string, tags: string[]): string {
  return tags.reduce(
    (result, tag) => result.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "gi"), " "),
    html,
  );
}

// Most government sites wrap the real content in <main>. If there is one, only use that.
function mainContent(html: string): string {
  const match = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  return match?.[1] ?? html;
}

// Very small HTML → text converter. Good enough for change detection; not a full parser.
export function htmlToText(html: string): string {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, " ");
  const content = removeElements(mainContent(withoutComments), NOISE_ELEMENTS);
  return content
    .replace(/<[^>]+>/g, " ") // drop remaining tags
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? " ")
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

// Fetches a page and returns its normalised text and hash. Throws a readable error
// on timeouts, HTTP errors or unsupported content, so the caller can log it and move on.
export async function fetchPage(url: string): Promise<FetchedPage> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    signal: AbortSignal.timeout(TIMEOUT_MS), // gives up after 20 s instead of hanging the run
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) throw new Error(`Unsupported content type: ${contentType || "unknown"}`);

  const body = await response.text();
  if (body.length > MAX_BYTES) throw new Error(`Page too large (${body.length} bytes)`);

  const text = htmlToText(body);
  if (text.length < 200) throw new Error(`Page has almost no text (${text.length} chars) – blocked or changed layout?`);
  return { text, hash: sha256(text) };
}
