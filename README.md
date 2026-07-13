# Paperlog

Paperlog is a social reading diary for research papers: find papers, rate them, leave fast reader notes, organize lists, discuss interpretations, and document code/reproducibility experiences.

Live MVP: [paperlog.net](https://paperlog.net)

## Project records

- [Current MVP and alpha plan](docs/MVP_PLAN.md)
- [Next-steps roadmap](docs/NEXT_STEPS.md)
- [Friend testing guide](docs/FRIEND_TEST_GUIDE.md)
- [2026-07-12 build and operations handoff](docs/HANDOFF_2026-07-12.md)
- [Data-rights implementation audit](docs/DATA_RIGHTS_AUDIT.md)

## Alpha capabilities

- OpenAlex paper search plus direct DOI, arXiv, OpenReview, and OpenAlex ID resolution
- live rating and log aggregates from the first real rating
- profiles with bios, affiliations, interests, follows, saved papers, and public lists
- reader logs with engagement status, helpful votes, replies, reports, and notifications
- structured reproducibility reports with repository, commit, environment, data, outcome, score, notes, and evidence
- manually verified paper-author responses
- metadata/version correction workflow
- private moderation console, audit trail, rate limits, health endpoint, and JSON backup export
- account export/deletion, alpha onboarding, legal pages, and responsive/accessibility treatment

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Project shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` defines the D1 persistence model
- `app/api/` contains public reads, authenticated writes, and admin operations
- `app/alpha` is the five-person test script
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

## External launch handoffs

The custom domain is connected and the MVP is publicly reachable. The application code cannot obtain the operator's private OpenAlex API key or replace formal legal review. Set `OPENALEX_API_KEY` in hosting for normal API capacity, keep exports of the production database, and have the policies reviewed before a broad public launch.
