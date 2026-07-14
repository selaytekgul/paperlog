import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function importTypeScriptModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

async function findRouteFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return findRouteFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  }));
  return nested.flat();
}

test("allows safe and same-origin requests while rejecting cross-site mutations", async () => {
  const { isProtectedMutation, isTrustedMutationRequest } = await importTypeScriptModule("../lib/request-security.ts");
  assert.equal(isProtectedMutation("GET", "/api/search"), false);
  assert.equal(isProtectedMutation("POST", "/api/auth/sign-in/social"), false);
  assert.equal(isProtectedMutation("POST", "/api/papers/import"), true);

  const sameOrigin = new Request("https://paperlog.net/api/papers/import", {
    method: "POST",
    headers: { Origin: "https://paperlog.net", "Sec-Fetch-Site": "same-origin" },
  });
  const foreignOrigin = new Request("https://paperlog.net/api/papers/import", {
    method: "POST",
    headers: { Origin: "https://attacker.example", "Sec-Fetch-Site": "cross-site" },
  });
  const missingOrigin = new Request("https://paperlog.net/api/papers/import", { method: "POST" });
  const authCallback = new Request("https://paperlog.net/api/auth/callback/google", { method: "POST" });

  assert.equal(isTrustedMutationRequest(sameOrigin), true);
  assert.equal(isTrustedMutationRequest(foreignOrigin), false);
  assert.equal(isTrustedMutationRequest(missingOrigin), false);
  assert.equal(isTrustedMutationRequest(authCallback), true);
});

test("protects every app-owned mutating API route with the global API proxy", async () => {
  const [proxySource, authRoute, routeFiles] = await Promise.all([
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/auth/[...all]/route.ts", import.meta.url), "utf8"),
    findRouteFiles(new URL("../app/api/", import.meta.url)),
  ]);
  assert.match(proxySource, /matcher:\s*\["\/", "\/:path\*"\]/);
  assert.match(proxySource, /isTrustedMutationRequest/);
  assert.match(proxySource, /applySecurityHeaders/);
  assert.match(authRoute, /export const POST = handle/);

  const mutatingRoutes = [];
  for (const routeFile of routeFiles) {
    const source = await readFile(routeFile, "utf8");
    if (/export (?:async function|const) (?:POST|PUT|PATCH|DELETE)/.test(source)) mutatingRoutes.push(routeFile.pathname);
  }
  assert.ok(mutatingRoutes.length >= 17, `Expected at least 17 mutating routes, found ${mutatingRoutes.length}`);
  assert.equal(mutatingRoutes.filter((path) => path.includes("/api/auth/")).length, 1);
});

test("defines the required browser security headers", async () => {
  const [config, headerSource] = await Promise.all([
    readFile(new URL("../next.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/security-headers.ts", import.meta.url), "utf8"),
  ]);
  for (const header of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) assert.match(headerSource, new RegExp(header));
  assert.match(headerSource, /frame-ancestors 'none'/);
  assert.match(headerSource, /connect-src 'self' https:\/\/api\.openalex\.org/);
  assert.match(config, /securityHeaders/);
});

test("keeps health, search, administrator backup, and data-rights contracts observable", async () => {
  const [health, search, backup, account] = await Promise.all([
    readFile(new URL("../app/api/health/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/search/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/export/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/account/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(health, /database.*connected/);
  assert.match(search, /searchOpenAlex/);
  assert.match(search, /searchStoredPapers/);
  assert.match(backup, /schemaVersion:\s*3/);
  assert.match(backup, /Content-Disposition/);
  assert.match(backup, /Cache-Control.*no-store/);
  assert.match(account, /export async function DELETE/);
  assert.match(account, /confirmation !== "DELETE"/);
});
