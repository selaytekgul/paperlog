"use client";

import { useEffect, useState } from "react";
import type { PaperSummary } from "../../lib/types";

type FeaturedPaper = { id: string; topic: string; year: number; title: string; authors: string };

export function FeaturedPapers({ papers }: { papers: FeaturedPaper[] }) {
  const [summaries, setSummaries] = useState<Record<string, PaperSummary>>({});
  useEffect(() => { fetch(`/api/papers/summaries?ids=${papers.map((paper) => paper.id).join(",")}`).then(async (response) => await response.json() as { summaries?: PaperSummary[] }).then((payload) => setSummaries(Object.fromEntries((payload.summaries ?? []).map((summary) => [summary.paperId, summary])))); }, [papers]);
  return <div className="featured-list">{papers.map((paper) => <a href={`/paper/${paper.id}`} className="featured-row" key={paper.id}><div className="featured-row-meta"><span>{paper.topic}</span><span>{paper.year}</span></div><h3>{paper.title}</h3><p>{paper.authors}</p><div className="featured-row-foot"><span>View paper</span><span>{summaries[paper.id]?.ratingCount ? <><span className="rating">★ {summaries[paper.id].averageRating.toFixed(1)}</span> · {summaries[paper.id].ratingCount}</> : "No ratings yet"}</span></div></a>)}</div>;
}
