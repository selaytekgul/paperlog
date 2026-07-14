import { NextResponse, type NextRequest } from "next/server";
import { crossSiteRequestResponse, isTrustedMutationRequest } from "./lib/request-security";
import { applySecurityHeaders } from "./lib/security-headers";

export function proxy(request: NextRequest) {
  const response = isTrustedMutationRequest(request) ? NextResponse.next() : crossSiteRequestResponse();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/", "/:path*"],
};
