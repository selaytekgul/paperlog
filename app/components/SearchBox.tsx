"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Paper } from "../../lib/types";

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function search(value: string) {
    setQuery(value);
    setOpen(Boolean(value.trim()));
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        const payload = (await response.json()) as { papers?: Paper[] };
        setResults(payload.papers ?? []);
      } finally { setLoading(false); }
    }, 280);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (results[0]) window.location.href = `/paper/${results[0].id}`;
  }

  return (
    <form className={compact ? "nav-search" : "hero-search"} onSubmit={submit} role="search">
      <label className="sr-only" htmlFor={compact ? "nav-paper-search" : "hero-paper-search"}>Search papers</label>
      <input
        id={compact ? "nav-paper-search" : "hero-paper-search"}
        value={query}
        onChange={(event) => search(event.target.value)}
        onFocus={() => query && setOpen(true)}
        placeholder={compact ? "Title, DOI, arXiv or OpenReview" : "Search a title, author, topic, DOI, arXiv ID, or OpenReview URL"}
        autoComplete="off"
      />
      {compact ? <span className="search-glyph" aria-hidden="true">⌕</span> : <button className="pill-button" type="submit">Find paper</button>}
      {open && (
        <div className="search-panel">
          {loading && <div className="search-state">Searching the literature…</div>}
          {!loading && results.length === 0 && <div className="search-state">Search OpenAlex by title, author, DOI, arXiv ID, or OpenReview URL.</div>}
          {!loading && results.map((paper) => (
            <button className="search-result" type="button" key={paper.id} onClick={() => { window.location.href = `/paper/${paper.id}`; }}>
              <strong>{paper.title}</strong>
              <span>{paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""} · {paper.year ?? "Unpublished"}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
