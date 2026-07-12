import { searchOpenAlex } from "../../../lib/openalex";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ papers: [] });
  try {
    return Response.json({ papers: await searchOpenAlex(query) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 502 });
  }
}
