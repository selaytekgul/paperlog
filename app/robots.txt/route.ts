const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /profile
Disallow: /signin-with-chatgpt
Disallow: /signout-with-chatgpt
Disallow: /callback

Sitemap: https://paperlog.net/sitemap.xml
Host: paperlog.net
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
