# Paperlog data-rights implementation audit

Last verified: 13 July 2026

This record describes what the application actually does. It is an engineering control record, not a legal opinion.

## Self-service controls

- A signed-in reader can download a JSON export from the profile page.
- The export covers the profile, logs, saved papers, replies, helpful votes, follows, notifications, lists and list items, reproducibility reports, metadata corrections, author claims, submitted moderation reports, contact requests matching the account email, and hashed security-event history.
- Other readers’ private email addresses are excluded from the export. Social connections and notification actors are represented by public profile identity when available.
- A signed-in reader can permanently delete the Paperlog account after typing `DELETE`.
- Deletion removes account-linked rows from the live D1 application database, including records authored by the reader and dependent engagement on logs being removed.
- Deletion also removes contact requests matching the account email and the one-way-hashed application rate-limit records.
- The deletion control does not delete the user’s ChatGPT or other identity-provider account.

## Retention boundary

- Profile and community records remain until the reader deletes individual material or the account.
- Application rate-limit events are automatically purged after 30 days and are also removed during account deletion.
- Public paper and author metadata remains because it is imported from scholarly sources rather than created as reader-account data.
- Provider-side request logs and protected backups are outside the application database. The operator must obtain and record the provider’s retention/backup terms and ensure that a restore does not reactivate an account that was deleted after the backup was created.
- Administrative audit rows may remain when they contain only the administrator identity, action type, and a now-orphaned record identifier. They must not be used to reconstruct deleted reader data.

## Manual privacy requests

- The contact form accepts a `privacy` category.
- Before disclosing or changing data through a manual request, the operator must verify control of the relevant account or email.
- The operator must record the received date, verification, action, response date, and any lawful reason for retaining a limited record.
- A response must be provided within the applicable legal period. For KVKK data-subject applications, the operational deadline is no later than 30 days.

## Checks required before claiming full compliance

- Publish the data controller’s complete legal identity and a reliable electronic request address.
- Record the exact hosting/authentication subprocessors, countries, contracts, backup retention, and international-transfer mechanism.
- Have a Turkish privacy lawyer confirm the processing grounds, retention schedule, international-transfer safeguards, VERBIS position, and any Law No. 5651 duties.
- Test export and deletion with a disposable non-admin production account after every schema or authentication change.
