import type { Metadata } from "next";
import { PolicyPage } from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Community guidelines",
  description: "Guidelines for constructive, evidence-aware discussion of research papers on Paperlog.",
  alternates: { canonical: "/guidelines" },
};

export default function GuidelinesPage() {
  return <PolicyPage title="Community guidelines">
    <p>Paperlog welcomes short, unfinished, personal, and technically detailed reactions. You do not need to be an academic to say what a paper meant to you.</p>
    <h2>Critique the work, not the person</h2><p>Discuss claims, evidence, methods, writing, code, limitations, and your own understanding. Do not insult, threaten, shame, or speculate about an author’s character, motives, identity, or private life.</p>
    <h2>Describe your evidence</h2><p>Distinguish a first impression from a close read or code experience. Reproducibility claims should identify what was attempted and avoid treating a local failure as proof of misconduct.</p>
    <h2>Serious allegations</h2><p>Claims of fabrication, plagiarism, fraud, or other misconduct require specific verifiable evidence and may be held for moderation. When appropriate, link to established correction, retraction, or institutional processes.</p>
    <h2>Keep it yours</h2><p>Use your own words. Short quotations with attribution may be acceptable; do not paste full abstracts, substantial paper passages, figures, tables, source code, or paywalled PDFs without authorization.</p>
    <h2>Report problems</h2><p>Use the Report control on a reader log or the contact form for privacy, copyright, safety, and metadata issues. Reports must be made in good faith.</p>
  </PolicyPage>;
}
