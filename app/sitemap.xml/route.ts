import { ensureDbSchema, getD1 } from "../../db";

export const dynamic = "force-dynamic";

type SitemapEntry = {
  location: string;
  lastModified?: string;
  changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
};

const origin = "https://paperlog.net";

const staticEntries: SitemapEntry[] = [
  { location: "/", changeFrequency: "daily", priority: 1 },
  { location: "/explore", changeFrequency: "daily", priority: 0.9 },
  { location: "/alpha", changeFrequency: "monthly", priority: 0.5 },
  { location: "/guidelines", changeFrequency: "monthly", priority: 0.4 },
  { location: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { location: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { location: "/copyright", changeFrequency: "monthly", priority: 0.3 },
  { location: "/contact", changeFrequency: "monthly", priority: 0.3 },
];

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function validDate(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

export async function GET() {
  const entries = [...staticEntries];
  try {
    await ensureDbSchema();
    const [paperRows, profileRows] = await Promise.all([
      getD1().prepare("SELECT id, created_at AS updatedAt FROM papers ORDER BY created_at DESC LIMIT 10000").all<{ id: string; updatedAt: string }>(),
      getD1().prepare("SELECT slug, updated_at AS updatedAt FROM profiles ORDER BY updated_at DESC LIMIT 10000").all<{ slug: string; updatedAt: string }>(),
    ]);
    for (const row of paperRows.results) entries.push({ location: `/paper/${encodeURIComponent(row.id)}`, lastModified: validDate(row.updatedAt), changeFrequency: "weekly", priority: 0.8 });
    for (const row of profileRows.results) entries.push({ location: `/reader/${encodeURIComponent(row.slug)}`, lastModified: validDate(row.updatedAt), changeFrequency: "weekly", priority: 0.6 });
  } catch {
    // Static discovery remains available if the database is temporarily unavailable.
  }

  const urls = entries.map((entry) => `<url><loc>${escapeXml(`${origin}${entry.location}`)}</loc>${entry.lastModified ? `<lastmod>${entry.lastModified}</lastmod>` : ""}${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ""}${entry.priority == null ? "" : `<priority>${entry.priority.toFixed(1)}</priority>`}</url>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
