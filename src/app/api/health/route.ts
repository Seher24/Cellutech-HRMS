import { NextResponse } from "next/server";

/** Temporary deploy diagnostics — does not expose secret values. */
export async function GET() {
  const authSecret = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()
  );
  const authUrl = process.env.AUTH_URL?.trim() || null;
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim() || null;
  const databaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const databaseUrlUnpooled = Boolean(process.env.DATABASE_URL_UNPOOLED?.trim());

  return NextResponse.json({
    ok: authSecret && databaseUrl,
    authSecretSet: authSecret,
    databaseUrlSet: databaseUrl,
    databaseUrlUnpooledSet: databaseUrlUnpooled,
    authUrlLooksLikeUrl: Boolean(authUrl?.startsWith("http")),
    authUrlValue: authUrl,
    nextAuthUrlValue: nextAuthUrl,
    tip: !authSecret
      ? "Add AUTH_SECRET in Vercel → Environment Variables → Production, then Redeploy"
      : authUrl && !authUrl.startsWith("http")
        ? "AUTH_URL must be https://cellutech-hrms.vercel.app (not the secret)"
        : "Auth env looks OK — try login again",
  });
}
