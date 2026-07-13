import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { directChatGPTSignInPath, getChatGPTUser, safeRelativeReturnPath } from "../chatgpt-auth";
import { SocialSignInButtons } from "../components/SocialSignInButtons";
import { SiteFooter } from "../components/SiteFooter";
import { getSocialProviderAvailability } from "../../lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Paperlog to rate papers and share reader notes.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; error?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeRelativeReturnPath(params.return_to ?? "/");
  if (await getChatGPTUser()) redirect(returnTo);
  const providers = getSocialProviderAvailability();

  return (
    <div className="paper-page auth-page">
      <header className="topbar auth-topbar">
        <a className="brand" href="/" aria-label="Paperlog home"><span className="brand-mark" aria-hidden="true" /><span className="brand-name">Paperlog</span></a>
        <a className="nav-link" href={returnTo}>Back</a>
      </header>
      <main className="auth-wrap">
        <section className="auth-card">
          <p className="section-kicker">Your research reading diary</p>
          <h1>Sign in to Paperlog</h1>
          <p>Rate papers, publish reader notes, save reading lists, and keep your activity available across devices.</p>
          {params.error && <p className="auth-error" role="alert">That sign-in attempt did not finish. No Paperlog activity was changed.</p>}
          <SocialSignInButtons returnTo={returnTo} google={providers.google} github={providers.github} />
          {(providers.google || providers.github) && <div className="auth-divider"><span>or</span></div>}
          <a className="auth-provider-button chatgpt-auth-button" href={directChatGPTSignInPath(returnTo)}>
            <span className="provider-badge chatgpt-badge" aria-hidden="true">AI</span>
            Continue with ChatGPT
          </a>
          <p className="auth-legal">By continuing, you agree to the <a href="/terms">Terms</a> and acknowledge the <a href="/privacy">Privacy notice</a>. Paperlog never receives your provider password.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
