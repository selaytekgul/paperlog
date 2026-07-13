import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function importTypeScriptModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
}

test("ships the Paperlog discovery experience", async () => {
  const [home, layout, styles] = await Promise.all([
    readFile(new URL("../app/components/HomeExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /Paperlog — Papers and what people think about them/);
  assert.match(home, /Every paper leaves an/);
  assert.match(home, /Papers people keep returning to/);
  assert.match(home, /<SearchBox \/>/);
  assert.match(styles, /--green: #173f32/);
  assert.doesNotMatch(home + layout, /codex-preview|react-loading-skeleton/);
});

test("covers account export and deletion across Paperlog data stores", async () => {
  const [accountRoute, database, privacy] = await Promise.all([
    readFile(new URL("../app/api/account/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
  ]);
  for (const table of ["profiles", "logs", "reading_entries", "reports", "contact_requests", "activity_events", "follows", "helpful_votes", "replies", "notifications", "paper_lists", "paper_list_items", "code_experiences", "metadata_corrections", "author_claims", "session", "account", "verification", "user"]) {
    assert.match(accountRoute, new RegExp(table));
  }
  assert.match(accountRoute, /Cache-Control.*no-store/);
  assert.match(accountRoute, /identityProviderAccountDeleted: false/);
  assert.match(database, /30 \* 24 \* 60 \* 60_000/);
  assert.match(privacy, /immediately removes account-linked records/);
  assert.match(privacy, /does not delete your Google, GitHub, ChatGPT/);
});

test("offers unified sign-in without replacing managed ChatGPT auth", async () => {
  const [signIn, authBridge, authConfig] = await Promise.all([
    readFile(new URL("../app/signin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/chatgpt-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth.ts", import.meta.url), "utf8"),
  ]);
  assert.match(signIn, /Continue with ChatGPT/);
  assert.match(signIn, /SocialSignInButtons/);
  assert.match(authBridge, /signin-with-chatgpt/);
  assert.match(authConfig, /google/);
  assert.match(authConfig, /github/);
  assert.match(authConfig, /encryptOAuthTokens: true/);
});

test("normalizes Paper Picture DOIs and produces only canonical Paperlog paths", async () => {
  const { canonicalPaperPath, normalizeDoi } = await importTypeScriptModule("../lib/doi.ts");
  const paperPictureDois = [
    "10.1007/s00366-024-01958-4",
    "10.1007/s00366-025-02243-8",
    "10.1007/s00158-024-03916-6",
    "10.1007/s00371-021-02183-6",
    "10.1007/s00366-023-01834-7",
    "10.1007/s00371-025-03949-y",
    "10.1007/s00366-025-02175-3",
    "10.1007/s00366-024-02065-0",
    "10.1007/s44379-025-00013-3",
    "10.1007/s00366-024-02004-z",
    "10.1007/s00366-024-02020-z",
    "10.1007/s00366-024-01950-y",
  ];

  for (const doi of paperPictureDois) {
    assert.equal(normalizeDoi(doi), doi);
    assert.equal(normalizeDoi(`https://doi.org/${doi}`), doi);
    assert.equal(normalizeDoi(encodeURIComponent(doi)), doi);
  }
  assert.equal(normalizeDoi(""), null);
  assert.equal(normalizeDoi("not-a-doi"), null);
  assert.equal(normalizeDoi("%E0%A4%A"), null);
  assert.equal(canonicalPaperPath("w4400273555"), "/paper/W4400273555");
  assert.equal(canonicalPaperPath("https://malicious.example"), null);
});

test("uses the stored catalog when DOI metadata lookup is unavailable", async () => {
  const { resolveDoiWithFallback } = await importTypeScriptModule("../lib/doi.ts");
  const stored = { id: "W4400273555" };
  let storedLookups = 0;
  const resolved = await resolveDoiWithFallback("10.1007/s00366-024-02020-z", {
    lookupRemote: async () => { throw new Error("provider unavailable"); },
    lookupStored: async () => { storedLookups += 1; return stored; },
  });
  assert.equal(resolved, stored);
  assert.equal(storedLookups, 1);

  const remote = { id: "W4384648047" };
  const remoteResolved = await resolveDoiWithFallback("10.1007/s00366-024-01958-4", {
    lookupRemote: async () => remote,
    lookupStored: async () => { throw new Error("stored lookup should not run"); },
    cacheRemote: async () => { throw new Error("cache unavailable"); },
  });
  assert.equal(remoteResolved, remote);
});

test("ships a same-origin DOI redirect endpoint", async () => {
  const [route, catalog] = await Promise.all([
    readFile(new URL("../app/paper/doi/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8"),
  ]);
  assert.match(route, /new URL\(destinationPath, requestUrl\.origin\)/);
  assert.match(route, /status: 307/);
  assert.match(route, /getCatalogPaperByDoi/);
  assert.match(catalog, /lookupRemote: getOpenAlexPaperByDoi/);
  assert.match(catalog, /lookupStored: getStoredPaperByDoi/);
});

test("keeps every Paper Picture destination available without an OpenAlex request", async () => {
  const [catalog, routeAlias, paperDetail, known] = await Promise.all([
    readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/paper/resolve/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/PaperDetail.tsx", import.meta.url), "utf8"),
    importTypeScriptModule("../lib/paper-picture-catalog.ts"),
  ]);
  assert.equal(known.paperPictureCatalog.length, 12);
  assert.equal(new Set(known.paperPictureCatalog.map((paper) => paper.id)).size, 12);
  for (const paper of known.paperPictureCatalog) {
    assert.match(paper.id, /^W\d+$/);
    assert.equal(known.getPaperPicturePaperById(paper.id)?.title, paper.title);
    assert.equal(known.getPaperPicturePaperByDoi(paper.doi)?.id, paper.id);
  }
  assert.match(catalog, /getPaperPicturePaperById\(id\)/);
  assert.match(catalog, /getPaperPicturePaperByDoi\(input\)/);
  assert.match(routeAlias, /export \{ GET \} from "\.\.\/doi\/route"/);
  assert.match(paperDetail, /paper\.citedByCount >= 0/);
});
