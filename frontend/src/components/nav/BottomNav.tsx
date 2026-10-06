"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Pill, History } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/family", label: "Family", icon: Users },
  { href: "/medicines", label: "Medicines", icon: Pill },
  { href: "/history", label: "History", icon: History },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-cream/15 bg-night/80 backdrop-blur-xl px-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 px-3 text-[0.68rem] transition-colors",
              active ? "text-terracotta-bright" : "text-mist/70"
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
