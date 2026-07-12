import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ReaderProfile } from "../../components/ReaderProfile";
import { getReaderBySlug } from "../../../db/readers";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let reader = null;
  try { reader = await getReaderBySlug(slug); } catch { /* The page handles missing readers below. */ }
  if (!reader) return { title: "Reader not found", robots: { index: false, follow: false } };
  const description = reader.bio || `${reader.displayName}'s research-paper reading diary on Paperlog.`;
  const canonical = `/reader/${encodeURIComponent(reader.slug)}`;
  return {
    title: `${reader.displayName}'s reading log`,
    description: description.slice(0, 155),
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${reader.displayName}'s reading log`,
      description: description.slice(0, 155),
    },
  };
}

export default async function PublicReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getChatGPTUser();
  const reader = await getReaderBySlug(slug, user?.email);
  if (!reader) notFound();
  return <ReaderProfile reader={reader} />;
}
