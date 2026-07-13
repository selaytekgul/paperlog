import { ensureDbSchema } from "../../../../db";
import { getBetterAuth } from "../../../../lib/auth";

async function handle(request: Request) {
  await ensureDbSchema();
  const auth = getBetterAuth();
  if (!auth) return Response.json({ error: "External sign-in is not configured" }, { status: 503 });
  return auth.handler(request);
}

export const GET = handle;
export const POST = handle;
