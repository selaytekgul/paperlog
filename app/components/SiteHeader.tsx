import type { ChatGPTUser } from "../chatgpt-auth";
import { chatGPTSignInPath } from "../chatgpt-auth";
import { SearchBox } from "./SearchBox";
import { NotificationsMenu } from "./NotificationsMenu";

export function SiteHeader({ user }: { user: ChatGPTUser | null }) {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="Paperlog home">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Paperlog</span>
      </a>
      <SearchBox compact />
      <nav className="top-actions" aria-label="Primary navigation">
        <a className="nav-link" href="/explore">Browse papers</a>
        {user ? (
          <><NotificationsMenu /><a className="pill-button secondary" href="/profile">{user.displayName.split(" ")[0]}</a></>
        ) : (
          <a className="pill-button" href={chatGPTSignInPath("/")}>Sign in</a>
        )}
      </nav>
    </header>
  );
}
