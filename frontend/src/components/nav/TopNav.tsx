"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Pill, History, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/family", label: "Family", icon: Users },
  { href: "/medicines", label: "Medicines", icon: Pill },
  { href: "/history", label: "History", icon: History },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="hidden md:flex items-center justify-between px-6 py-3 rounded-xl2 border border-cream/20 bg-cream/[0.08] backdrop-blur-xl shadow-glass mb-6">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky to-night grid place-items-center text-sm">💊</span>
        <div className="leading-tight">
          <div className="font-display text-lg text-cream">MediMind</div>
          <div className="text-[0.65rem] text-mist/70">Small reminders. Big care.</div>
        </div>
      </Link>

      <nav className="flex items-center gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm transition-colors",
                active ? "bg-cream/20 text-cream font-medium" : "text-mist/80 hover:text-cream hover:bg-cream/10"
              )}
            >
              <Icon size={15} /> {label}
            </Link>
          );
        })}
      </nav>

      <button className="w-9 h-9 rounded-full bg-cream/10 border border-cream/20 grid place-items-center text-cream">
        <Bell size={16} />
      </button>
    </header>
  );
}
