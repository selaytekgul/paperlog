import { NextResponse, type NextRequest } from "next/server";
import { crossSiteRequestResponse, isTrustedMutationRequest } from "./lib/request-security";

export function proxy(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) return crossSiteRequestResponse();
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
