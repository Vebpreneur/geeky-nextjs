# AI-native publishing foundation

## Goal
Keep Geeky's public-facing Next.js frontend while replacing manual MDX article publishing with a secure, agent-operated publishing pipeline. No editor dashboard or external CMS is required.

## Non-negotiable requirements
- Publish, update, unpublish, schedule, and bulk-generate through authenticated tools callable from ChatGPT.
- Content updates must not require a Git commit or a full site rebuild.
- Article types: guide, editorial, listicle, comparison, review, tutorial, and programmatic landing page.
- Reuse React blocks across content: comparison_table, ranked_item, review_score, pros_cons, CTA, offer, banner, FAQ, table, image, embed, and approved custom widgets.
- Maintain responsive premium-dark rendering without sacrificing crawlable server-rendered HTML.
- SEO: canonical URLs, metadata, Open Graph, sitemap, robots, breadcrumb navigation, internal linking, redirects, and content timestamps.
- AEO/GEO: answer-first summaries, factual provenance, citations, structured comparisons and appropriately scoped schema.org JSON-LD.
- pSEO: typed datasets, deduplication, template variables, unique value checks, indexing controls and batch execution.

## Initial deployment topology
- Next.js on Vercel (App Router where appropriate).
- Supabase Postgres for articles, entities, reusable block data, topics, internal links, sources, media, monetization records, publishing events and jobs.
- Supabase Storage or equivalent for optimized imported media.
- Server-only publishing endpoint with per-agent permissions, request validation, idempotency keys, audit log, and rate limits.
- On successful publication, revalidate article path plus touched listing/tag/category routes; do not rebuild the whole site.
- Background jobs for research, batch generation, image processing and SEO audits, with status and retry semantics.
- ChatGPT connection via a properly authenticated app/MCP integration exposing narrowly scoped publishing actions. ChatGPT alone cannot publish until this integration is deployed and connected.

## Article model (first implementation)
- id, type, status, title, slug, locale, excerpt, hero_media_id
- content_blocks JSONB (typed and schema-versioned), structured_data JSONB
- seo_title, seo_description, canonical_url, robots_index
- category_id, tags, author_profile_id, primary_topic_id
- source references and verification timestamps for claims
- created_at, updated_at, published_at, scheduled_for
- content_hash, schema_version, revision, quality_report

## Publication actions
- create_article, preview_article, publish_article, update_article, unpublish_article
- list_articles, search_articles, add_block, update_block, schedule_article
- create_topic_cluster, publish_batch, batch_status, revalidate_routes
- manage_partner_link, manage_banner, audit_seo, refresh_article

## Implementation order
1. Inspect existing routes, styles, MDX loaders, config and deployment.
2. Add typed content schemas + SQL migration + read-only content repository.
3. Add dynamic content rendering with graceful fallback for existing MDX posts.
4. Add reusable block renderers and safe sanitization.
5. Add secure create/update/publish endpoints with audit and revalidation.
6. Add SEO infrastructure and pSEO dataset/templates.
7. Expose tools to ChatGPT via an authenticated MCP/app connection.
8. Run integration tests, performance/SEO checks, and only then migrate existing content.

## Safety / reliability constraints
- Never place Supabase service role or privileged publishing keys in client bundles.
- Use strict typed block validation; never execute arbitrary AI-authored JavaScript from article data.
- Sanitize embedded content and restrict custom widgets to registered components.
- Store external images with attribution metadata and optimized copies.
- Ensure each generated page delivers unique user value; canonicalize or noindex thin/duplicated pSEO pages.
- Preserve existing frontend routes and content until the replacement path is tested.
