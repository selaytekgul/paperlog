import { getChatGPTUser } from "./chatgpt-auth";
import { HomeExperience } from "./components/HomeExperience";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <HomeExperience user={user} />;
}
