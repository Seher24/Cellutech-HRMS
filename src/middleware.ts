import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // req.auth can be an error object when AUTH_SECRET is missing — only trust a real user
  const isLoggedIn = Boolean(req.auth && "user" in req.auth && req.auth.user);
  const isAuthPage = pathname.startsWith("/login");

  if (!isLoggedIn && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

// Do NOT run auth middleware on auth/health APIs — MissingSecret would break them
export const config = {
  matcher: [
    "/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
