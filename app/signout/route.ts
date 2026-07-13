import { ensureDbSchema } from "../../db";
import { getBetterAuth } from "../../lib/auth";
import { directChatGPTSignOutPath, getChatGPTUser, safeRelativeReturnPath } from "../chatgpt-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeRelativeReturnPath(url.searchParams.get("return_to") ?? "/");
  const user = await getChatGPTUser();

  if (user?.authProvider === "external") {
    await ensureDbSchema();
    const auth = getBetterAuth();
    if (auth) {
      const signOutResponse = await auth.api.signOut({ headers: request.headers, asResponse: true });
      const responseHeaders = new Headers(signOutResponse.headers);
      responseHeaders.set("Location", returnTo);
      responseHeaders.set("Cache-Control", "no-store");
      return new Response(null, { status: 303, headers: responseHeaders });
    }
  }

  return Response.redirect(new URL(directChatGPTSignOutPath(returnTo), request.url), 303);
}
