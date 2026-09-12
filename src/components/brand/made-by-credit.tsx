import { cn } from "@/lib/utils";

export function MadeByCredit({
  className,
  tone = "onDark",
}: {
  className?: string;
  tone?: "onDark" | "onLight";
}) {
  return (
    <p
      className={cn(
        "text-[11px] leading-relaxed",
        tone === "onDark" ? "text-slate-500" : "text-slate-400",
        className
      )}
    >
      Made by Seher Siddique for Cellutech
    </p>
  );
}
