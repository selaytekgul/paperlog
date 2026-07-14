# Paperlog continuation plan

This roadmap is ordered by risk and learning value. Do not add large speculative features before observing the first testers.

## P0 — before and during the first friend test

- [x] Open `https://paperlog.net` in a signed-out browser and confirm public pages load.
- [ ] Confirm sign-in, profile creation, rating, comment, edit, delete, and sign-out with a non-admin test account.
- [x] Confirm the uncommon-paper path by searching for “GravoTet: A fast multigrid hierarchy construction for tetrahedral meshes”. The browser fallback returned the exact paper on 2026-07-12.
- [x] Confirm `/api/health` succeeds.
- [x] Produce a private `/api/admin/export` backup and store it outside the repository. First verified export: 2026-07-14.
- [x] Add `OPENALEX_API_KEY` to the protected hosting environment. Verified with the live GravoTet search on 2026-07-14.
- [ ] Invite one adult friend first, using `docs/FRIEND_TEST_GUIDE.md`.
- [ ] Resolve any blocking error before inviting the remaining four testers.
- [ ] Record feedback as reproducible observations: page, action, expected result, actual result, device/browser, and screenshot when useful.

Exit criterion: one friend can find a paper and publish or edit a reader note without operator assistance.

## P1 — stabilize the alpha

- [ ] Add automated route-level tests for search, import, ratings, comments, profiles, reports, and account deletion.
- [x] Add a repeatable database backup procedure and perform an isolated restore drill.
- [x] Add security headers: CSP, HSTS, `X-Content-Type-Options`, referrer policy, permissions policy, and frame restrictions.
- [x] Add explicit same-origin validation to state-changing routes while preserving OAuth callbacks.
- [ ] Replace user-controlled rate-limit keys with identity- and network-aware controls.
- [ ] Update dependencies and resolve the moderate nested PostCSS audit findings.
- [ ] Add structured server error logging without recording comment contents or unnecessary personal information.
- [x] Add scheduled uptime checks for the homepage, `/api/health`, and an OpenAlex-backed search.
- [ ] Review the privacy, terms, moderation, copyright, and data-retention language with qualified local advice before wider promotion.

Exit criterion: five testers complete the script, backups are restorable, and no unresolved high-severity privacy, security, or data-loss issue remains.

## P2 — improve the core product from evidence

- [ ] Improve search ranking and exact-title handling based on failed tester searches.
- [ ] Add duplicate and version reconciliation for DOI, arXiv, OpenReview, and OpenAlex records.
- [ ] Clarify the difference between star rating, reader note, formal peer review, and reproducibility experience in the interface.
- [ ] Improve feed ranking only after enough real activity exists; never fabricate counts or activity.
- [ ] Add moderation queues, status history, and operator notes as volume requires.
- [ ] Add accessibility testing with keyboard navigation, screen readers, zoom, and reduced motion.
- [ ] Measure only privacy-respecting product signals needed to answer MVP questions.

Exit criterion: observed behavior supports expanding beyond the initial research communities.

## P3 — hosting resilience experiment

- [ ] Create a free Cloudflare Workers staging project and a separate D1 database.
- [ ] Add a standard `wrangler` deployment configuration without changing the current Sites configuration.
- [ ] Replace Sites-specific ChatGPT identity with Cloudflare Access for a private staging alpha, including signed token validation.
- [ ] Import a production export into staging and run the complete acceptance test.
- [ ] Measure Worker CPU time, request count, D1 rows read/written, and bundle size against free-tier limits.
- [ ] Add GitHub-based deployment automation for staging.
- [ ] Test `beta.paperlog.net` before planning an apex-domain cutover.
- [ ] Decide whether public Paperlog should use Auth.js, Supabase Auth, or another mature identity provider instead of private Access gating.

Exit criterion: the replacement runs for at least one test cycle, data restore is proven, limits are understood, and rollback is documented.

## P4 — later product possibilities

- Multi-dimensional scientific assessments only when communities agree on meaningful dimensions.
- Stronger reproducibility verification linked to repositories, commits, datasets, and environments.
- Curated reading lists, journal clubs, collection collaboration, and recommendation tools.
- Author responses with stronger identity verification.
- Institution and research-group pages.
- Sustainable moderation and operating model before large-scale growth.

## Explicit non-goals for the present MVP

- Hosting or redistributing publisher PDFs.
- Pretending reader ratings are formal peer review.
- AI-generated paper summaries presented without provenance or verification.
- Payments, advertising, or sensitive personal-data collection.
- Building a native mobile application before the web product is validated.
