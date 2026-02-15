"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Database, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Diagnose",
    href: "/diagnose",
    icon: Search,
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
];

export function Navigation() {
  const pathname = usePathname();

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
                "flex flex-col items-center gap-1 px-2 text-xs text-white transition-opacity",
                isActive ? "opacity-100" : "opacity-60"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

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
        </div>
      </nav>
    </>
  );
}
