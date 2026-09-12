import { cn } from "@/lib/utils";

/** Horizontal-scroll wrapper for dense data tables on narrow screens. */
export function ResponsiveTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch]",
        className
      )}
    >
      {children}
    </div>
  );
}
