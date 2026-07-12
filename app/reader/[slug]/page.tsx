import { notFound } from "next/navigation";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ReaderProfile } from "../../components/ReaderProfile";
import { getReaderBySlug } from "../../../db/readers";

export const dynamic = "force-dynamic";

export default async function PublicReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getChatGPTUser();
  const reader = await getReaderBySlug(slug, user?.email);
  if (!reader) notFound();
  return <ReaderProfile reader={reader} />;
}
