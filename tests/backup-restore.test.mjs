import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { restoreBackup } from "../scripts/restore-backup.mjs";

const emptyTables = {
  reading_entries: [], reports: [], contact_requests: [], activity_events: [], follows: [],
  helpful_votes: [], replies: [], notifications: [], paper_lists: [], paper_list_items: [],
  code_experiences: [], metadata_corrections: [], author_claims: [], moderation_actions: [],
  session: [], verification: [],
};

test("restores and validates a schema-version-3 administrator backup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "paperlog-restore-test-"));
  await chmod(directory, 0o700);
  const input = join(directory, "backup.json");
  const output = join(directory, "restored.sqlite");
  const backup = {
    exportedAt: "2026-07-14T00:00:00.000Z",
    schemaVersion: 3,
    data: {
      papers: [{ id: "W1", title: "Test paper", authors_json: "[]", publication_year: 2026, venue: "Test", doi: null, landing_page_url: null, pdf_url: null, topic: "Testing", created_at: "2026-07-14 00:00:00", arxiv_id: null, openreview_id: null, normalized_title: "test paper", metadata_updated_at: null, abstract: "", cited_by_count: 0 }],
      logs: [{ id: 1, paper_id: "W1", user_email: "reader@example.test", display_name: "Test Reader", rating: 5, status: "read", comment: "Useful", created_at: "2026-07-14 00:00:00", updated_at: "2026-07-14 00:00:00" }],
      profiles: [{ user_email: "reader@example.test", slug: "test-reader", display_name: "Test Reader", created_at: "2026-07-14 00:00:00", updated_at: "2026-07-14 00:00:00", bio: "", affiliation: "", interests_json: "[]" }],
      user: [{ id: "user-1", name: "Test Reader", email: "reader@example.test", emailVerified: 1, image: null, createdAt: "2026-07-14T00:00:00.000Z", updatedAt: "2026-07-14T00:00:00.000Z" }],
      account: [{ id: "account-1", accountId: "external-1", providerId: "google", userId: "user-1", accessToken: null, refreshToken: null, idToken: null, accessTokenExpiresAt: null, refreshTokenExpiresAt: null, scope: null, password: null, createdAt: "2026-07-14T00:00:00.000Z", updatedAt: "2026-07-14T00:00:00.000Z" }],
      ...emptyTables,
    },
  };
  await writeFile(input, JSON.stringify(backup), { mode: 0o600 });

  const result = await restoreBackup(input, output);
  assert.equal(result.tableCounts.papers, 1);
  assert.equal(result.tableCounts.logs, 1);
  assert.equal(result.tableCounts.account, 1);
  assert.equal((await stat(output)).mode & 0o777, 0o600);

  const database = new DatabaseSync(output, { readOnly: true });
  assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
  assert.equal(database.prepare("SELECT comment FROM logs WHERE id = 1").get().comment, "Useful");
  database.close();

  const source = await readFile(input, "utf8");
  assert.doesNotMatch(source, /paperlog\.net/);
});
