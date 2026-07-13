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
  ids?: { arxiv?: string; doi?: string; openreview?: string };
  locations?: Array<{ landing_page_url?: string }>;
};

type OpenAlexAuthor = { id?: string; display_name?: string };

function abstractFromIndex(index?: Record<string, number[]>): string {
  if (!index) return "";
  const words: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) words.push([position, word]);
  }
  return words.sort((a, b) => a[0] - b[0]).map(([, word]) => word).join(" ");
}

function addOpenAlexCredentials(url: URL) {
  url.searchParams.set("mailto", "hello@paperlog.net");
  const apiKey = process.env.OPENALEX_API_KEY?.trim();
  if (apiKey) url.searchParams.set("api_key", apiKey);
  return url;
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
    arxivId: extractArxivId(work),
    openReviewId: extractOpenReviewId(work),
  };
}

function extractArxivId(work: OpenAlexWork) {
  const candidate = work.ids?.arxiv ?? work.locations?.map((location) => location.landing_page_url).find((url) => url?.includes("arxiv.org/"));
  return candidate?.match(/arxiv\.org\/(?:abs|pdf)\/([^?#/.]+(?:\.\d+)?)/i)?.[1] ?? null;
}

function extractOpenReviewId(work: OpenAlexWork) {
  const candidate = work.ids?.openreview ?? work.locations?.map((location) => location.landing_page_url).find((url) => url?.includes("openreview.net/forum"));
  return candidate?.match(/[?&]id=([^&#]+)/)?.[1] ?? null;
}

export async function searchOpenAlex(query: string): Promise<Paper[]> {
  const direct = parsePaperIdentifier(query);
  if (direct.kind === "openalex") {
    const paper = await getOpenAlexPaper(direct.value);
    return paper ? [paper] : [];
  }
  if (direct.kind === "doi") {
    const paper = await getOpenAlexPaperByDoi(direct.value);
    if (paper) return [paper];
  }
  if (direct.kind === "arxiv") {
    const paper = await getOpenAlexPaperByArxiv(direct.value);
    if (paper) return [paper];
  }
  if (direct.kind === "openreview") {
    const paper = await getOpenAlexPaperByOpenReview(direct.value);
    if (paper) return [paper];
  }
  const authorId = direct.kind === "search" ? await findExactAuthor(query) : null;
  const url = new URL("https://api.openalex.org/works");
  if (authorId) {
    url.searchParams.set("filter", `authorships.author.id:${authorId}`);
    url.searchParams.set("sort", "cited_by_count:desc");
  } else {
    url.searchParams.set("search", direct.kind === "arxiv" || direct.kind === "openreview" ? direct.value : query);
  }
  url.searchParams.set("per-page", "8");
  url.searchParams.set("select", "id,display_name,publication_year,cited_by_count,doi,authorships,primary_location,best_oa_location,primary_topic,ids");
  addOpenAlexCredentials(url);
  const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 300 } });
  if (!response.ok) throw new Error("OpenAlex search is temporarily unavailable");
  const payload = (await response.json()) as { results?: OpenAlexWork[] };
  return (payload.results ?? []).map(normalizeOpenAlexWork).filter((paper) => paper.id);
}

function normalizedName(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function findExactAuthor(query: string): Promise<string | null> {
  const url = new URL("https://api.openalex.org/authors");
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", "3");
  url.searchParams.set("select", "id,display_name");
  addOpenAlexCredentials(url);
  const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
  if (!response.ok) return null;
  const payload = (await response.json()) as { results?: OpenAlexAuthor[] };
  const expected = normalizedName(query);
  const author = payload.results?.find((candidate) => candidate.id && candidate.display_name && normalizedName(candidate.display_name) === expected);
  return author?.id?.split("/").pop() ?? null;
}

export function parsePaperIdentifier(input: string): { kind: "openalex" | "doi" | "arxiv" | "openreview" | "search"; value: string } {
  const value = input.trim();
  const work = value.match(/(?:openalex\.org\/)?(W\d+)/i)?.[1];
  if (work) return { kind: "openalex", value: work.toUpperCase() };
  const arxivDoi = value.match(/10\.48550\/arxiv\.([^\s?#]+)/i)?.[1];
  if (arxivDoi) return { kind: "arxiv", value: arxivDoi };
  const doi = value.match(/(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)?(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i)?.[1];
  if (doi) return { kind: "doi", value: doi.toLowerCase().replace(/[.,;]$/, "") };
  const arxiv = value.match(/(?:arxiv:\s*|arxiv\.org\/(?:abs|pdf)\/)?(\d{4}\.\d{4,5}(?:v\d+)?|[a-z-]+\/\d{7})(?:\.pdf)?/i)?.[1];
  if (arxiv) return { kind: "arxiv", value: arxiv };
  const openreview = value.match(/openreview\.net\/(?:forum|pdf)\?id=([^&#]+)/i)?.[1];
  if (openreview) return { kind: "openreview", value: openreview };
  return { kind: "search", value };
}

export async function getOpenAlexPaperByDoi(doi: string): Promise<Paper | null> {
  const url = addOpenAlexCredentials(new URL(`https://api.openalex.org/works/https://doi.org/${doi}`));
  const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("OpenAlex is temporarily unavailable");
  return normalizeOpenAlexWork((await response.json()) as OpenAlexWork);
}

async function getOpenAlexPaperByArxiv(arxivId: string): Promise<Paper | null> {
  const response = await fetch(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId.replace(/v\d+$/i, ""))}`, { headers: { Accept: "application/atom+xml" }, next: { revalidate: 86400 } });
  if (!response.ok) return null;
  const xml = await response.text();
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  const rawTitle = entry?.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  if (!rawTitle) return null;
  const title = decodeXml(rawTitle).replace(/\s+/g, " ").trim();
  const papers = await searchOpenAlex(title);
  const normalized = title.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const match = papers.find((paper) => paper.title.toLowerCase().replace(/[^a-z0-9]+/g, "") === normalized) ?? papers[0];
  return match ? { ...match, arxivId } : null;
}

async function getOpenAlexPaperByOpenReview(noteId: string): Promise<Paper | null> {
  const response = await fetch(`https://api2.openreview.net/notes?id=${encodeURIComponent(noteId)}`, { headers: { Accept: "application/json" }, next: { revalidate: 86400 } });
  if (!response.ok) return null;
  const payload = await response.json() as { notes?: Array<{ content?: { title?: string | { value?: string } } }> };
  const titleValue = payload.notes?.[0]?.content?.title;
  const title = typeof titleValue === "string" ? titleValue : titleValue?.value;
  if (!title) return null;
  const papers = await searchOpenAlex(title);
  return papers[0] ? { ...papers[0], openReviewId: noteId } : null;
}

function decodeXml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export async function getOpenAlexPaper(id: string): Promise<Paper | null> {
  if (!/^W\d+$/.test(id)) return null;
  const url = addOpenAlexCredentials(new URL(`https://api.openalex.org/works/${id}`));
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("OpenAlex is temporarily unavailable");
  return normalizeOpenAlexWork((await response.json()) as OpenAlexWork);
}
