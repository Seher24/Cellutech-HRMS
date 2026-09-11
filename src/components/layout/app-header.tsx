import Link from "next/link";
import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { displayRole } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

export async function AppHeader({ title }: { title?: string }) {
  const session = await auth();
  if (!session?.user) return null;

  const unread = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav role={session.user.role} />
        <div>
          <h1 className="text-sm font-semibold text-slate-900 md:text-base">
            {title ?? "Workspace"}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            {displayRole(session.user.role)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] text-white">
              {unread}
            </span>
          )}
        </Link>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
