import { getCatalogPaperByDoi } from "../../../lib/catalog";
import { canonicalPaperPath, normalizeDoi } from "../../../lib/doi";

function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawDoi = requestUrl.searchParams.get("doi");
  if (!rawDoi) return errorResponse("A DOI is required.", 400);

  const doi = normalizeDoi(rawDoi);
  if (!doi) return errorResponse("The DOI is not valid.", 400);

  try {
    const paper = await getCatalogPaperByDoi(doi);
    const destinationPath = paper ? canonicalPaperPath(paper.id) : null;
    if (!destinationPath) return errorResponse("Paper not found.", 404);

    const destination = new URL(destinationPath, requestUrl.origin);
    return new Response(null, {
      status: 307,
      headers: {
        "Cache-Control": "public, max-age=3600",
        Location: destination.toString(),
      },
    });
  } catch {
    return errorResponse("Paper lookup is temporarily unavailable.", 503);
  }
}
