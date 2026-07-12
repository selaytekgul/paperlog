import { ensureDbSchema, getD1 } from "../../../db";

export async function GET() {
  const started = Date.now();
  try {
    await ensureDbSchema();
    await getD1().prepare("SELECT 1 AS ok").first();
    return Response.json({ status: "ok", database: "connected", latencyMs: Date.now() - started, checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable", checkedAt: new Date().toISOString() }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
