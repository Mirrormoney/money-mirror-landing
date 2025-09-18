import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

/**
 * Robust middleware that compiles on all setups:
 * - Exports a concrete default function (required by Next).
 * - Only gates /import and /account when REQUIRE_AUTH=1 (or NEXT_PUBLIC_REQUIRE_AUTH=1).
 * - Leaves /api/*, /_next/*, /public/* alone.
 */

const gate =
  process.env.REQUIRE_AUTH === "1" ||
  process.env.NEXT_PUBLIC_REQUIRE_AUTH === "1";

const protectedBases = ["/import", "/account"];

// Prepare the auth wrapper (returns a function(req) => NextResponse)
const auth = withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export default function middleware(req: NextRequest) {
  if (!gate) return NextResponse.next();
  const { pathname } = req.nextUrl;
  const isProtected = protectedBases.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (!isProtected) return NextResponse.next();
  // @ts-ignore - withAuth returns a function compatible with middleware
  return auth(req);
}

export const config = {
  // Apply to everything except Next internals and all API routes
  matcher: ["/((?!_next|api|public).*)"],
};
