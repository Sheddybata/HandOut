"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/AppShell";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
