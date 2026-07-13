"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Paper } from "../../lib/types";
import { searchOpenAlexInBrowser } from "../../lib/openalex-browser";

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const form = useRef<HTMLFormElement | null>(null);
  const searchSequence = useRef(0);
  const panelId = compact ? "nav-paper-search-results" : "hero-paper-search-results";

  useEffect(() => {
    function closeWhenClickingElsewhere(event: PointerEvent) {
      if (form.current && !form.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeWhenClickingElsewhere);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingElsewhere);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function search(value: string) {
    setQuery(value);
    setOpen(Boolean(value.trim()));
    setNotice("");
    const sequence = ++searchSequence.current;
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        const payload = (await response.json()) as { papers?: Paper[]; source?: string; warning?: string; error?: string };
        let papers = payload.papers ?? [];
        if (payload.source === "paperlog" || payload.warning || payload.error) {
          try {
            const openAlexPapers = await searchOpenAlexInBrowser(value.trim());
            papers = [...openAlexPapers, ...papers.filter((local) => !openAlexPapers.some((remote) => remote.id === local.id))];
            if (sequence === searchSequence.current) setNotice("OpenAlex results loaded directly.");
          } catch (caught) {
            if (sequence === searchSequence.current) setNotice(caught instanceof Error ? `${caught.message} Showing Paperlog’s saved papers.` : "Showing Paperlog’s saved papers.");
          }
        }
        if (sequence === searchSequence.current) setResults(papers);
      } catch {
        try {
          const papers = await searchOpenAlexInBrowser(value.trim());
          if (sequence === searchSequence.current) { setResults(papers); setNotice("OpenAlex results loaded directly."); }
        } catch {
          if (sequence === searchSequence.current) { setResults([]); setNotice("Search is temporarily unavailable."); }
        }
      } finally { if (sequence === searchSequence.current) setLoading(false); }
    }, 280);
  }

  async function openPaper(paper: Paper) {
    try { await fetch("/api/papers/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: paper.id }) }); } catch { /* Navigation can still use OpenAlex's direct work lookup. */ }
    window.location.assign(`/paper/${paper.id}`);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (results[0]) void openPaper(results[0]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      (form.current?.querySelector("input") as HTMLInputElement | null)?.blur();
    }
  }

  return (
    <form ref={form} className={compact ? "nav-search" : "hero-search"} onSubmit={submit} onKeyDown={handleKeyDown} role="search">
      <label className="sr-only" htmlFor={compact ? "nav-paper-search" : "hero-paper-search"}>Search papers</label>
      <input
        id={compact ? "nav-paper-search" : "hero-paper-search"}
        value={query}
        onChange={(event) => search(event.target.value)}
        onFocus={() => query && setOpen(true)}
        placeholder={compact ? "Search papers" : "Search papers by title, author, DOI, or arXiv"}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={panelId}
      />
      {compact ? <span className="search-glyph" aria-hidden="true">⌕</span> : <button className="pill-button" type="submit">Search</button>}
      {open && (
        <div className="search-panel" id={panelId} role="listbox" aria-label="Paper search results">
          {loading && <div className="search-state">Searching the literature…</div>}
          {!loading && notice && <div className="search-notice" role="status">{notice}</div>}
          {!loading && results.length === 0 && <div className="search-state">Keep typing to search the research literature.</div>}
          {!loading && results.map((paper) => (
            <button className="search-result" type="button" role="option" aria-selected="false" key={paper.id} onClick={() => { void openPaper(paper); }}>
              <strong>{paper.title}</strong>
              <span>{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""} · {paper.year ?? "Unpublished"}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
