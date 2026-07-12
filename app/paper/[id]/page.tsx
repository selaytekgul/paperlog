import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChatGPTUser } from "../../chatgpt-auth";
import { PaperDetail } from "../../components/PaperDetail";
import { getOpenAlexPaper } from "../../../lib/openalex";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const paper = await getOpenAlexPaper(id);
  return paper ? { title: paper.title, description: paper.abstract.slice(0, 155) || `Reader ratings and notes for ${paper.title}.` } : { title: "Paper not found" };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [paper, user] = await Promise.all([getOpenAlexPaper(id), getChatGPTUser()]);
  if (!paper) notFound();
  return <PaperDetail paper={paper} user={user} />;
}
