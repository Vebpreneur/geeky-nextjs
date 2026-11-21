import "server-only";

const ARTICLES_TABLE = "publishing_articles";
const EVENTS_TABLE = "publishing_events";
const BLOCK_TYPES = new Set([
  "paragraph", "heading", "image", "quote", "list", "table", "faq",
  "comparison_table", "ranked_item", "review_score", "pros_cons", "cta",
  "banner", "offer", "embed", "widget"
]);
const ARTICLE_TYPES = new Set(["article", "guide", "review", "comparison", "toplist", "tutorial", "landing"]);
const STATUSES = new Set(["draft", "published", "archived"]);
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function publishingConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function configuration() {
  if (!publishingConfigured()) throw new Error("Publishing database is not configured");
  return { url: process.env.SUPABASE_URL.replace(/\/$/, ""), key: process.env.SUPABASE_SERVICE_ROLE_KEY };
}

export async function dbRequest(table, { method = "GET", query = "", body, prefer } = {}) {
  const { url, key } = configuration();
  const res = await fetch(`${url}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });
  const txt = await res.text();
  let payload;
  try { payload = txt ? JSON.parse(txt) : null; } catch { payload = null; }
  if (!res.ok) {
    // Never expose Supabase error details, URLs or credentials to callers.
    throw new Error(`Database operation failed (${res.status})`);
  }
  return payload;
}

function isObj(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function safeText(value, max) { return typeof value === "string" && value.length <= max; }
function safeUrl(value) {
  if (value == null || value === "") return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}

export function validateArticle(input, { partial = false } = {}) {
  if (!isObj(input)) throw new Error("Article must be an object");
  const fields = ["slug","title","article_type","status","excerpt","content_blocks","seo","sources","category","tags","hero_image_url","locale"];
  if (Object.keys(input).some(key => !fields.includes(key))) throw new Error("Unknown article field");
  if (!partial && (!input.slug || !input.title || !input.article_type)) throw new Error("slug, title, article_type required");
  if (input.slug !== undefined && (typeof input.slug !== "string" || input.slug.length > 180 || !slugRegex.test(input.slug))) throw new Error("Invalid slug");
  if (input.title !== undefined && (!safeText(input.title, 220) || input.title.trim().length < 5)) throw new Error("Invalid title");
  if (input.article_type !== undefined && !ARTICLE_TYPES.has(input.article_type)) throw new Error("Invalid article type");
  if (input.status !== undefined && !STATUSES.has(input.status)) throw new Error("Invalid status");
  if (input.excerpt !== undefined && !safeText(input.excerpt, 2000)) throw new Error("Invalid excerpt");
  if (input.category !== undefined && input.category !== null && !safeText(input.category, 100)) throw new Error("Invalid category");
  if (input.locale !== undefined && !safeText(input.locale, 12)) throw new Error("Invalid locale");
  if (input.hero_image_url !== undefined && !safeUrl(input.hero_image_url)) throw new Error("Invalid hero image URL");
  if (input.tags !== undefined && (!Array.isArray(input.tags) || input.tags.length > 30 || input.tags.some(t => !safeText(t, 60)))) throw new Error("Invalid tags");
  if (input.seo !== undefined && (!isObj(input.seo) || JSON.stringify(input.seo).length > 15000)) throw new Error("Invalid SEO data");
  if (input.sources !== undefined && (!Array.isArray(input.sources) || input.sources.length > 100 || JSON.stringify(input.sources).length > 30000)) throw new Error("Invalid sources");
  if (input.content_blocks !== undefined) {
    if (!Array.isArray(input.content_blocks) || input.content_blocks.length > 300 || JSON.stringify(input.content_blocks).length > 400000) throw new Error("Invalid content blocks");
    for (const block of input.content_blocks) {
      if (!isObj(block) || !BLOCK_TYPES.has(block.type) || !isObj(block.data)) throw new Error("Invalid block structure or type");
    }
  }
  return input;
}

export async function logPublishingEvent(articleId, action, requestId = null) {
  await dbRequest(EVENTS_TABLE, { method: "POST", body: { article_id: articleId, action, request_id: requestId }, prefer: "return=minimal" });
}

export async function getPublishedArticle(slug) {
  if (!slugRegex.test(slug) || !publishingConfigured()) return null;
  const query = `?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`;
  const rows = await dbRequest(ARTICLES_TABLE, { query });
  return rows[0] ?? null;
}

export async function listPublishedArticles(limit = 20, offset = 0) {
  if (!publishingConfigured()) return [];
  const query = `?status=eq.published&select=slug,title,article_type,excerpt,category,tags,hero_image_url,published_at,updated_at&order=published_at.desc&limit=${limit}&offset=${offset}`;
  return dbRequest(ARTICLES_TABLE, { query });
}
