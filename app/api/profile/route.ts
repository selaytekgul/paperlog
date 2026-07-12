import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureDbSchema, getD1, rateLimit } from "../../../db";
import { upsertProfile } from "../../../db/helpers";

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const payload = await request.json() as { displayName?: string; bio?: string; affiliation?: string; interests?: string[] };
  const displayName = payload.displayName?.trim() || user.displayName;
  const bio = payload.bio?.trim() ?? "";
  const affiliation = payload.affiliation?.trim() ?? "";
  const interests = (payload.interests ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 12);
  if (displayName.length > 80 || bio.length > 500 || affiliation.length > 120 || interests.some((item) => item.length > 50)) return Response.json({ error: "Profile field is too long" }, { status: 400 });
  if (!(await rateLimit(user.email, "profile-update", 8, 30))) return Response.json({ error: "You’re updating too quickly." }, { status: 429 });
  await ensureDbSchema();
  await upsertProfile(user.email, displayName);
  await getD1().prepare("UPDATE profiles SET display_name = ?, bio = ?, affiliation = ?, interests_json = ?, updated_at = CURRENT_TIMESTAMP WHERE user_email = ?")
    .bind(displayName, bio, affiliation, JSON.stringify(interests), user.email).run();
  return Response.json({ saved: true, profile: { displayName, bio, affiliation, interests } });
}
