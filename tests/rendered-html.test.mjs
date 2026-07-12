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
