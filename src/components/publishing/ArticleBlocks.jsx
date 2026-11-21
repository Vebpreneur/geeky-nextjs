import React from "react";

// A strict, curated renderer: database content never executes arbitrary JS/HTML.
function LinkButton({ href, children }) {
  const safe = typeof href === "string" && /^https?:\/\//i.test(href);
  return safe ? <a href={href} rel="nofollow sponsored noopener noreferrer" target="_blank" className="inline-flex rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400">{children}</a> : null;
}
const titleClass = "mb-4 mt-9 font-bold tracking-tight text-zinc-100";
const panel = "my-7 rounded-2xl border border-white/10 bg-zinc-900/70 p-5 sm:p-7";
function DataTable({ headers = [], rows = [] }) {
  return <div className="my-8 overflow-x-auto rounded-xl border border-white/10"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-zinc-800/70"><tr>{headers.map((h,i)=><th key={i} scope="col" className="p-4 text-zinc-100">{String(h)}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i} className="border-t border-white/10">{(Array.isArray(row)?row:[]).map((cell,j)=><td key={j} className="p-4 text-zinc-300">{String(cell ?? "")}</td>)}</tr>)}</tbody></table></div>;
}
function ArticleBlock({ block }) {
  const d = block.data || {};
  switch (block.type) {
    case "heading": { const H = ["h2","h3","h4"].includes(d.level) ? d.level : "h2"; return <H className={`${titleClass} ${H==="h2"?"text-3xl":"text-2xl"}`}>{d.text}</H>; }
    case "paragraph": return <p className="my-5 leading-8 text-zinc-300">{d.text}</p>;
    case "quote": return <blockquote className="my-7 border-l-2 border-violet-400 pl-6 text-xl italic text-zinc-200">{d.text}</blockquote>;
    case "list": return <ul className="my-6 list-disc space-y-2 pl-6 text-zinc-300">{(d.items||[]).map((x,i)=><li key={i}>{String(x)}</li>)}</ul>;
    case "image": return /^https?:\/\//.test(d.src||"") ? <figure className="my-8"><img src={d.src} alt={d.alt || ""} loading="lazy" decoding="async" className="h-auto w-full rounded-2xl" />{d.caption && <figcaption className="mt-2 text-sm text-zinc-400">{d.caption}</figcaption>}</figure> : null;
    case "table": case "comparison_table": return <section aria-label={d.title || "Comparison"}>{d.title && <h2 className={`${titleClass} text-2xl`}>{d.title}</h2>}<DataTable headers={d.headers} rows={d.rows}/></section>;
    case "faq": return <section className="my-8"><h2 className={`${titleClass} text-2xl`}>{d.title || "Vanliga frågor"}</h2>{(d.items||[]).map((item,i)=><details key={i} className="border-b border-white/10 py-4"><summary className="cursor-pointer font-medium text-zinc-100">{item.question}</summary><p className="mt-3 leading-7 text-zinc-300">{item.answer}</p></details>)}</section>;
    case "ranked_item": return <section className={panel}><div className="mb-3 text-xs font-bold uppercase tracking-widest text-violet-300">#{d.rank || "–"} {d.label || ""}</div><h3 className="text-2xl font-bold text-white">{d.name}</h3>{d.description && <p className="my-4 text-zinc-300">{d.description}</p>}<LinkButton href={d.url}>{d.button_label || "Läs mer"}</LinkButton></section>;
    case "review_score": return <section className={panel}><h3 className="font-bold text-zinc-100">{d.title || "Betyg"}</h3><p className="my-3 text-4xl font-bold text-violet-300">{d.score != null ? String(d.score) : "–"}<span className="text-base text-zinc-400"> / {d.out_of || 10}</span></p>{d.summary && <p className="text-zinc-300">{d.summary}</p>}</section>;
    case "pros_cons": return <div className="my-8 grid gap-4 md:grid-cols-2">{[["Fördelar",d.pros],["Nackdelar",d.cons]].map(([title,items])=><section className={panel} key={title}><h3 className="mb-3 font-bold text-white">{title}</h3><ul className="list-disc space-y-2 pl-5 text-zinc-300">{(items||[]).map((x,i)=><li key={i}>{String(x)}</li>)}</ul></section>)}</div>;
    case "cta": case "offer": case "banner": return <aside className={`${panel} bg-gradient-to-br from-zinc-900 via-zinc-950 to-violet-950/30`}><h3 className="text-xl font-bold text-white">{d.title}</h3>{d.description && <p className="my-3 text-zinc-300">{d.description}</p>}<LinkButton href={d.url}>{d.button_label || "Utforska"}</LinkButton></aside>;
    // Embeds and widgets are intentionally disabled until a trusted component registry is implemented.
    case "embed": case "widget": return null;
    default: return null;
  }
}
export default function ArticleBlocks({ blocks = [] }) {
  return <div>{blocks.map((block,index)=><ArticleBlock key={block.id || index} block={block}/>)}</div>;
}
