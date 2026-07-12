import type { Metadata } from "next";
import { getChatGPTUser } from "./chatgpt-auth";
import { HomeExperience } from "./components/HomeExperience";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const user = await getChatGPTUser();
  return <HomeExperience user={user} />;
}
