import type { Metadata } from "next";
import { PolicyPage } from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy and KVKK notice",
  description: "How Paperlog processes account, profile, rating, reader-note, and moderation data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <PolicyPage title="Privacy and KVKK notice" updated="13 July 2026">
    <p>Paperlog is an independent limited alpha operated from Türkiye. For this alpha, the Paperlog operator acts as data controller. Privacy requests can be submitted through the <a href="/contact">contact form</a>.</p>
    <h2>Information we process</h2><p>We process the email and display name supplied by managed sign-in, optional profile information, ratings, reader notes, replies, helpful votes, follows, saved papers and lists, code-experience reports, notifications, moderation reports, contact requests, timestamps, and security records needed to operate the service. Paper and author metadata comes from OpenAlex.</p>
    <h2>Why we process it</h2><p>We use this information to authenticate writers, publish attributed reader activity, maintain profiles and reading lists, prevent abuse, respond to requests, and secure Paperlog. The legal basis may include providing the requested service, legitimate interests in operating a safe alpha, legal obligations, and consent where specifically requested.</p>
    <h2>Visibility</h2><p>Your display name, optional profile fields, ratings, reader notes, replies, engagement labels, public lists, and code-experience reports are public. Your login email, private notifications, reports, and moderation records are not displayed. Do not include sensitive personal data in public content.</p>
    <h2>Processors and international transfers</h2><p>Paperlog uses managed hosting, authentication, and scholarly-metadata providers that may process data outside Türkiye. The operator will assess and maintain the transfer safeguards required by applicable law before a broad public launch.</p>
    <h2>Retention and account deletion</h2><p>Profile information and community activity remain while your Paperlog account is active. The authenticated account control immediately removes account-linked records from Paperlog’s live application database, including your profile, logs, saved papers, replies, helpful votes, follows, lists, reproducibility reports, metadata corrections, author claims, submitted reports, notifications, contact requests submitted with the same email, and application rate-limit records. Deletion does not delete your ChatGPT or identity-provider account. Hosting security logs and backup copies, if maintained by the infrastructure provider, may remain inaccessible to ordinary application users until the provider’s protected retention cycle expires. They must not be restored as active account data after a deletion.</p>
    <p>Application rate-limit records use a one-way hash of the account email and are automatically removed after 30 days or immediately with account deletion. Paper and author metadata is not removed because it comes from public scholarly sources and is not created as part of the reader account. Moderation audit entries that do not contain the deleted reader’s email may remain to document administrative actions.</p>
    <h2>Your rights and requests</h2><p>Signed-in readers can download their Paperlog-held account data or delete the account from their profile. You may also request access, correction, deletion, restriction, or information about processing through the contact form. We may need to verify that the requester controls the relevant account or email before disclosing or changing data. Requests will be answered as soon as practicable and no later than the applicable legal period.</p>
    <h2>Security and children</h2><p>Paperlog uses access controls and limited data collection, but no internet service is risk-free. This alpha is intended only for users aged 18 or older.</p>
  </PolicyPage>;
}
