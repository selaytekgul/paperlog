import type { ChatGPTUser } from "../chatgpt-auth";
import { SearchBox } from "./SearchBox";
import { SiteHeader } from "./SiteHeader";
import { RecentActivity } from "./RecentActivity";
import { SiteFooter } from "./SiteFooter";
import { FeaturedPapers } from "./FeaturedPapers";

const featured = [
  { id: "W2626778328", topic: "Machine learning", year: 2017, title: "Attention Is All You Need", authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar et al." },
  { id: "W1626653188", topic: "Geometry", year: 2003, title: "Discrete Differential-Geometry Operators for Triangulated 2-Manifolds", authors: "Mark Meyer, Mathieu Desbrun, Peter Schröder et al." },
  { id: "W2235901111", topic: "Computer graphics", year: 1997, title: "Surface Simplification Using Quadric Error Metrics", authors: "Michael Garland and Paul S. Heckbert" },
  { id: "W2194775991", topic: "Computer vision", year: 2016, title: "Deep Residual Learning for Image Recognition", authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren et al." },
];

export function HomeExperience({ user }: { user: ChatGPTUser | null }) {
  return (
    <div className="site-shell">
      <SiteHeader user={user} />
      <main>
        <section className="home-hero">
          <div className="eyebrow">Your research reading log</div>
          <h1>Find a paper. Share what stayed with you.</h1>
          <p>Search published papers and preprints, rate what you read, and leave a short note. One honest sentence is enough.</p>
          <SearchBox />
          <div className="home-search-help"><span>Try a title, author, DOI, or arXiv ID.</span><span>Free to browse · Sign in only when you want to write.</span></div>
        </section>

        <section className="content-wrap home-content" id="discover">
          <div className="home-community-grid">
            <section className="home-panel">
              <div className="simple-section-head">
                <div><p className="section-kicker">From the community</p><h2>Latest reader notes</h2></div>
                <a href="/explore">Browse papers →</a>
              </div>
              <RecentActivity />
            </section>
            <aside className="home-panel starter-papers">
              <div className="simple-section-head">
                <div><p className="section-kicker">Not sure where to begin?</p><h2>Start with a familiar paper</h2></div>
              </div>
              <FeaturedPapers papers={featured} />
            </aside>
          </div>
          <div className="how-it-works">
            <div><span>1</span><strong>Find the paper</strong><p>Search by title, author, DOI, arXiv, or OpenReview.</p></div>
            <div><span>2</span><strong>Choose your reading status</strong><p>First impression, skimmed, read, studied, or ran the code.</p></div>
            <div><span>3</span><strong>Leave your take</strong><p>Add 1–5 stars and an optional note in your own words.</p></div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
