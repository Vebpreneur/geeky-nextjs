import { notFound } from "next/navigation";
import ArticleBlocks from "@/components/publishing/ArticleBlocks";
import { getPublishedArticle } from "@/lib/ai-publishing";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: "Artikeln hittades inte", robots: { index: false } };
  const seo = article.seo || {};
  return {
    title: seo.title || article.title,
    description: seo.description || article.excerpt || undefined,
    alternates: seo.canonical ? { canonical: seo.canonical } : undefined,
    robots: { index: seo.noindex !== true, follow: true },
    openGraph: { title: seo.title || article.title, description: seo.description || article.excerpt, type: "article", publishedTime: article.published_at || undefined, images: article.hero_image_url ? [article.hero_image_url] : [] },
  };
}
export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at,
    image: article.hero_image_url || undefined,
  };
  return <main className="min-h-screen bg-[#08090d] text-zinc-100">
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <header className="mb-12">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">{article.category || article.article_type}</p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">{article.title}</h1>
        {article.excerpt && <p className="mt-6 text-lg leading-8 text-zinc-400">{article.excerpt}</p>}
        {article.published_at && <time dateTime={article.published_at} className="mt-5 block text-sm text-zinc-500">{new Date(article.published_at).toLocaleDateString(article.locale || "sv", { year: "numeric", month: "long", day: "numeric" })}</time>}
      </header>
      {article.hero_image_url && /^https?:\/\//.test(article.hero_image_url) && <img src={article.hero_image_url} alt="" className="mb-10 w-full rounded-2xl" />}
      <ArticleBlocks blocks={article.content_blocks || []} />
    </article>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </main>;
}
