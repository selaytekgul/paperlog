import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureDbSchema, getD1, hashActor, rateLimit } from "../../../db";

type Row = Record<string, unknown>;

async function rows(sql: string, ...bindings: unknown[]) {
  const statement = getD1().prepare(sql);
  const result = await (bindings.length ? statement.bind(...bindings) : statement).all<Row>();
  return result.results;
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to export your data" }, { status: 401 });
  await ensureDbSchema();
  const actorHash = await hashActor(user.email);
  const [profile, logs, savedPapers, replies, helpfulVotes, follows, notifications, lists, listItems, codeExperiences, metadataCorrections, authorClaims, reportsSubmitted, contactRequests, securityEvents, authUser, authAccounts, authSessions] = await Promise.all([
    rows("SELECT user_email AS userEmail, slug, display_name AS displayName, bio, affiliation, interests_json AS interests, created_at AS createdAt, updated_at AS updatedAt FROM profiles WHERE user_email = ?", user.email),
    rows("SELECT id, paper_id AS paperId, rating, status, comment, display_name AS displayName, created_at AS createdAt, updated_at AS updatedAt FROM logs WHERE user_email = ? ORDER BY updated_at DESC", user.email),
    rows("SELECT id, paper_id AS paperId, created_at AS createdAt FROM reading_entries WHERE user_email = ? ORDER BY created_at DESC", user.email),
    rows("SELECT id, log_id AS logId, paper_id AS paperId, display_name AS displayName, comment, author_response AS authorResponse, created_at AS createdAt, updated_at AS updatedAt FROM replies WHERE user_email = ? ORDER BY created_at DESC", user.email),
    rows("SELECT id, log_id AS logId, created_at AS createdAt FROM helpful_votes WHERE user_email = ? ORDER BY created_at DESC", user.email),
    rows(`SELECT f.id,
      CASE WHEN f.follower_email = ? THEN 'following' ELSE 'follower' END AS direction,
      p.slug AS otherProfileSlug, p.display_name AS otherDisplayName, f.created_at AS createdAt
      FROM follows f
      LEFT JOIN profiles p ON p.user_email = CASE WHEN f.follower_email = ? THEN f.following_email ELSE f.follower_email END
      WHERE f.follower_email = ? OR f.following_email = ? ORDER BY f.created_at DESC`, user.email, user.email, user.email, user.email),
    rows(`SELECT n.id, n.type, n.paper_id AS paperId, n.log_id AS logId, n.reply_id AS replyId,
      n.read_at AS readAt, n.created_at AS createdAt, p.slug AS actorProfileSlug, p.display_name AS actorDisplayName
      FROM notifications n LEFT JOIN profiles p ON p.user_email = n.actor_email
      WHERE n.user_email = ? ORDER BY n.created_at DESC`, user.email),
    rows("SELECT id, name, description, is_public AS isPublic, created_at AS createdAt, updated_at AS updatedAt FROM paper_lists WHERE user_email = ? ORDER BY updated_at DESC", user.email),
    rows("SELECT i.id, i.list_id AS listId, i.paper_id AS paperId, i.note, i.created_at AS createdAt FROM paper_list_items i INNER JOIN paper_lists l ON l.id = i.list_id WHERE l.user_email = ? ORDER BY i.created_at DESC", user.email),
    rows("SELECT id, paper_id AS paperId, display_name AS displayName, repository_url AS repositoryUrl, commit_ref AS commitRef, environment, dataset, outcome, reproducibility_rating AS reproducibilityRating, notes, artifact_url AS artifactUrl, created_at AS createdAt, updated_at AS updatedAt FROM code_experiences WHERE user_email = ? ORDER BY updated_at DESC", user.email),
    rows("SELECT id, paper_id AS paperId, field, suggested_value AS suggestedValue, evidence_url AS evidenceUrl, status, created_at AS createdAt FROM metadata_corrections WHERE reporter_email = ? ORDER BY created_at DESC", user.email),
    rows("SELECT id, paper_id AS paperId, evidence_url AS evidenceUrl, status, created_at AS createdAt, reviewed_at AS reviewedAt FROM author_claims WHERE user_email = ? ORDER BY created_at DESC", user.email),
    rows("SELECT id, log_id AS logId, reason, details, status, created_at AS createdAt FROM reports WHERE reporter_email = ? ORDER BY created_at DESC", user.email),
    rows("SELECT id, email, category, message, status, created_at AS createdAt FROM contact_requests WHERE lower(email) = lower(?) ORDER BY created_at DESC", user.email),
    rows("SELECT action, created_at AS createdAt FROM activity_events WHERE actor_hash = ? ORDER BY created_at DESC", actorHash),
    rows('SELECT id, name, email, emailVerified, image, createdAt, updatedAt FROM "user" WHERE lower(email) = lower(?)', user.email),
    rows('SELECT providerId, accountId, scope, createdAt, updatedAt FROM "account" WHERE userId IN (SELECT id FROM "user" WHERE lower(email) = lower(?)) ORDER BY createdAt DESC', user.email),
    rows('SELECT id, expiresAt, ipAddress, userAgent, createdAt, updatedAt FROM "session" WHERE userId IN (SELECT id FROM "user" WHERE lower(email) = lower(?)) ORDER BY createdAt DESC', user.email),
  ]);
  const data = {
    account: { email: user.email, managedDisplayName: user.displayName, authenticationPath: user.authProvider },
    externalAuthentication: {
      user: authUser[0] ?? null,
      linkedProviders: authAccounts,
      sessions: authSessions,
      note: "OAuth access tokens, refresh tokens, ID tokens, passwords, and session tokens are intentionally excluded.",
    },
    profile: profile[0] ?? null,
    logs,
    savedPapers,
    replies,
    helpfulVotes,
    follows,
    notifications,
    lists,
    listItems,
    codeExperiences,
    metadataCorrections,
    authorClaims,
    reportsSubmitted,
    contactRequests,
    securityEvents,
  };
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), schemaVersion: 4, data }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=paperlog-data.json", "Cache-Control": "no-store" },
  });
}

