import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";

type AuthEnvironment = {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};

const runtimeEnv = env as unknown as AuthEnvironment;

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

export function getSocialProviderAvailability() {
  const baseReady = configured(runtimeEnv.BETTER_AUTH_SECRET);
  return {
    google: baseReady && configured(runtimeEnv.GOOGLE_CLIENT_ID) && configured(runtimeEnv.GOOGLE_CLIENT_SECRET),
    github: baseReady && configured(runtimeEnv.GITHUB_CLIENT_ID) && configured(runtimeEnv.GITHUB_CLIENT_SECRET),
  };
}

function createConfiguredAuth() {
  const availability = getSocialProviderAvailability();
  const baseURL = runtimeEnv.BETTER_AUTH_URL?.trim() || "https://paperlog.net";
  const authOrigin = new URL(baseURL).origin;
  return betterAuth({
    database: runtimeEnv.DB,
    secret: runtimeEnv.BETTER_AUTH_SECRET!,
    baseURL,
    trustedOrigins: Array.from(new Set([authOrigin, "https://paperlog.net", "https://www.paperlog.net"])),
    emailAndPassword: { enabled: false },
    socialProviders: {
      ...(availability.google ? { google: { clientId: runtimeEnv.GOOGLE_CLIENT_ID!, clientSecret: runtimeEnv.GOOGLE_CLIENT_SECRET! } } : {}),
      ...(availability.github ? { github: { clientId: runtimeEnv.GITHUB_CLIENT_ID!, clientSecret: runtimeEnv.GITHUB_CLIENT_SECRET!, scope: ["read:user", "user:email"] } } : {}),
    },
    account: {
      encryptOAuthTokens: true,
      accountLinking: { enabled: true, allowDifferentEmails: false },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    advanced: { cookiePrefix: "paperlog" },
  });
}

let instance: ReturnType<typeof createConfiguredAuth> | null | undefined;

export function getBetterAuth() {
  if (instance !== undefined) return instance;
  if (!configured(runtimeEnv.BETTER_AUTH_SECRET)) {
    instance = null;
    return instance;
  }
  instance = createConfiguredAuth();
  return instance;
}

export async function getBetterAuthSession(requestHeaders: Headers) {
  const auth = getBetterAuth();
  if (!auth) return null;
  try {
    return await auth.api.getSession({ headers: requestHeaders });
  } catch {
    return null;
  }
}
