# Paperlog MVP plan

> Status: the public MVP is deployed at `paperlog.net` and is ready for a controlled friend alpha as of 2026-07-12. The next work should be driven by observed tester behavior rather than additional speculative features.

## Product promise

Paperlog is a social reading diary for research papers: find a paper, rate it, and leave the thought you wish someone had shared with you.

## MVP outcome

A visitor can search the scholarly literature through OpenAlex, open a paper profile, see community perspectives, sign in, and publish one contextualized rating or reader note. Their public profile becomes the beginning of a research-reading diary.

## Delivery stages

1. Foundation: initialize the web application, brand system, deployment configuration, and database binding.
2. Discovery: add live OpenAlex search and on-demand paper profiles.
3. Community: add 1–5 star ratings, reader notes, engagement context, and public paper logs.
4. Identity: use managed sign-in for attributed writing and a minimal reader profile.
5. Trust: validate input, rate-limit later, expose reporting/moderation before a wider public launch.
6. Alpha: begin with five invited adult readers from computer graphics, geometry processing, and adjacent fields; expand only after the first feedback cycle.

## Implemented beyond the initial MVP

- Structured code and reproducibility experience reports
- Public lists, follows, helpful votes, replies, and notifications
- Metadata corrections and author-claim review
- Reports, moderation, account export/deletion, and an admin console
- Resilient OpenAlex search with a small local paper cache

## Still postponed

- Multiple scientific-quality rating dimensions
- Automated paper-version merging and full editorial workflows
- Native mobile applications
- AI summaries and recommendation algorithms
- PDF hosting, private messages, and journal-club tools

## MVP success signals

- A new visitor finds the intended paper without manual entry.
- A signed-in reader publishes a rating or note in under one minute.
- Readers return to log a second paper.
- Paper pages gain perspectives from more than one person.
- Informal notes feel welcome without being confused with formal peer review.

## Five-person alpha checklist

- [x] Remove fictional activity and fabricated rating counts.
- [x] Persist real ratings, reader notes, profiles, and Want to read entries.
- [x] Allow users to edit/delete logs, export data, and delete accounts.
- [x] Add reports, moderation records, contact requests, and rate limits.
- [x] Publish alpha privacy, terms, community, and copyright notices.
- [x] Keep public reading separate from authenticated writing.
- [x] Point `paperlog.net` and `www.paperlog.net` to the published site.
- [x] Repair the overlapping search-results presentation.
- [ ] Add a free OpenAlex API key to the hosted environment.
- [ ] Invite five adult testers and collect structured feedback.

## Tester script

Each tester should find five papers, save one for later, rate two, leave one reader note, edit that note, open another reader profile, submit one test report, and send one feedback request. The operator should resolve the test report and contact request in `/admin`.
