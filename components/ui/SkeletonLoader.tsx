"use client";

import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  variant?: "text" | "bullet";
}

const shimmerClass =
  "animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,#e2e8f0_0%,#f1f5f9_50%,#e2e8f0_100%)]";

export function SkeletonLoader({
  className,
  lines = 4,
  variant = "text",
}: SkeletonLoaderProps) {
  if (variant === "bullet") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className={cn("h-6 w-6 shrink-0 rounded-md bg-slate-200", shimmerClass)} />
            <div className="flex-1 space-y-1">
              <div className={cn("h-4 w-full rounded bg-slate-200", shimmerClass)} />
              <div
                className={cn("h-4 rounded bg-slate-200", shimmerClass)}
                style={{ width: "85%" }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("h-4 rounded bg-slate-200", shimmerClass)}
          style={{ width: i === lines - 1 && lines > 1 ? "70%" : "100%" }}
        />
      ))}
    </div>
  );
}
