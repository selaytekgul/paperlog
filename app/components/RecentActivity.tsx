"use client";

import { useEffect, useState } from "react";

type Activity = { id: number; displayName: string; rating: number | null; status: string; comment: string; createdAt: string; paperId: string; paperTitle: string; profileSlug: string | null };

export function RecentActivity() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { fetch("/api/activity?scope=community&sort=recent").then(async (response) => await response.json() as { activity?: Activity[] }).then((payload) => setActivity(payload.activity ?? [])).finally(() => setLoaded(true)); }, []);
  return <div className="activity-list">{!loaded ? <p className="empty-state compact">Loading reader notes…</p> : activity.length ? activity.slice(0, 4).map((item, index) => <article className="reader-note" key={item.id}><div className="note-user"><a className={`avatar ${index % 2 ? "green" : ""}`} href={item.profileSlug ? `/reader/${item.profileSlug}` : undefined}>{item.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0,2).toUpperCase()}</a><div><a className="user-name" href={item.profileSlug ? `/reader/${item.profileSlug}` : undefined}>{item.displayName}</a><div className="note-context">{item.status.replace("-", " ")}{item.rating ? ` · ${"★".repeat(item.rating)}` : ""}</div></div></div>{item.comment && <blockquote>“{item.comment}”</blockquote>}<div className="note-paper-line"><span>on</span> <a className="note-paper" href={`/paper/${item.paperId}`}>{item.paperTitle}</a></div></article>) : <div className="honest-empty"><strong>No reader notes yet.</strong><p>Find a paper and be the first to share what stayed with you.</p></div>}</div>;
}
