"use client";

import { useState } from "react";
import { authClient } from "../../lib/auth-client";

type Provider = "google" | "github";

export function SocialSignInButtons({
  returnTo,
  google,
  github,
}: {
  returnTo: string;
  google: boolean;
  github: boolean;
}) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  async function signIn(provider: Provider) {
    setPending(provider);
    setError("");
    const result = await authClient.signIn.social({
      provider,
      callbackURL: returnTo,
      errorCallbackURL: `/signin?return_to=${encodeURIComponent(returnTo)}&error=oauth`,
    });
    if (result?.error) {
      setError("Sign-in could not be completed. Please try again.");
      setPending(null);
    }
  }

  if (!google && !github) return null;

  return (
    <div className="social-signin-buttons">
      {google && (
        <button className="auth-provider-button" disabled={pending !== null} onClick={() => signIn("google")}>
          <span className="provider-badge google-badge" aria-hidden="true">G</span>
          {pending === "google" ? "Connecting to Google…" : "Continue with Google"}
        </button>
      )}
      {github && (
        <button className="auth-provider-button" disabled={pending !== null} onClick={() => signIn("github")}>
          <span className="provider-badge github-badge" aria-hidden="true">GH</span>
          {pending === "github" ? "Connecting to GitHub…" : "Continue with GitHub"}
        </button>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
