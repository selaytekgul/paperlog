export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="brand footer-brand" href="/"><span className="brand-mark" aria-hidden="true" /><span className="brand-name">Paperlog</span></a>
      <p>Papers and what people think about them. Independent limited alpha.</p>
      <nav aria-label="Legal, support, and related projects"><a href="/explore">Explore</a><a href="https://paperpicture.net" target="_blank" rel="noreferrer">Paper Picture</a><a href="/alpha">Alpha</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/guidelines">Guidelines</a><a href="/copyright">Copyright</a><a href="/contact">Contact</a></nav>
      <small>Paper metadata supplied by <a href="https://openalex.org" target="_blank" rel="noreferrer">OpenAlex</a>.</small>
    </footer>
  );
}
