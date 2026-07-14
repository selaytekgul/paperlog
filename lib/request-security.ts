const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isProtectedMutation(method: string, pathname: string) {
  if (!unsafeMethods.has(method.toUpperCase())) return false;
  if (!pathname.startsWith("/api/")) return false;
  return pathname !== "/api/auth" && !pathname.startsWith("/api/auth/");
}

export function isTrustedMutationRequest(request: Request) {
  const url = new URL(request.url);
  if (!isProtectedMutation(request.method, url.pathname)) return true;

  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === url.origin;
  } catch {
    return false;
  }
}

export function crossSiteRequestResponse() {
  return Response.json(
    { error: "Cross-site request rejected" },
    { status: 403, headers: { "Cache-Control": "no-store", Vary: "Origin" } },
  );
}
