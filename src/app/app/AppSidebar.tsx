"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarLinks = [
  { name: "Dashboard", icon: "📊", href: "/app/dashboard" },
  { name: "Transactions", icon: "💳", href: "/app/transactions", badge: 12 },
  { name: "Invoices", icon: "📄", href: "#" },
  { name: "Expenses", icon: "💰", href: "#" },
  { name: "Reports", icon: "📈", href: "#" },
];

const complianceLinks = [
  { name: "Tax Centre", icon: "🏛️", href: "#", badge: 2 },
  { name: "Filings", icon: "📋", href: "#" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gradient-to-b from-primary-deep to-primary text-white flex flex-col sticky top-0 h-screen shrink-0">
      <div className="flex items-center gap-3 p-5 border-b border-white/10">
        <Image
          src="/logo.png"
          alt="Kompleet Logo"
          width={32}
          height={32}
          className="rounded-lg"
        />
        <span className="font-ceoruse text-base font-bold">
          KOMPLEET
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-bold text-white/30 uppercase tracking-widest px-4 pt-4 pb-2">
          Main Menu
        </div>
        {sidebarLinks.map((link) => {
          const isActive =
            link.href !== "#" && pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="w-5 text-center">{link.icon}</span>
              <span>{link.name}</span>
              {link.badge !== undefined && (
                <span
                  className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                    link.badge === 2
                      ? "bg-error text-white"
                      : "bg-accent text-charcoal"
                  }`}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
        <div className="text-xs font-bold text-white/30 uppercase tracking-widest px-4 pt-6 pb-2">
          Compliance
        </div>
        {complianceLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
          >
            <span className="w-5 text-center">{link.icon}</span>
            <span>{link.name}</span>
            {link.badge !== undefined && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-error text-white">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-display text-sm font-bold text-charcoal">
            AO
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              Adaeze Okonkwo
            </div>
            <div className="text-xs text-white/40">Free Beta · Lagos</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
