"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Bike,
  ListChecks,
  BookOpen,
  AlertTriangle,
  Wrench,
  Activity,
  MoreHorizontal,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { DesktopSearch } from "@/components/search";
import { SearchOverlay } from "@/components/search";

/** Tabs shown in the mobile tab bar (iOS-style, max five). */
const tabItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Diagnose", href: "/diagnose", icon: Activity },
  { name: "Bikes", href: "/bikes", icon: Bike },
  { name: "Codes", href: "/dtc", icon: ListChecks },
];

/** Items behind the mobile "More" tab. */
const moreItems = [
  { name: "My Garage", href: "/garage", icon: Bike },
  { name: "Glossary", href: "/glossary", icon: BookOpen },
  { name: "Recalls", href: "/recalls", icon: AlertTriangle },
  { name: "VIN Decoder", href: "/vin", icon: ScanLine },
  { name: "Admin", href: "/admin", icon: Wrench },
];

/** Links in the desktop top bar. */
const desktopItems = [
  { name: "My Garage", href: "/garage" },
  { name: "Diagnose", href: "/diagnose" },
  { name: "Bikes", href: "/bikes" },
  { name: "Codes", href: "/dtc" },
  { name: "Glossary", href: "/glossary" },
  { name: "Recalls", href: "/recalls" },
  { name: "VIN", href: "/vin" },
];

/** A route is active for its own path and any nested path (e.g. /bikes/123). */
function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const handleSearchOpen = useCallback(() => {
    setMoreOpen(false);
    setSearchOpen(true);
  }, []);

  // Close the More menu on click outside or Escape
  useEffect(() => {
    if (!moreOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreOpen]);

  const moreActive = moreItems.some((item) => isActiveRoute(pathname, item.href));

  return (
    <>
      {/* Top bar: frosted glass, sticky. Mobile shows logo + search; desktop adds links. */}
      <header className="sticky top-0 z-40 border-b border-separator bg-nav-glass backdrop-blur-xl backdrop-saturate-[1.8]">
        <div className="mx-auto flex h-12 max-w-[1024px] items-center gap-6 px-4 md:h-[52px] md:px-[22px]">
          <Link href="/" aria-label="CrankDoc home" className="flex min-h-[44px] items-center">
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden flex-1 items-center justify-center gap-4 lg:flex">
            {desktopItems.map((item) => {
              const isActive = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center whitespace-nowrap text-[13px] transition-colors",
                    isActive ? "font-semibold text-foreground" : "text-foreground/75 hover:text-foreground"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden lg:block">
            <DesktopSearch />
          </div>

          <button
            type="button"
            onClick={handleSearchOpen}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-full text-foreground lg:hidden"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile tab bar: frosted glass, pinned to the bottom edge */}
      <nav
        aria-label="Tabs"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-separator bg-nav-glass pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-[1.8] lg:hidden"
      >
        <div className="grid h-[60px] grid-cols-5">
          {tabItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.25 : 1.75} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((prev) => !prev)}
              className={cn(
                "flex h-full w-full min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                moreOpen || moreActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label="More navigation"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal className="h-6 w-6" strokeWidth={1.75} />
              <span>More</span>
            </button>

            {moreOpen && (
              <div className="absolute bottom-full right-2 mb-3 w-56 overflow-hidden rounded-[14px] bg-card shadow-float">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-[48px] items-center justify-between gap-3 border-b border-separator px-4 text-[17px] last:border-b-0",
                        isActive ? "text-primary" : "text-foreground hover:bg-accent/60"
                      )}
                    >
                      <span>{item.name}</span>
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
