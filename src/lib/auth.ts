import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { RoleName } from "@prisma/client";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import type { SessionUser } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    role: RoleName;
    subsidiaryId: string | null;
    departmentId: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: RoleName;
    subsidiaryId?: string | null;
    departmentId?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { role: true },
        });

        if (!user || user.status === "TERMINATED") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.name,
          subsidiaryId: user.subsidiaryId,
          departmentId: user.departmentId,
        };
      },
    }),
  ],
});

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
