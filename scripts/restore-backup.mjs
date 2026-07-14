#!/usr/bin/env node

import { access, chmod, mkdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import process from "node:process";

const expectedTables = [
  "papers", "logs", "profiles", "reading_entries", "reports", "contact_requests",
  "activity_events", "follows", "helpful_votes", "replies", "notifications",
  "paper_lists", "paper_list_items", "code_experiences", "metadata_corrections",
  "author_claims", "moderation_actions", "user", "session", "account", "verification",
];

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function applyMigrations(database) {
  const migrationDirectory = resolve(import.meta.dirname, "../drizzle");
  const migrationNames = [
    "0000_bored_george_stacy.sql",
    "0001_deep_amazoness.sql",
    "0002_nifty_gorgon.sql",
    "0003_tired_arclight.sql",
    "0004_known_blue_shield.sql",
    "0005_solid_nekra.sql",
  ];

  for (const migrationName of migrationNames) {
    const source = await readFile(resolve(migrationDirectory, migrationName), "utf8");
    const statements = source.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) database.exec(statement);
  }
}

function restoreRows(database, table, rows) {
  if (!Array.isArray(rows)) throw new Error(`Backup table ${table} is not an array`);
  if (!rows.length) return;

  const columns = database.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all().map((entry) => entry.name);
  const columnSet = new Set(columns);
  const rowColumns = Object.keys(rows[0]);
  if (!rowColumns.length || rowColumns.some((column) => !columnSet.has(column))) {
    throw new Error(`Backup table ${table} does not match the current schema`);
  }

  const statement = database.prepare(
    `INSERT INTO ${quoteIdentifier(table)} (${rowColumns.map(quoteIdentifier).join(", ")}) VALUES (${rowColumns.map(() => "?").join(", ")})`,
  );
  for (const row of rows) {
    const keys = Object.keys(row);
    if (keys.length !== rowColumns.length || keys.some((key, index) => key !== rowColumns[index])) {
      throw new Error(`Backup table ${table} contains inconsistent row columns`);
    }
    statement.run(...rowColumns.map((column) => row[column]));
  }
}

export async function restoreBackup(inputPath, outputPath, { overwrite = false } = {}) {
  const input = resolve(inputPath);
  const output = resolve(outputPath);
  if (input === output) throw new Error("Input and output paths must be different");

  const payload = JSON.parse(await readFile(input, "utf8"));
  if (payload.schemaVersion !== 3 || !payload.data || typeof payload.data !== "object") {
    throw new Error("Expected a Paperlog administrator backup with schemaVersion 3");
  }
  for (const table of expectedTables) {
    if (!Array.isArray(payload.data[table])) throw new Error(`Backup is missing table ${table}`);
  }
  const unknownTables = Object.keys(payload.data).filter((table) => !expectedTables.includes(table));
  if (unknownTables.length) throw new Error(`Backup contains unknown tables: ${unknownTables.join(", ")}`);

  await mkdir(dirname(output), { recursive: true, mode: 0o700 });
  if (overwrite) await rm(output, { force: true });
  else {
    try {
      await access(output);
      throw new Error(`Output already exists: ${output}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Output already exists:")) throw error;
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
    }
  }

  let database;
  let restored = false;
  try {
    database = new DatabaseSync(output, { open: true });
    database.exec("PRAGMA foreign_keys = OFF");
    await applyMigrations(database);
    database.exec("BEGIN IMMEDIATE");
    try {
      for (const table of expectedTables) restoreRows(database, table, payload.data[table]);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
    database.exec("PRAGMA foreign_keys = ON");

    const foreignKeyProblems = database.prepare("PRAGMA foreign_key_check").all();
    if (foreignKeyProblems.length) throw new Error(`Restore has ${foreignKeyProblems.length} foreign-key violations`);

    const tableCounts = Object.fromEntries(expectedTables.map((table) => {
      const restored = database.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`).get().count;
      const expected = payload.data[table].length;
      if (restored !== expected) throw new Error(`Restore count mismatch for ${table}: expected ${expected}, got ${restored}`);
      return [table, restored];
    }));

    await chmod(output, 0o600);
    restored = true;
    return { input, output, exportedAt: payload.exportedAt, schemaVersion: payload.schemaVersion, tableCounts };
  } finally {
    database?.close();
    if (!restored) await rm(output, { force: true });
  }
}

if (process.argv[1] && basename(process.argv[1]) === basename(import.meta.filename)) {
  const input = readArgument("--input");
  const output = readArgument("--output");
  const overwrite = process.argv.includes("--force");
  if (!input || !output) {
    console.error("Usage: npm run backup:restore -- --input <backup.json> --output <restored.sqlite> [--force]");
    process.exitCode = 2;
  } else {
    try {
      const result = await restoreBackup(input, output, { overwrite });
      console.log(JSON.stringify({ restored: true, output: result.output, exportedAt: result.exportedAt, schemaVersion: result.schemaVersion, tableCounts: result.tableCounts }, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
