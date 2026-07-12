import type { ChatGPTUser } from "../chatgpt-auth";
import { SearchBox } from "./SearchBox";
import { SiteHeader } from "./SiteHeader";

const featured = [
  { id: "W2626778328", topic: "Machine learning", year: 2017, title: "Attention Is All You Need", authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar et al.", rating: "4.6", logs: 1842 },
  { id: "W1626653188", topic: "Geometry", year: 2003, title: "Discrete Differential-Geometry Operators for Triangulated 2-Manifolds", authors: "Mark Meyer, Mathieu Desbrun, Peter Schröder et al.", rating: "4.4", logs: 231 },
  { id: "W2235901111", topic: "Computer graphics", year: 1997, title: "Surface Simplification Using Quadric Error Metrics", authors: "Michael Garland and Paul S. Heckbert", rating: "4.7", logs: 406 },
  { id: "W2194775991", topic: "Computer vision", year: 2016, title: "Deep Residual Learning for Image Recognition", authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren et al.", rating: "4.5", logs: 1289 },
];

const notes = [
  { initials: "MK", name: "Mina K.", context: "Studied · ★★★★★", quote: "The rare foundational paper that still feels generous to the reader. Figure 2 did more for me than three survey papers.", paper: "Attention Is All You Need", color: "" },
  { initials: "DS", name: "Deniz S.", context: "Ran the code · ★★★★☆", quote: "The method holds up beautifully, but rebuilding the environment was half the experiment.", paper: "Neural 3D Mesh Renderer", color: "green" },
  { initials: "AR", name: "Ana R.", context: "First impression · ★★★☆☆", quote: "An exciting framing, though I am not yet convinced the evaluation supports the broadest claim.", paper: "Gaussian Splatting", color: "gold" },
];

export function HomeExperience({ user }: { user: ChatGPTUser | null }) {
  return (
    <div className="site-shell">
      <SiteHeader user={user} />
      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">A social reading diary for research</div>
            <h1>Every paper leaves an <em>impression.</em></h1>
            <p className="hero-copy">Find research papers, rate what you read, and leave the thought you wish someone had shared with you.</p>
            <SearchBox />
            <div className="hero-note">Searches scholarly works across disciplines through OpenAlex.</div>
          </div>
          <aside className="manifesto-card" aria-label="Paperlog philosophy">
            <p>“I did not reproduce the result. I did finally understand why the result mattered.”</p>
            <footer>That belongs in the literature, too.</footer>
          </aside>
        </section>

        <section className="content-wrap" id="discover">
          <div className="section-head">
            <div>
              <p className="section-kicker">From the community</p>
              <h2 className="section-title">Papers people keep returning to</h2>
            </div>
            <span className="section-kicker">Updated through reader activity</span>
          </div>
          <div className="main-grid">
            <div className="paper-grid">
              {featured.map((paper) => (
                <a href={`/paper/${paper.id}`} className="paper-card" key={paper.id}>
                  <div className="paper-meta"><span className="topic-chip">{paper.topic}</span><span>{paper.year}</span></div>
                  <h3 className="paper-title">{paper.title}</h3>
                  <p className="paper-authors">{paper.authors}</p>
                  <div className="paper-bottom">
                    <span className="rating">★★★★★ <small>{paper.rating}</small></span>
                    <span className="log-count">{paper.logs.toLocaleString()} logs</span>
                  </div>
                </a>
              ))}
            </div>
            <aside className="activity-column">
              <h3>Fresh from the margins</h3>
              <p className="activity-sub">Short notes from people who are reading.</p>
              {notes.map((note) => (
                <article className="reader-note" key={note.name}>
                  <div className="note-user">
                    <span className={`avatar ${note.color}`}>{note.initials}</span>
                    <div><div className="user-name">{note.name}</div><div className="note-context">{note.context}</div></div>
                  </div>
                  <blockquote>“{note.quote}”</blockquote>
                  <a className="note-paper" href="#discover">on {note.paper}</a>
                </article>
              ))}
            </aside>
          </div>
          <div className="value-strip">
            <div className="value-item"><strong>Log what you read</strong><p>A star rating and one honest sentence are enough. Your diary grows with your research life.</p></div>
            <div className="value-item"><strong>Learn from perspectives</strong><p>See what students, researchers, engineers, and curious readers took away from the same work.</p></div>
            <div className="value-item"><strong>Go deeper when ready</strong><p>Mark a first impression, a close read, or a code experience without pretending they are the same thing.</p></div>
          </div>
        </section>
      </main>
    </div>
  );
}
