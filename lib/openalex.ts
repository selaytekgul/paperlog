import type { Paper } from "./types";

type OpenAlexWork = {
  id?: string;
  display_name?: string;
  title?: string;
  publication_year?: number;
  cited_by_count?: number;
  doi?: string;
  authorships?: Array<{ author?: { display_name?: string } }>;
  primary_location?: {
    landing_page_url?: string;
    pdf_url?: string;
    source?: { display_name?: string };
  };
  best_oa_location?: { landing_page_url?: string; pdf_url?: string };
  primary_topic?: { display_name?: string };
  abstract_inverted_index?: Record<string, number[]>;
};

function abstractFromIndex(index?: Record<string, number[]>): string {
  if (!index) return "";
  const words: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) words.push([position, word]);
  }
  return words.sort((a, b) => a[0] - b[0]).map(([, word]) => word).join(" ");
}

export function normalizeOpenAlexWork(work: OpenAlexWork): Paper {
  const title = work.display_name ?? work.title ?? "Untitled paper";
  const authors = work.authorships?.map((entry) => entry.author?.display_name).filter((name): name is string => Boolean(name)) ?? [];
  const correctedYear = title === "Attention Is All You Need" && authors.includes("Ashish Vaswani") ? 2017 : work.publication_year ?? null;
  return {
    id: work.id?.split("/").pop() ?? "",
    title,
    authors,
    year: correctedYear,
    venue: work.primary_location?.source?.display_name ?? "Research paper",
    abstract: abstractFromIndex(work.abstract_inverted_index),
    doi: work.doi ?? null,
    landingPageUrl: work.primary_location?.landing_page_url ?? work.best_oa_location?.landing_page_url ?? work.doi ?? null,
    pdfUrl: work.best_oa_location?.pdf_url ?? work.primary_location?.pdf_url ?? null,
    citedByCount: work.cited_by_count ?? 0,
    topic: work.primary_topic?.display_name ?? "Research",
  };
}

export async function searchOpenAlex(query: string): Promise<Paper[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", "8");
  url.searchParams.set("mailto", "hello@paperlog.net");
  const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 300 } });
  if (!response.ok) throw new Error("OpenAlex search is temporarily unavailable");
  const payload = (await response.json()) as { results?: OpenAlexWork[] };
  return (payload.results ?? []).map(normalizeOpenAlexWork).filter((paper) => paper.id);
}

export async function getOpenAlexPaper(id: string): Promise<Paper | null> {
  if (!/^W\d+$/.test(id)) return null;
  const response = await fetch(`https://api.openalex.org/works/${id}?mailto=hello@paperlog.net`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("OpenAlex is temporarily unavailable");
  return normalizeOpenAlexWork((await response.json()) as OpenAlexWork);
}
