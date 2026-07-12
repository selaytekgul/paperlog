import { ensureDbSchema, getDb, rateLimit } from "../../../db";
import { contactRequests } from "../../../db/schema";

const categories = new Set(["feedback", "privacy", "copyright", "safety", "metadata", "appeal"]);

export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: string; category?: string; message?: string };
  const email = payload.email?.trim().toLowerCase() ?? "";
  const category = payload.category ?? "feedback";
  const message = payload.message?.trim() ?? "";
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  if (!categories.has(category)) return Response.json({ error: "Choose a valid request category" }, { status: 400 });
  if (message.length < 10 || message.length > 4000) return Response.json({ error: "Message must be between 10 and 4,000 characters" }, { status: 400 });
  await ensureDbSchema();
  if (!(await rateLimit(email, "contact", 4, 60))) return Response.json({ error: "Too many recent requests. Try again later." }, { status: 429 });
  await getDb().insert(contactRequests).values({ email, category, message });
  return Response.json({ submitted: true }, { status: 201 });
}
