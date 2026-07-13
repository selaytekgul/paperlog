"use client";

import { useEffect, useState } from "react";

type Activity = { id: number; displayName: string; rating: number | null; status: string; comment: string; createdAt: string; paperId: string; paperTitle: string; profileSlug: string | null };

export function RecentActivity() {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [scope, setScope] = useState("community");
  const [sort, setSort] = useState("recent");
  useEffect(() => { fetch(`/api/activity?scope=${scope}&sort=${sort}`).then(async (response) => await response.json() as { activity?: Activity[] }).then((payload) => setActivity(payload.activity ?? [])).finally(() => setLoaded(true)); }, [scope, sort]);
  function chooseScope(next: string) { setLoaded(false); setScope(next); }
  function toggleSort() { setLoaded(false); setSort(sort === "helpful" ? "recent" : "helpful"); }
  return <aside className="activity-column"><h3>Fresh from the margins</h3><p className="activity-sub">Real notes from people who are reading.</p><div className="activity-filters"><button className={scope === "community" ? "active" : ""} onClick={() => chooseScope("community")}>Community</button><button className={scope === "following" ? "active" : ""} onClick={() => chooseScope("following")}>Following</button><button className={sort === "helpful" ? "active" : ""} onClick={toggleSort}>Helpful</button></div>{!loaded ? <p className="empty-state compact">Loading activity…</p> : activity.length ? activity.slice(0, 6).map((item, index) => <article className="reader-note" key={item.id}><div className="note-user"><a className={`avatar ${index % 2 ? "green" : ""}`} href={item.profileSlug ? `/reader/${item.profileSlug}` : undefined}>{item.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0,2).toUpperCase()}</a><div><a className="user-name" href={item.profileSlug ? `/reader/${item.profileSlug}` : undefined}>{item.displayName}</a><div className="note-context">{item.status.replace("-", " ")}{item.rating ? ` · ${"★".repeat(item.rating)}` : ""}</div></div></div>{item.comment && <blockquote>“{item.comment}”</blockquote>}<div className="note-paper-line"><span>on</span> <a className="note-paper" href={`/paper/${item.paperId}`}>{item.paperTitle}</a></div></article>) : <div className="honest-empty"><strong>No activity in this view yet.</strong><p>Follow a reader or add the first log.</p></div>}</aside>;
}
