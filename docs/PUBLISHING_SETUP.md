# Publishing setup — AI-first Geeky

The API and article renderer are implemented on the feature branch but **are not live** until a database is connected and this branch is deployed.

1. Create/select a Supabase project.
2. Run `supabase/migrations/202611210001_ai_publishing.sql` using the project's SQL migration workflow.
3. Set server-only environment variables from `.env.example` in the deployment settings. Use a long unique `PUBLISHING_API_KEY`.
4. Deploy the feature branch and check `/articles/<slug>`.
5. Send a JSON request to `POST /api/publishing/articles` with an `Authorization: Bearer <PUBLISHING_API_KEY>` header.

## Example request
```json
{
  "action": "create",
  "article": {
    "slug": "exempel-guide",
    "title": "Exempel: en introduktion till ämnet",
    "article_type": "guide",
    "status": "published",
    "excerpt": "En introduktion till vårt exempel.",
    "category": "Guider",
    "seo": { "title": "Exempelguide", "description": "En användbar introduktion." },
    "content_blocks": [
      { "type": "heading", "data": { "text": "Kom igång", "level": "h2" } },
      { "type": "paragraph", "data": { "text": "Här börjar guiden." } },
      { "type": "faq", "data": { "items": [{ "question": "Vad är detta?", "answer": "Ett exempel." }] } }
    ]
  }
}
```

Supported actions: create, update, publish, unpublish. GET on the same endpoint lists articles with bearer authorization. All publication actions require an authenticated request. Article pages are at `/articles/{slug}`.

## Remaining work
- Enforce request size limits, idempotency, concurrency and rate limiting in front of the publishing API before exposing it to production agents.
- Register trusted React widgets rather than executing user-supplied HTML/JS.
- Integrate article listings and categories into the existing Geeky homepage.
- Add schema validation for every block's `data` payload and editorial quality gates.
- Connect a ChatGPT app/MCP tool with properly scoped credentials.
- Verify build, runtime routes, SEO and end-to-end publishing after deployment.
