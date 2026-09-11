import type { NextAuthConfig } from "next-auth";
import type { RoleName } from "@prisma/client";
import type { SessionUser } from "@/lib/rbac";

/**
 * Edge-safe Auth.js config (no Prisma / bcrypt).
 * Used by middleware. Full providers live in auth.ts.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.subsidiaryId = user.subsidiaryId;
        token.departmentId = user.departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      const user: SessionUser = {
        id: (token.id as string) ?? "",
        email: session.user.email!,
        name: session.user.name ?? "",
        role: token.role as RoleName,
        subsidiaryId: (token.subsidiaryId as string | null) ?? null,
        departmentId: (token.departmentId as string | null) ?? null,
      };
      session.user = user as typeof session.user;
      return session;
    },
  },
} satisfies NextAuthConfig;