export async function DELETE(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to delete your account" }, { status: 401 });
  const payload = (await request.json()) as { confirmation?: string };
  if (payload.confirmation !== "DELETE") return Response.json({ error: "Confirmation is required" }, { status: 400 });
  if (!(await rateLimit(user.email, "delete-account", 2, 1440))) return Response.json({ error: "Account deletion was already requested recently." }, { status: 429 });
  await ensureDbSchema();
  const db = getD1();
  const actorHash = await hashActor(user.email);
  const results = await db.batch([
    db.prepare("DELETE FROM helpful_votes WHERE user_email = ? OR log_id IN (SELECT id FROM logs WHERE user_email = ?)").bind(user.email, user.email),
    db.prepare("DELETE FROM replies WHERE user_email = ? OR log_id IN (SELECT id FROM logs WHERE user_email = ?)").bind(user.email, user.email),
    db.prepare("DELETE FROM notifications WHERE user_email = ? OR actor_email = ?").bind(user.email, user.email),
    db.prepare("DELETE FROM follows WHERE follower_email = ? OR following_email = ?").bind(user.email, user.email),
    db.prepare("DELETE FROM paper_list_items WHERE list_id IN (SELECT id FROM paper_lists WHERE user_email = ?)").bind(user.email),
    db.prepare("DELETE FROM paper_lists WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM code_experiences WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM metadata_corrections WHERE reporter_email = ?").bind(user.email),
    db.prepare("DELETE FROM author_claims WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM reports WHERE log_id IN (SELECT id FROM logs WHERE user_email = ?)").bind(user.email),
    db.prepare("DELETE FROM reports WHERE reporter_email = ?").bind(user.email),
    db.prepare("DELETE FROM reading_entries WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM logs WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM profiles WHERE user_email = ?").bind(user.email),
    db.prepare("DELETE FROM contact_requests WHERE lower(email) = lower(?)").bind(user.email),
    db.prepare("DELETE FROM activity_events WHERE actor_hash = ?").bind(actorHash),
    db.prepare('DELETE FROM "session" WHERE userId IN (SELECT id FROM "user" WHERE lower(email) = lower(?))').bind(user.email),
    db.prepare('DELETE FROM "account" WHERE userId IN (SELECT id FROM "user" WHERE lower(email) = lower(?))').bind(user.email),
    db.prepare('DELETE FROM "verification" WHERE lower(identifier) = lower(?)').bind(user.email),
    db.prepare('DELETE FROM "user" WHERE lower(email) = lower(?)').bind(user.email),
  ]);
  const deletedRecords = results.reduce((total, result) => total + Number(result.meta?.changes ?? 0), 0);
  return Response.json({ deleted: true, deletedRecords, scope: "Paperlog live application database", identityProviderAccountDeleted: false }, { headers: { "Cache-Control": "no-store" } });
}
