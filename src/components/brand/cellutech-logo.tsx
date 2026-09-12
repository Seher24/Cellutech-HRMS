import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  /** Wordmark colors for dark chrome vs light surfaces */
  tone?: "onDark" | "onLight";
};

const sizes = {
  sm: { box: "h-9 w-9", px: 36 },
  md: { box: "h-11 w-11", px: 44 },
  lg: { box: "h-16 w-16", px: 64 },
};

export function CellutechLogo({
  className,
  size = "md",
  showWordmark = false,
  tone = "onDark",
}: Props) {
  const dim = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-black/20",
          dim.box
        )}
      >
        <Image
          src="/logo-black.png"
          alt="Cellutech"
          width={dim.px}
          height={dim.px}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <div
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.2em]",
              tone === "onDark" ? "text-teal-400" : "text-teal-700"
            )}
          >
            Cellutech
          </div>
          <div
            className={cn(
              "text-lg font-semibold tracking-tight",
              tone === "onDark" ? "text-white" : "text-slate-900"
            )}
          >
            HRMS
          </div>
        </div>
      )}
    </div>
  );
}
