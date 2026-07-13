import type { Metadata } from "next";
import { ContactForm } from "../components/ContactForm";
import { PolicyPage } from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Paperlog about feedback, privacy, metadata, copyright, safety, or moderation.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <PolicyPage title="Contact Paperlog" updated="13 July 2026"><p>Use this form for alpha feedback, privacy requests, metadata corrections, copyright notices, safety reports, or moderation appeals.</p><p>For a privacy request, use the email connected to the relevant Paperlog account and explain the action you want. We will verify control of the account or email before disclosing, correcting, or deleting personal data. Signed-in readers can download or immediately delete their Paperlog account from the profile page.</p><ContactForm /></PolicyPage>;
}
