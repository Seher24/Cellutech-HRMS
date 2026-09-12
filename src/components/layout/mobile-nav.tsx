"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { RoleName } from "@prisma/client";
import { getNavForRole } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { CellutechLogo } from "@/components/brand/cellutech-logo";
import { MadeByCredit } from "@/components/brand/made-by-credit";

export function MobileNav({ role }: { role: RoleName }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = getNavForRole(role);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
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
          className="fixed inset-0 z-50 flex flex-col bg-[#0b1220] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
            <CellutechLogo size="sm" showWordmark />
            <button
              type="button"
              aria-label="Close menu"
              className="text-slate-300"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
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
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-800 p-4">
            <MadeByCredit />
          </div>
        </div>
      )}
    </div>
  );
}
