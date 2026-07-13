import { getStoredPaper, getStoredPaperByDoi } from "../db/papers";
import { upsertPaper } from "../db/helpers";
import { ensureDbSchema } from "../db";
import { getOpenAlexPaper, getOpenAlexPaperByDoi } from "./openalex";
import { resolveDoiWithFallback } from "./doi";
import { getPaperPicturePaperByDoi, getPaperPicturePaperById } from "./paper-picture-catalog";

export async function getCatalogPaper(id: string) {
  const paperPicturePaper = getPaperPicturePaperById(id);
  if (paperPicturePaper) return paperPicturePaper;
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

export async function getCatalogPaperByDoi(input: string) {
  const paperPicturePaper = getPaperPicturePaperByDoi(input);
  if (paperPicturePaper) return paperPicturePaper;
  return resolveDoiWithFallback(input, {
    lookupRemote: getOpenAlexPaperByDoi,
    lookupStored: getStoredPaperByDoi,
    cacheRemote: async (paper) => {
      await ensureDbSchema();
      await upsertPaper(paper);
    },
  });
}
