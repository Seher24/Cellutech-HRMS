"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { RoleName } from "@prisma/client";
import { getNavForRole } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav({ role }: { role: RoleName }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = getNavForRole(role);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-[#0b1220]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
                Cellutech
              </div>
              <div className="text-sm font-semibold text-white">HRMS</div>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              className="text-slate-300"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1 p-3">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href + item.title}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                    active
                      ? "bg-teal-500/15 text-teal-200"
                      : "text-slate-300 hover:bg-white/5"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
