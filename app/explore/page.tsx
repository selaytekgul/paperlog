import { getChatGPTUser } from "../chatgpt-auth";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { ensureDbSchema, getD1 } from "../../db";
import { searchOpenAlex } from "../../lib/openalex";
import type { Paper, PaperSummary } from "../../lib/types";

export const dynamic = "force-dynamic";

async function communityPapers(): Promise<Array<Paper & { summary: PaperSummary }>> {
  await ensureDbSchema();
  const result = await getD1().prepare(`SELECT p.id, p.title, p.authors_json AS authorsJson, p.publication_year AS year, p.venue, p.doi,
    p.landing_page_url AS landingPageUrl, p.pdf_url AS pdfUrl, p.topic, p.arxiv_id AS arxivId, p.openreview_id AS openReviewId,
    COALESCE(AVG(l.rating), 0) AS averageRating, COUNT(l.rating) AS ratingCount, COUNT(DISTINCT l.id) AS logCount,
    COUNT(DISTINCT ce.id) AS codeExperienceCount, MAX(COALESCE(l.updated_at, ce.updated_at, p.created_at)) AS activeAt
    FROM papers p LEFT JOIN logs l ON l.paper_id = p.id LEFT JOIN code_experiences ce ON ce.paper_id = p.id
    GROUP BY p.id ORDER BY activeAt DESC LIMIT 40`).all<Record<string, unknown>>();
  return result.results.map((row) => ({ id: String(row.id), title: String(row.title), authors: JSON.parse(String(row.authorsJson)) as string[], year: row.year == null ? null : Number(row.year), venue: String(row.venue), abstract: "", doi: row.doi ? String(row.doi) : null, landingPageUrl: row.landingPageUrl ? String(row.landingPageUrl) : null, pdfUrl: row.pdfUrl ? String(row.pdfUrl) : null, citedByCount: 0, topic: String(row.topic), arxivId: row.arxivId ? String(row.arxivId) : null, openReviewId: row.openReviewId ? String(row.openReviewId) : null, summary: { paperId: String(row.id), averageRating: Number(row.averageRating), ratingCount: Number(row.ratingCount), logCount: Number(row.logCount), codeExperienceCount: Number(row.codeExperienceCount) } }));
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; from?: string; to?: string; sort?: string }> }) {
  const params = await searchParams; const user = await getChatGPTUser(); const query = params.q?.trim() ?? "";
  let papers: Array<Paper & { summary?: PaperSummary }> = query.length >= 2 ? await searchOpenAlex(query) : await communityPapers();
  const ids = papers.map((paper) => paper.id);
  if (query && ids.length) { await ensureDbSchema(); const placeholders = ids.map(() => "?").join(","); const stats = await getD1().prepare(`SELECT paper_id AS paperId, AVG(rating) AS averageRating, COUNT(rating) AS ratingCount, COUNT(*) AS logCount FROM logs WHERE paper_id IN (${placeholders}) GROUP BY paper_id`).bind(...ids).all<Record<string, unknown>>(); const map = new Map(stats.results.map((row) => [row.paperId, row])); papers = papers.map((paper) => { const row = map.get(paper.id); return { ...paper, summary: { paperId: paper.id, averageRating: Number(row?.averageRating ?? 0), ratingCount: Number(row?.ratingCount ?? 0), logCount: Number(row?.logCount ?? 0), codeExperienceCount: 0 } }; }); }
  const from = Number(params.from) || 0; const to = Number(params.to) || 9999;
  papers = papers.filter((paper) => !paper.year || (paper.year >= from && paper.year <= to));
  if (params.sort === "rating") papers.sort((a, b) => (b.summary?.averageRating ?? 0) - (a.summary?.averageRating ?? 0));
  else if (params.sort === "newest") papers.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  else if (params.sort === "cited") papers.sort((a, b) => b.citedByCount - a.citedByCount);
  return <div className="site-shell"><SiteHeader user={user} /><main className="content-wrap explore-wrap"><p className="eyebrow">Discovery</p><h1 className="section-title">Explore the literature</h1><p className="explore-intro">Search a title, person, DOI, arXiv ID, or OpenReview URL. Without a search, this page shows real Paperlog activity.</p><form className="explore-form" method="get"><input name="q" defaultValue={query} placeholder="Neural rendering, 10.1145/…, 2401.12345…" /><input name="from" inputMode="numeric" defaultValue={params.from} placeholder="From year" /><input name="to" inputMode="numeric" defaultValue={params.to} placeholder="To year" /><select name="sort" defaultValue={params.sort ?? "activity"}><option value="activity">Community activity</option><option value="rating">Reader rating</option><option value="newest">Newest</option><option value="cited">Most cited</option></select><button className="pill-button">Explore</button></form><p className="section-kicker">{papers.length} result{papers.length === 1 ? "" : "s"}</p><div className="explore-grid">{papers.map((paper) => <a className="paper-card" href={`/paper/${paper.id}`} key={paper.id}><div className="paper-meta"><span className="topic-chip">{paper.topic}</span><span>{paper.year ?? "—"}</span></div><h2 className="paper-title">{paper.title}</h2><p className="paper-authors">{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? " et al." : ""}</p><div className="paper-bottom"><span>{paper.venue}</span><span className="log-count">{paper.summary?.ratingCount ? <>★ {paper.summary.averageRating.toFixed(1)} · {paper.summary.ratingCount} rating{paper.summary.ratingCount === 1 ? "" : "s"}</> : paper.citedByCount ? `${paper.citedByCount.toLocaleString()} citations` : "No ratings yet"}</span></div></a>)}</div>{!papers.length && <div className="empty-state">No papers match those filters. Try a title, DOI, or wider year range.</div>}</main><SiteFooter /></div>;
}
