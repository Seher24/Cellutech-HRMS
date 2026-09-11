import type { NextAuthConfig } from "next-auth";
import type { RoleName } from "@prisma/client";

/**
 * Edge-safe Auth.js config (no Prisma runtime / bcrypt).
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
        token.role = (user as { role?: RoleName }).role;
        token.subsidiaryId = (user as { subsidiaryId?: string | null }).subsidiaryId;
        token.departmentId = (user as { departmentId?: string | null }).departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: (token.id as string) ?? "",
        role: token.role as RoleName,
        subsidiaryId: (token.subsidiaryId as string | null) ?? null,
        departmentId: (token.departmentId as string | null) ?? null,
      } as typeof session.user;
      return session;
    },
  },
} satisfies NextAuthConfig;
