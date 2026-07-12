import { searchOpenAlex } from "../../../lib/openalex";
import { searchStoredPapers } from "../../../db/papers";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ papers: [] });
  try {
    return Response.json({ papers: await searchOpenAlex(query) });
  } catch (error) {
    const papers = await searchStoredPapers(query);
    return Response.json({ papers, source: "paperlog", warning: papers.length ? "Showing Paperlog’s local catalog while OpenAlex is unavailable." : error instanceof Error ? error.message : "Search failed" });
  }
}
