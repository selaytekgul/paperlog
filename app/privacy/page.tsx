import type { Metadata } from "next";
import { PolicyPage } from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy and KVKK notice",
  description: "How Paperlog processes account, profile, rating, reader-note, and moderation data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <PolicyPage title="Privacy and KVKK notice">
    <p>Paperlog is an independent limited alpha operated from Türkiye. For this alpha, the Paperlog operator acts as data controller. Privacy requests can be submitted through the <a href="/contact">contact form</a>.</p>
    <h2>Information we process</h2><p>We process the email and display name supplied by managed sign-in, optional profile information, ratings, reader notes, replies, helpful votes, follows, saved papers and lists, code-experience reports, notifications, moderation reports, contact requests, timestamps, and security records needed to operate the service. Paper and author metadata comes from OpenAlex.</p>
    <h2>Why we process it</h2><p>We use this information to authenticate writers, publish attributed reader activity, maintain profiles and reading lists, prevent abuse, respond to requests, and secure Paperlog. The legal basis may include providing the requested service, legitimate interests in operating a safe alpha, legal obligations, and consent where specifically requested.</p>
    <h2>Visibility</h2><p>Your display name, optional profile fields, ratings, reader notes, replies, engagement labels, public lists, and code-experience reports are public. Your login email, private notifications, reports, and moderation records are not displayed. Do not include sensitive personal data in public content.</p>
    <h2>Processors and international transfers</h2><p>Paperlog uses managed hosting, authentication, and scholarly-metadata providers that may process data outside Türkiye. The operator will assess and maintain the transfer safeguards required by applicable law before a broad public launch.</p>
    <h2>Retention and rights</h2><p>Logs and saved papers remain until you delete them or request account deletion. Security, moderation, and legal records may be retained for a limited period when necessary. You may request access, correction, deletion, restriction, or information about processing through the contact form. Requests will be handled as soon as practicable and within applicable statutory periods.</p>
    <h2>Security and children</h2><p>Paperlog uses access controls and limited data collection, but no internet service is risk-free. This alpha is intended only for users aged 18 or older.</p>
  </PolicyPage>;
}
