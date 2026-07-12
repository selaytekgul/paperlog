import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";

export function PolicyPage({ title, updated = "12 July 2026", children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="paper-page">
      <header className="topbar"><a className="brand" href="/"><span className="brand-mark" /><span className="brand-name">Paperlog</span></a><div /><div className="top-actions"><a className="nav-link" href="/">Discover</a><a className="pill-button secondary" href="/contact">Contact</a></div></header>
      <main className="policy-page"><a href="/" className="back-link">← Back to Paperlog</a><p className="eyebrow">Limited alpha policy</p><h1>{title}</h1><p className="policy-updated">Last updated {updated}</p><div className="policy-content">{children}</div></main>
      <SiteFooter />
    </div>
  );
}
