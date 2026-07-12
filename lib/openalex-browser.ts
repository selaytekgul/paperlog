import type { Paper } from "./types";

type BrowserOpenAlexWork = {
  id?: string; display_name?: string; title?: string; publication_year?: number; cited_by_count?: number; doi?: string;
  authorships?: Array<{ author?: { display_name?: string } }>;
  primary_location?: { landing_page_url?: string; pdf_url?: string; source?: { display_name?: string } };
  best_oa_location?: { landing_page_url?: string; pdf_url?: string };
  primary_topic?: { display_name?: string };
  abstract_inverted_index?: Record<string, number[]>;
  ids?: { arxiv?: string; openreview?: string };
};

function abstractFromIndex(index?: Record<string, number[]>) {
  if (!index) return "";
  const words: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(index)) for (const position of positions) words.push([position, word]);
  return words.sort((a, b) => a[0] - b[0]).map(([, word]) => word).join(" ");
}

function normalize(work: BrowserOpenAlexWork): Paper | null {
  const id = work.id?.split("/").pop();
  if (!id || !/^W\d+$/.test(id)) return null;
  return { id, title: work.display_name ?? work.title ?? "Untitled paper",
    authors: work.authorships?.map((entry) => entry.author?.display_name).filter((name): name is string => Boolean(name)) ?? [],
    year: work.publication_year ?? null, venue: work.primary_location?.source?.display_name ?? "Research paper",
    abstract: abstractFromIndex(work.abstract_inverted_index), doi: work.doi ?? null,
    landingPageUrl: work.primary_location?.landing_page_url ?? work.best_oa_location?.landing_page_url ?? work.doi ?? null,
    pdfUrl: work.best_oa_location?.pdf_url ?? work.primary_location?.pdf_url ?? null,
    citedByCount: work.cited_by_count ?? 0, topic: work.primary_topic?.display_name ?? "Research",
    arxivId: work.ids?.arxiv?.match(/([^/]+)$/)?.[1] ?? null,
    openReviewId: work.ids?.openreview?.match(/[?&]id=([^&#]+)/)?.[1] ?? null };
}

export async function searchOpenAlexInBrowser(query: string): Promise<Paper[]> {
  const value = query.trim();
  const workId = value.match(/(?:openalex\.org\/)?(W\d+)/i)?.[1]?.toUpperCase();
  const doi = value.match(/(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)?(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i)?.[1]?.toLowerCase().replace(/[.,;]$/, "");
  const url = workId
    ? new URL(`https://api.openalex.org/works/${workId}`)
    : doi
      ? new URL(`https://api.openalex.org/works/https://doi.org/${doi}`)
      : new URL("https://api.openalex.org/works");
  if (!workId && !doi) {
    url.searchParams.set("search", value);
    url.searchParams.set("per-page", "8");
    url.searchParams.set("select", "id,display_name,publication_year,cited_by_count,doi,authorships,primary_location,best_oa_location,primary_topic,ids");
  }
  url.searchParams.set("mailto", "hello@paperlog.net");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(response.status === 429 ? "OpenAlex’s search allowance is temporarily exhausted." : "OpenAlex search is unavailable.");
  const payload = await response.json() as BrowserOpenAlexWork | { results?: BrowserOpenAlexWork[] };
  const works: BrowserOpenAlexWork[] = "results" in payload ? payload.results ?? [] : [payload as BrowserOpenAlexWork];
  return works.map(normalize).filter((paper): paper is Paper => Boolean(paper));
}
