"use client";

import { useEffect, useMemo, useState } from "react";
import { searchOpenAlexInBrowser } from "../../lib/openalex-browser";
import type { Paper, PaperSummary } from "../../lib/types";

type ExplorePaper = Paper & { summary?: PaperSummary };

function emptySummary(paperId: string): PaperSummary {
  return { paperId, averageRating: 0, ratingCount: 0, logCount: 0, codeExperienceCount: 0 };
}

export function ExploreResults({
  initialPapers,
  query,
  browserFallback,
  from,
  to,
  sort,
}: {
  initialPapers: ExplorePaper[];
  query: string;
  browserFallback: boolean;
  from: number;
  to: number;
  sort: string;
}) {
  const [papers, setPapers] = useState(initialPapers);
  const [loading, setLoading] = useState(browserFallback);
  const [notice, setNotice] = useState(browserFallback ? "Searching OpenAlex directly…" : "");

  useEffect(() => {
    if (!browserFallback || !query) return;
    let active = true;

    void searchOpenAlexInBrowser(query).then(async (openAlexPapers) => {
      let summaries: PaperSummary[] = [];
      try {
        const response = await fetch(`/api/papers/summaries?ids=${encodeURIComponent(openAlexPapers.map((paper) => paper.id).join(","))}`);
        if (response.ok) summaries = ((await response.json()) as { summaries?: PaperSummary[] }).summaries ?? [];
      } catch {
        // Ratings are optional search-result context; paper discovery can continue without them.
      }
      if (!active) return;
      const summaryMap = new Map(summaries.map((summary) => [summary.paperId, summary]));
      const remote = openAlexPapers.map((paper) => ({ ...paper, summary: summaryMap.get(paper.id) ?? emptySummary(paper.id) }));
      setPapers([...remote, ...initialPapers.filter((local) => !remote.some((paper) => paper.id === local.id))]);
      setNotice("Results loaded directly from OpenAlex.");
    }).catch((caught) => {
      if (!active) return;
      setNotice(caught instanceof Error ? `${caught.message} Showing papers already saved on Paperlog.` : "Search is temporarily unavailable. Showing papers already saved on Paperlog.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [browserFallback, initialPapers, query]);

  const visiblePapers = useMemo(() => {
    const filtered = papers.filter((paper) => !paper.year || (paper.year >= from && paper.year <= to));
    if (sort === "rating") filtered.sort((a, b) => (b.summary?.averageRating ?? 0) - (a.summary?.averageRating ?? 0));
    else if (sort === "newest") filtered.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    else if (sort === "cited") filtered.sort((a, b) => b.citedByCount - a.citedByCount);
    return filtered;
  }, [from, papers, sort, to]);

  return <>
    {notice && <p className="search-notice explore-notice" role="status">{notice}</p>}
    <p className="section-kicker">{loading ? "Searching…" : `${visiblePapers.length} result${visiblePapers.length === 1 ? "" : "s"}`}</p>
    <div className="explore-grid">{visiblePapers.map((paper) => <a className="paper-card" href={`/paper/${paper.id}`} key={paper.id}><div className="paper-meta"><span className="topic-chip">{paper.topic}</span><span>{paper.year ?? "—"}</span></div><h2 className="paper-title">{paper.title}</h2><p className="paper-authors">{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? " et al." : ""}</p><div className="paper-bottom"><span>{paper.venue}</span><span className="log-count">{paper.summary?.ratingCount ? <>★ {paper.summary.averageRating.toFixed(1)} · {paper.summary.ratingCount} rating{paper.summary.ratingCount === 1 ? "" : "s"}</> : paper.citedByCount ? `${paper.citedByCount.toLocaleString()} citations` : "No ratings yet"}</span></div></a>)}</div>
    {!loading && !visiblePapers.length && <div className="empty-state">No papers match those filters. Try a title, DOI, or wider year range.</div>}
  </>;
}
