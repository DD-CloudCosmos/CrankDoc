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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:static md:border-0">
      <div className="flex items-center justify-around md:justify-start md:gap-6 md:px-6 md:py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 text-xs transition-colors md:flex-row md:gap-2 md:text-sm",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
