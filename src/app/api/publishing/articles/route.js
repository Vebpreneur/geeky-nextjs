import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { dbRequest, logPublishingEvent, validateArticle, publishingConfigured } from "@/lib/ai-publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request) {
  const key = process.env.PUBLISHING_API_KEY;
  const candidate = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!key || !candidate) return false;
  const a = Buffer.from(candidate), b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}
const bad = (message, status = 400) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
const noStore = { "Cache-Control": "no-store" };
const table = "publishing_articles";

export async function GET(request) {
  if (!authorized(request)) return bad("Unauthorized", 401);
  if (!publishingConfigured()) return bad("Publishing database not configured", 503);
  try {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);
    const status = url.searchParams.get("status");
    if (status && !["draft","published","archived"].includes(status)) return bad("Invalid status");
    const q = `?select=*&order=updated_at.desc&limit=${limit}${status ? `&status=eq.${status}` : ""}`;
    const articles = await dbRequest(table, { query: q });
    return NextResponse.json({ articles }, { headers: noStore });
  } catch { return bad("Unable to list articles", 500); }
}

export async function POST(request) {
  if (!authorized(request)) return bad("Unauthorized", 401);
  if (!publishingConfigured()) return bad("Publishing database not configured", 503);
  let payload;
  try { payload = await request.json(); } catch { return bad("Invalid JSON"); }
  const action = payload?.action || "create";
  if (!["create","update","publish","unpublish"].includes(action)) return bad("Unknown action");
  try {
    const requestId = request.headers.get("x-request-id")?.slice(0, 150) || null;
    let result;
    if (action === "create") {
      const fields = validateArticle(payload.article);
      const row = { ...fields, status: fields.status || "draft" };
      if (row.status === "published") row.published_at = new Date().toISOString();
      result = await dbRequest(table, { method: "POST", body: row, prefer: "return=representation" });
    } else {
      const slug = payload.slug;
      if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return bad("Invalid slug");
      const patch = action === "update" ? validateArticle(payload.article, { partial: true }) : { status: action === "publish" ? "published" : "draft" };
      if (action === "publish") patch.published_at = new Date().toISOString();
      result = await dbRequest(table, { method: "PATCH", query: `?slug=eq.${encodeURIComponent(slug)}`, body: { ...patch, updated_at: new Date().toISOString() }, prefer: "return=representation" });
    }
    if (!Array.isArray(result) || !result[0]) return bad("Article not found", 404);
    const article = result[0];
    await logPublishingEvent(article.id, action, requestId);
    revalidatePath(`/posts/${article.slug}`);
    revalidatePath(`/articles/${article.slug}`);
    revalidatePath("/");
    return NextResponse.json({ ok: true, id: article.id, slug: article.slug, status: article.status }, { headers: noStore });
  } catch (error) {
    if (/Invalid|Unknown|required|Article must/.test(error.message)) return bad(error.message);
    return bad("Publishing operation failed", 500);
  }
}
