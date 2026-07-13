# Paperlog authentication handoff — 2026-07-13

This document records the Google and GitHub authentication work completed on 13 July 2026. It intentionally contains no OAuth client secrets, session tokens, provider tokens, passwords, or private user data.

## Current status

- The authentication implementation is complete locally and is pushed to the public GitHub repository on `main`.
- Implementation commit: `77076006f233d6cb7aebe87506f0a0e73fe3c50f` (`Add Google and GitHub authentication`).
- The Google/GitHub code has **not** been deployed to the public website. The currently live Paperlog version remains unchanged.
- The GitHub OAuth application form was prepared but not submitted. No GitHub client ID or secret was created.
- The Google Cloud project form was prepared but not submitted. No Google project, OAuth client ID, or secret was created.
- Creating persistent provider credentials and publishing a public Sites deployment require explicit operator confirmation.

## What was implemented

- A unified `/signin` page that can offer Google, GitHub, and Sites-managed ChatGPT sign-in.
- The original managed ChatGPT paths remain intact:
  - `/signin-with-chatgpt`
  - `/signout-with-chatgpt`
  - `/callback`
- App-owned Google and GitHub OAuth routes are handled below `/api/auth/*`.
- Provider buttons are configuration-aware. If a Google or GitHub credential pair is absent, that provider is hidden and ChatGPT sign-in continues to work.
- External sessions are checked before the managed ChatGPT identity headers, allowing the three identity paths to coexist.
- Same-email accounts may be linked only when the provider supplies a verified matching email. Different-email implicit linking is disabled.
- OAuth tokens are encrypted by the authentication layer.
- App-owned sessions expire after seven days and refresh through normal use.
- Sign-in return paths are restricted to safe same-origin relative paths.
- Google and GitHub sign-out is handled by Paperlog; ChatGPT sign-out continues through the reserved Sites route.

## Provider callbacks

Register these exact production callback URLs:

- Google: `https://paperlog.net/api/auth/callback/google`
- GitHub: `https://paperlog.net/api/auth/callback/github`

The GitHub provider requests `read:user` and `user:email` so Paperlog can obtain a verified account email when GitHub does not expose it publicly.

## Database changes

The existing D1 database now has schema definitions and runtime initialization for the authentication tables:

- `user` — app-owned external identity
- `account` — linked Google/GitHub provider record and encrypted token fields
- `session` — app-owned sign-in session
- `verification` — short-lived verification and OAuth state records

Relevant sources:

- `db/schema.ts`
- `db/index.ts`
- `drizzle/0005_solid_nekra.sql`
- `drizzle/meta/0005_snapshot.json`

Runtime schema initialization uses `CREATE TABLE IF NOT EXISTS`, so the new tables are created safely when the new version first handles a database-backed request. The generated Drizzle migration records the same schema for future managed migrations.

## Data rights and privacy controls

Account export now includes the external-authentication identity, linked-provider metadata, and non-secret session metadata. It deliberately excludes:

- OAuth access tokens
- OAuth refresh tokens
- OAuth ID tokens
- session tokens
- passwords

Self-service account deletion now removes the app-owned authentication user, linked accounts, sessions, matching verification records, and all previously covered Paperlog activity. It does not delete the reader's Google, GitHub, or ChatGPT account.

The following records were updated to match the implementation:

- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `docs/DATA_RIGHTS_AUDIT.md`
- `.env.example`
- `README.md`

## Hosting configuration already prepared

The protected OpenAI Sites environment contains:

- `BETTER_AUTH_SECRET` as a secret value
- `BETTER_AUTH_URL=https://paperlog.net`

The secret value is not present in Git, local documentation, command output, or this handoff record. Adding those variables did not deploy a new site version.

The following provider variables are still absent and must be created after the provider apps exist:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

All client secrets must be stored as protected Sites secrets and must never be committed to Git.

## Verification completed

The implementation passed:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`, including a production build and three application tests
- `git diff --check`
- local rendering of the unified sign-in page with all three providers enabled through dummy local credentials
- a local Google OAuth start request returning HTTP 200, the correct callback path, a short-lived state cookie, and PKCE parameters

The initially tested authentication package version was rejected after an audit found published OAuth and account-linking advisories. The project was upgraded to patched `better-auth` 1.6.23 before commit. The final `npm audit --omit=dev` result contained seven moderate transitive findings and no high or critical finding. The forced suggestions would install incompatible or obsolete versions and were not applied.

## Files added for authentication

- `app/api/auth/[...all]/route.ts`
- `app/components/SocialSignInButtons.tsx`
- `app/signin/page.tsx`
- `app/signout/route.ts`
- `lib/auth.ts`
- `lib/auth-client.ts`
- `drizzle/0005_solid_nekra.sql`

Additional existing files were updated for identity integration, local environment simulation, account controls, policies, tests, and documentation.

## Safe continuation checklist

Do not deploy until all of the following steps are complete:

1. Obtain explicit operator confirmation to create persistent OAuth credentials and publish a public version.
2. Submit the prepared GitHub OAuth application for Paperlog.
3. Create a dedicated Google Cloud project for Paperlog; do not reuse an unrelated project.
4. Configure the Google OAuth consent screen with the Paperlog name, `paperlog.net`, the privacy URL, the terms URL, and the minimum identity scopes.
5. Create a Google web OAuth client with the exact callback listed above.
6. Store all four provider values in the protected Sites environment; mark the two client secrets as secret.
7. Confirm the source commit to deploy and create a saved Sites version from that exact pushed state.
8. Obtain public-deployment approval and deploy the saved version.
9. Test Google, GitHub, and ChatGPT sign-in separately on `https://paperlog.net`.
10. With a disposable non-admin account, verify rating persistence across sign-in, sign-out, export, and permanent deletion.
11. Confirm that an unconfigured or temporarily unavailable external provider does not break ChatGPT sign-in or public reading.

## Rollback and recovery

- Git commit `7707600` is the exact implementation source state.
- The live site has not yet moved to this commit, so no production rollback is currently required.
- If a future deployment fails, redeploy the last verified Sites version before changing DNS or the D1 database.
- Removing one provider's client ID and secret hides that provider without removing ChatGPT sign-in.
- Do not delete the existing D1 database or the Sites project while testing authentication.

## Sources of truth

- Authentication implementation: `lib/auth.ts`, `lib/auth-client.ts`, and `app/chatgpt-auth.ts`
- Auth HTTP routes: `app/api/auth/[...all]/route.ts`, `app/signin/page.tsx`, and `app/signout/route.ts`
- Database model: `db/schema.ts`, `db/index.ts`, and `drizzle/0005_solid_nekra.sql`
- Environment variable names and callbacks: `.env.example`
- Data-rights behavior: `app/api/account/route.ts` and `docs/DATA_RIGHTS_AUDIT.md`
- Protected values: the Sites environment only, never the repository

