"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen min-h-dvh max-w-[480px] md:max-w-6xl w-full mx-auto flex flex-col md:flex-row bg-white md:bg-transparent shadow-sm md:shadow-none md:p-6 md:gap-6">
      {/* Desktop Sidebar - sticky so it stays visible when scrolling */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 self-start sticky top-6 bg-white rounded-intermediate-lg shadow-sm border border-slate-200 p-4">
        <div className="mb-8 px-4 pt-4">
          <h1 className="text-xl font-bold text-slate-800">HandOut</h1>
        </div>
        <nav className="flex flex-col gap-2" aria-label="Desktop navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-intermediate text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-trust-blue/10 text-trust-blue"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content - pb-20 on mobile for fixed nav clearance */}
      <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden md:bg-white md:rounded-intermediate-lg md:shadow-sm md:border md:border-slate-200 relative pb-20 md:pb-0" tabIndex={-1}>
        {children}
      </main>

      {/* Mobile Bottom Nav - fixed so always visible */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/50 bg-white/90 backdrop-blur-md px-4 py-3 pb-safe flex items-center justify-around max-w-[480px] mx-auto"
        aria-label="Primary navigation"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "min-h-[48px] min-w-[48px] flex flex-col items-center justify-center gap-0.5 rounded-intermediate text-sm font-medium transition-colors active:opacity-80",
              isActive(href) ? "text-trust-blue" : "text-slate-500 hover:text-slate-700"
            )}
            aria-current={isActive(href) ? "page" : undefined}
          >
            <Icon className="h-6 w-6 shrink-0" aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
