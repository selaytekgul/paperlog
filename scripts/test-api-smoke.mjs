#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import process from "node:process";

async function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : undefined;
      server.close((error) => error ? reject(error) : resolvePort(port));
    });
  });
}

async function waitForServer(url, child, logs) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Paperlog exited before the API test started.\n${logs.join("")}`);
    try {
      const response = await fetch(`${url}/api/health`);
      if (response.ok) return;
    } catch {
      // The Vite/Workers development server is still starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`Timed out waiting for Paperlog.\n${logs.join("")}`);
}

async function main() {
  const port = await availablePort();
  assert.ok(port, "Could not reserve a local test port");
  const origin = `http://127.0.0.1:${port}`;
  const executable = resolve("node_modules/.bin/vinext");
  const logs = [];
  const child = spawn(executable, ["dev", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const collect = (chunk) => {
    logs.push(chunk.toString());
    if (logs.join("").length > 20_000) logs.splice(0, logs.length - 10);
  };
  child.stdout.on("data", collect);
  child.stderr.on("data", collect);

  try {
    await waitForServer(origin, child, logs);

    const homepage = await fetch(origin);
    assert.equal(homepage.status, 200);
    assert.match(homepage.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
    assert.equal(homepage.headers.get("x-content-type-options"), "nosniff");
    assert.equal(homepage.headers.get("x-frame-options"), "DENY");

    const health = await fetch(`${origin}/api/health`).then(async (response) => {
      assert.equal(response.status, 200);
      return response.json();
    });
    assert.equal(health.status, "ok");
    assert.equal(health.database, "connected");

    const search = await fetch(`${origin}/api/search?q=${encodeURIComponent("Attention Is All You Need")}`).then(async (response) => {
      assert.equal(response.status, 200);
      return response.json();
    });
    assert.ok(Array.isArray(search.papers));

    const missingOrigin = await fetch(`${origin}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(missingOrigin.status, 403);
    assert.deepEqual(await missingOrigin.json(), { error: "Cross-site request rejected" });

    const sameOrigin = await fetch(`${origin}/api/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Origin: origin, "Sec-Fetch-Site": "same-origin" },
      body: "{}",
    });
    assert.equal(sameOrigin.status, 401);

    const accountExport = await fetch(`${origin}/api/account`);
    assert.equal(accountExport.status, 401);

    console.log("API smoke tests passed: homepage headers, database health, search, CSRF rejection, and auth boundaries.");
  } finally {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolveExit) => child.once("exit", resolveExit)),
      new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000)),
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
