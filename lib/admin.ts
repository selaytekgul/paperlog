import { env } from "cloudflare:workers";

export function isPaperlogAdmin(email: string) {
  const configured = String((env as unknown as Record<string, unknown>).PAPERLOG_ADMIN_EMAIL ?? "").toLowerCase();
  return Boolean(configured) && configured === email.toLowerCase();
}
