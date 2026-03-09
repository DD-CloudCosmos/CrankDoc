"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Database, FileText, BookOpen, AlertTriangle, Wrench, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesktopSearch } from "@/components/search";
import { SearchOverlay } from "@/components/search";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Diagnose",
    href: "/diagnose",
    icon: Stethoscope,
  },
  {
    name: "Bikes",
    href: "/bikes",
    icon: Database,
  },
  {
    name: "DTC",
    href: "/dtc",
    icon: FileText,
  },
  {
    name: "Glossary",
    href: "/glossary",
    icon: BookOpen,
  },
  {
    name: "Recalls",
    href: "/recalls",
    icon: AlertTriangle,
  },
  {
    name: "Admin",
    href: "/admin",
    icon: Wrench,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Mobile: floating bottom bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-[24px] bg-[#1F1F1F] px-2 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)] md:hidden">
        {navItems.map((item) => {
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
          onClick={() => setSearchOpen(true)}
          className="flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-2 text-xs text-white opacity-60 transition-opacity hover:opacity-100"
          aria-label="Open search"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>
      </nav>

      {/* Mobile search overlay */}
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Desktop: minimal top bar */}
      <nav className="hidden md:block">
        <div className="flex items-center gap-2 px-6 py-4">
          {navItems.map((item) => {
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
