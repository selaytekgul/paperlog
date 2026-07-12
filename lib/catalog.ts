import { getStoredPaper } from "../db/papers";
import { upsertPaper } from "../db/helpers";
import { ensureDbSchema } from "../db";
import { getOpenAlexPaper } from "./openalex";

export async function getCatalogPaper(id: string) {
  try {
    const paper = await getOpenAlexPaper(id);
    if (paper) {
      await ensureDbSchema();
      await upsertPaper(paper);
      return paper;
    }
  } catch {
    // The local catalog keeps previously opened papers available during metadata-provider outages.
  }
  return getStoredPaper(id);
}
