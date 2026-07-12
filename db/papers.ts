import { ensureDbSchema, getD1 } from ".";
import type { Paper } from "../lib/types";

type StoredPaperRow = {
  id: string; title: string; authorsJson: string; publicationYear: number | null; venue: string; doi: string | null;
  landingPageUrl: string | null; pdfUrl: string | null; topic: string; abstract: string; citedByCount: number;
  arxivId: string | null; openReviewId: string | null;
};

function fromRow(row: StoredPaperRow): Paper {
  return { id: row.id, title: row.title, authors: JSON.parse(row.authorsJson) as string[], year: row.publicationYear,
    venue: row.venue, doi: row.doi, landingPageUrl: row.landingPageUrl, pdfUrl: row.pdfUrl, topic: row.topic,
    abstract: row.abstract, citedByCount: row.citedByCount, arxivId: row.arxivId, openReviewId: row.openReviewId };
}

export async function getStoredPaper(id: string): Promise<Paper | null> {
  await ensureDbSchema();
  const row = await getD1().prepare(`SELECT id, title, authors_json AS authorsJson, publication_year AS publicationYear, venue, doi,
    landing_page_url AS landingPageUrl, pdf_url AS pdfUrl, topic, abstract, cited_by_count AS citedByCount,
    arxiv_id AS arxivId, openreview_id AS openReviewId FROM papers WHERE id = ?`).bind(id).first<StoredPaperRow>();
  return row ? fromRow(row) : null;
}

export async function searchStoredPapers(query: string): Promise<Paper[]> {
  await ensureDbSchema();
  const normalized = query.toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "").replace(/^doi:\s*/, "").trim();
  const pattern = `%${normalized.replace(/[%_]/g, "")}%`;
  const result = await getD1().prepare(`SELECT id, title, authors_json AS authorsJson, publication_year AS publicationYear, venue, doi,
    landing_page_url AS landingPageUrl, pdf_url AS pdfUrl, topic, abstract, cited_by_count AS citedByCount,
    arxiv_id AS arxivId, openreview_id AS openReviewId FROM papers
    WHERE LOWER(title) LIKE ? OR LOWER(authors_json) LIKE ? OR LOWER(COALESCE(doi, '')) LIKE ? OR LOWER(COALESCE(arxiv_id, '')) LIKE ?
    ORDER BY metadata_updated_at DESC LIMIT 12`).bind(pattern, pattern, pattern, pattern).all<StoredPaperRow>();
  return result.results.map(fromRow);
}
