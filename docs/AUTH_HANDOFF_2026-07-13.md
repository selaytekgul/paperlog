# Paperlog authentication handoff — 2026-07-13

This document records the Google and GitHub authentication work completed on 13 July 2026. It intentionally contains no OAuth client secrets, session tokens, provider tokens, passwords, or private user data.

## Current status

- The authentication implementation is complete, deployed publicly, and pushed to the public GitHub repository on `main`.
- Implementation commit: `77076006f233d6cb7aebe87506f0a0e73fe3c50f` (`Add Google and GitHub authentication`).
- Deployed source commit: `6e25cecc0b7744b58e25606d6cfc2b59010af852`.
- OpenAI Sites version: `15` (`appgprj_6a53a3fd6938819181f36e66f7b5e0e6~appgver_2179774e7758819195fc7982f45b7e1a`).
- Public deployment: `appgdep_6a54c3e9b3408191bf0c1a13e1e105e7`, using protected environment revision `3`.
- The canonical site is live at `https://paperlog.net`; the Sites address is `https://paperlog.selorey.chatgpt.site`.
- A dedicated Google Cloud project (`paperlog-502309`) and GitHub OAuth app (`3725675`) were created for Paperlog.
- Google OAuth publishing status is **In production** for an external audience.

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

## Hosting configuration

The protected OpenAI Sites environment contains:

- `BETTER_AUTH_SECRET` as a secret value
- `BETTER_AUTH_URL=https://paperlog.net`
- `GOOGLE_CLIENT_ID` as an environment variable
- `GOOGLE_CLIENT_SECRET` as a protected secret
- `GITHUB_CLIENT_ID` as an environment variable
- `GITHUB_CLIENT_SECRET` as a protected secret

The secret values are not present in Git, local documentation, or this handoff record. Provider credentials were transferred through a temporary permission-restricted file, stored in Sites, and removed locally immediately afterward. All client secrets must remain protected Sites secrets and must never be committed to Git.

The provider configuration uses these public URLs:

- Homepage: `https://paperlog.net`
- Privacy policy: `https://paperlog.net/privacy`
- Terms: `https://paperlog.net/terms`
- Authorized domain: `paperlog.net`

Google currently indicates that the branding itself can optionally be submitted for verification. This is separate from the production OAuth publishing status and does not block the tested basic profile/email sign-in flow.

## Verification completed

The implementation passed:

- `npx tsc --noEmit`
- `npm run lint`
- `npm test`, including a production build and three application tests
- `git diff --check`
- local rendering of the unified sign-in page with all three providers enabled through dummy local credentials
- a local Google OAuth start request returning HTTP 200, the correct callback path, a short-lived state cookie, and PKCE parameters
- live `/signin` rendering with Google, GitHub, and ChatGPT options
- live `/api/health` returning HTTP 200 with the database connected
- live Google and GitHub OAuth-start requests using the exact production callbacks and PKCE S256
- live ChatGPT sign-in routing to the managed OpenAI authorization service
- end-to-end Google sign-in, sign-out, GitHub sign-in, and sign-out on `paperlog.net`
- verified same-email linking: Google and GitHub returned to the same Paperlog profile instead of creating duplicate user profiles

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

## Remaining safe continuation checklist

1. With a disposable non-admin account, verify rating persistence across sign-in and sign-out, then test account export and permanent deletion. Do not use the owner's real account because deletion also removes its Paperlog activity.
2. Confirm periodically that Google, GitHub, and ChatGPT sign-in still work after provider or platform changes.
3. Monitor Sites and authentication errors without logging tokens, secrets, or full authorization URLs.
4. Decide later whether to submit Google branding verification. The current basic profile/email production sign-in is already working.
5. Before moving away from Sites, export or migrate the database and reproduce all protected environment variables in the new host without placing secrets in Git.

## Rollback and recovery

- Git commit `7707600` is the exact implementation change; deployed source commit `6e25cec` includes that change plus its initial handoff documentation.
- Sites version `15` is the verified Google/GitHub production release.
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
