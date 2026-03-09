"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Database, FileText, BookOpen, AlertTriangle, Wrench, Stethoscope, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesktopSearch } from "@/components/search";
import { SearchOverlay } from "@/components/search";

const primaryNavItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Diagnose", href: "/diagnose", icon: Stethoscope },
  { name: "Bikes", href: "/bikes", icon: Database },
];

const secondaryNavItems = [
  { name: "DTC", href: "/dtc", icon: FileText },
  { name: "Glossary", href: "/glossary", icon: BookOpen },
  { name: "Recalls", href: "/recalls", icon: AlertTriangle },
  { name: "Admin", href: "/admin", icon: Wrench },
];

const allNavItems = [...primaryNavItems, ...secondaryNavItems];

export function Navigation() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close More popover when Search overlay opens
  const handleSearchOpen = useCallback(() => {
    setMoreOpen(false);
    setSearchOpen(true);
  }, []);

  // Close More popover on click outside
  useEffect(() => {
    if (!moreOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [moreOpen]);

  return (
    <>
      {/* Mobile: floating bottom bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-[24px] bg-[#1F1F1F] px-2 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)] md:hidden">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-2 text-xs text-white transition-opacity",
                isActive ? "opacity-100" : "opacity-60"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        {/* Search button — opens overlay */}
        <button
          type="button"
          onClick={handleSearchOpen}
          className="flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-2 text-xs text-white opacity-60 transition-opacity hover:opacity-100"
          aria-label="Open search"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>
        {/* More button + popover */}
        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-2 text-xs text-white transition-opacity",
              moreOpen ? "opacity-100" : "opacity-60"
            )}
            aria-label="More navigation"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
          {/* More popover */}
          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-[16px] bg-[#1F1F1F] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[12px] px-3 py-2.5 min-h-[44px] text-sm text-white transition-opacity",
                      isActive ? "opacity-100 bg-white/10" : "opacity-70 hover:opacity-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile search overlay */}
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Desktop: minimal top bar */}
      <nav className="hidden md:block">
        <div className="flex items-center gap-2 px-6 py-4">
          {allNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-[999px] px-4 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[#1F1F1F] text-white"
                    : "text-foreground hover:text-foreground/70"
                )}
              >
                <span>{item.name}</span>
              </Link>
            );
          })}
          {/* Desktop inline search */}
          <div className="ml-auto">
            <DesktopSearch />
          </div>
        </div>
      </nav>
    </>
  );
}
