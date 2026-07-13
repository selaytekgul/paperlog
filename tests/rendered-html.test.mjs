import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
