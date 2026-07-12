import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChatGPTUser } from "../../chatgpt-auth";
import { PaperDetail } from "../../components/PaperDetail";
import { getCatalogPaper } from "../../../lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  let paper = null;
  try { paper = await getCatalogPaper(id); } catch { /* The page can still return its normal not-found state. */ }
  if (!paper) return { title: "Paper not found", robots: { index: false, follow: false } };
  const description = paper.abstract.slice(0, 155) || `Reader ratings, notes, and reproducibility experiences for ${paper.title}.`;
  const canonical = `/paper/${encodeURIComponent(paper.id)}`;
  return {
    title: paper.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: paper.title,
      description,
    },
  };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [paper, user] = await Promise.all([getCatalogPaper(id), getChatGPTUser()]);
  if (!paper) notFound();
  return <PaperDetail paper={paper} user={user} />;
}
