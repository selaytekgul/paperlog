import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";
import { ReaderProfile } from "../components/ReaderProfile";
import { getReaderByEmail } from "../../db/readers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await requireChatGPTUser("/profile");
  const reader = await getReaderByEmail(user.email, user.displayName);
  if (!reader) return null;
  return <ReaderProfile reader={reader} />;
}
