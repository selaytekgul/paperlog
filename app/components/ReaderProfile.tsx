import type { ProfilePaperEntry } from "../../lib/types";
import { SiteFooter } from "./SiteFooter";
import { AccountControls } from "./AccountControls";

function stars(rating: number | null | undefined) {
  return rating ? `${"★".repeat(rating)}${"☆".repeat(5 - rating)}` : "No rating";
}

export function ReaderProfile({ reader }: { reader: { displayName: string; slug: string; isOwner: boolean; logs: ProfilePaperEntry[]; saved: ProfilePaperEntry[] } }) {
  const initials = reader.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="paper-page">
      <header className="topbar"><a className="brand" href="/"><span className="brand-mark" /><span className="brand-name">Paperlog</span></a><div /><div className="top-actions"><a className="nav-link" href="/">Discover</a>{reader.isOwner && <a className="pill-button secondary" href="/signout-with-chatgpt?return_to=/">Sign out</a>}</div></header>
      <main className="content-wrap profile-wrap">
        <a href="/" className="back-link">← Back to discovery</a>
        <section className="profile-hero"><span className="avatar profile-avatar">{initials}</span><div><p className="section-kicker">Reader profile</p><h1 className="section-title">{reader.displayName}</h1><p className="profile-summary">{reader.logs.length} paper{reader.logs.length === 1 ? "" : "s"} logged · {reader.saved.length} saved for later</p></div></section>
        <div className="profile-columns">
          <section>
            <div className="section-head"><div><p className="section-kicker">Reading diary</p><h2 className="section-title small">Recent logs</h2></div></div>
            {reader.logs.length ? reader.logs.map(({ paper, log }) => (
              <a className="profile-entry" href={`/paper/${paper.id}`} key={String(log?.id)}>
                <div><span className="topic-chip">{paper.topic}</span><h3>{paper.title}</h3><p>{paper.authors.slice(0,3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}</p></div>
                <div className="profile-entry-rating"><span className="rating">{stars(log?.rating)}</span><span>{log?.status?.replace("-", " ")}</span></div>
                {log?.comment && <blockquote>“{log.comment}”</blockquote>}
              </a>
            )) : <div className="empty-state">No public logs yet.</div>}
          </section>
          <aside>
            <div className="sidebar-card"><h3>Want to read</h3>{reader.saved.length ? <ul className="saved-list">{reader.saved.map(({ paper }) => <li key={paper.id}><a href={`/paper/${paper.id}`}>{paper.title}</a></li>)}</ul> : <p>No saved papers yet.</p>}</div>
            {reader.isOwner && <div className="sidebar-card"><h3>Your Paperlog</h3><p>Your logs are public. Your login email is never displayed.</p><AccountControls /></div>}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
