import { requireChatGPTUser } from "../chatgpt-auth";
import { ReaderProfile } from "../components/ReaderProfile";
import { getReaderByEmail } from "../../db/readers";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireChatGPTUser("/profile");
  const reader = await getReaderByEmail(user.email, user.displayName);
  if (!reader) return null;
  return <ReaderProfile reader={reader} />;
}
