import type { Metadata } from "next";
import { ContactForm } from "../components/ContactForm";
import { PolicyPage } from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Paperlog about feedback, privacy, metadata, copyright, safety, or moderation.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <PolicyPage title="Contact Paperlog"><p>Use this form for alpha feedback, privacy requests, metadata corrections, copyright notices, safety reports, or moderation appeals.</p><ContactForm /></PolicyPage>;
}
