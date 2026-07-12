import type { Metadata } from "next";
import { getChatGPTUser } from "../chatgpt-auth";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Join the Paperlog alpha",
  description: "Help test Paperlog by finding, rating, and discussing research papers.",
  alternates: { canonical: "/alpha" },
};

export default async function AlphaPage() {
  const user = await getChatGPTUser();
  return <div className="site-shell"><SiteHeader user={user} /><main className="policy-page"><p className="eyebrow">Five-person alpha</p><h1>Help shape Paperlog.</h1><p className="policy-updated">A focused 15-minute test is more useful than general feedback.</p><div className="policy-content alpha-content"><h2>Try these six things</h2><ol><li>Find a paper by title, DOI, arXiv ID, or OpenReview URL.</li><li>Give it a star rating and a short, honest reader note.</li><li>Reply to another note or mark it helpful.</li><li>Save a paper, make a public list, and add the paper to it.</li><li>If you ran code, publish a structured reproducibility report.</li><li>Check your profile and notifications on both phone and desktop.</li></ol><h2>What to notice</h2><p>Where did you hesitate? What wording felt academic or intimidating? What would make you return next week? Screenshots and the exact paper URL are especially helpful.</p><div className="alpha-callout"><strong>Please do not enter confidential peer-review material.</strong><p>Use only comments and links you are permitted to share publicly. Paperlog is an independent alpha, not a venue’s official review system.</p></div><a className="pill-button" href="/contact">Send alpha feedback</a><h2>Operator checklist</h2><ul><li>Invite five people from different roles or seniority levels.</li><li>Ask each person to use a different paper and one overlapping paper.</li><li>Review reports, metadata corrections, and contact requests in the admin console.</li><li>Export a JSON backup after the session.</li><li>Fix blocking problems before inviting the next group.</li></ul></div></main><SiteFooter /></div>;
}
