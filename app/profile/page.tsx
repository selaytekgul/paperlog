import { requireChatGPTUser, chatGPTSignOutPath } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireChatGPTUser("/profile");
  const initials = user.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="paper-page">
      <header className="topbar"><a className="brand" href="/"><span className="brand-mark" /><span className="brand-name">Paperlog</span></a><div /><div className="top-actions"><a className="pill-button secondary" href={chatGPTSignOutPath("/")}>Sign out</a></div></header>
      <main className="content-wrap">
        <a href="/" className="back-link">← Back to discovery</a>
        <section style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 45 }}><span className="avatar" style={{ width: 82, height: 82, fontSize: 24 }}>{initials}</span><div><p className="section-kicker">Reader profile</p><h1 className="section-title">{user.displayName}</h1><p className="section-kicker">Your research reading diary starts here.</p></div></section>
        <div className="sidebar-card"><h3>No public logs yet</h3><p>Search for a paper, leave a rating or note, and it will become part of your Paperlog.</p><a className="pill-button" style={{ display: "inline-block", marginTop: 10 }} href="/">Find your first paper</a></div>
      </main>
    </div>
  );
}
