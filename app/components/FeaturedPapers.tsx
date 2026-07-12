"use client";

import { useEffect, useState } from "react";
import type { PaperSummary } from "../../lib/types";

type FeaturedPaper = { id: string; topic: string; year: number; title: string; authors: string };

export function FeaturedPapers({ papers }: { papers: FeaturedPaper[] }) {
  const [summaries, setSummaries] = useState<Record<string, PaperSummary>>({});
  useEffect(() => { fetch(`/api/papers/summaries?ids=${papers.map((paper) => paper.id).join(",")}`).then(async (response) => await response.json() as { summaries?: PaperSummary[] }).then((payload) => setSummaries(Object.fromEntries((payload.summaries ?? []).map((summary) => [summary.paperId, summary])))); }, [papers]);
  return <div className="paper-grid">{papers.map((paper) => <a href={`/paper/${paper.id}`} className="paper-card" key={paper.id}><div className="paper-meta"><span className="topic-chip">{paper.topic}</span><span>{paper.year}</span></div><h3 className="paper-title">{paper.title}</h3><p className="paper-authors">{paper.authors}</p><div className="paper-bottom"><span className="note-paper">Open paper page</span><span className="log-count">{summaries[paper.id]?.ratingCount ? <><span className="rating">★ {summaries[paper.id].averageRating.toFixed(1)}</span> · {summaries[paper.id].ratingCount} rating{summaries[paper.id].ratingCount === 1 ? "" : "s"}</> : "Be the first to rate"}</span></div></a>)}</div>;
}
