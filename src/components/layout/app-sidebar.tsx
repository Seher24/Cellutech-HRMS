"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleName } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getNavForRole } from "@/lib/nav";
import { displayRole } from "@/lib/rbac";
import { CellutechLogo } from "@/components/brand/cellutech-logo";
import { MadeByCredit } from "@/components/brand/made-by-credit";

export function AppSidebar({
  role,
  userName,
}: {
  role: RoleName;
  userName: string;
}) {
  const pathname = usePathname();
  const items = getNavForRole(role);

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#0b1220] text-slate-100">
      <div className="shrink-0 border-b border-slate-800 px-5 py-5">
        <CellutechLogo size="md" showWordmark />
        <p className="mt-3 truncate text-xs text-slate-400">{userName}</p>
        <p className="text-[11px] text-teal-300/90">{displayRole(role)}</p>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href + item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-teal-500/15 text-teal-200"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-slate-800 p-4 space-y-1">
        <p className="text-[11px] text-slate-500">Multi-subsidiary HR platform</p>
        <MadeByCredit />
      </div>
    </aside>
  );
}
