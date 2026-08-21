"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { SettingsIcon } from "./icons";

export function PrimarySidebar() {
  const pathname = usePathname();
  const estActif = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="flex h-full w-[236px] shrink-0 flex-col border-r border-brand-line bg-white">
      <div className="px-6 pb-6 pt-7">
        <p className="text-xs font-semibold text-brand-ink">Admin</p>
        <p className="text-2xl font-extrabold text-[color:var(--brand-blue-end)]">Ordi&apos;Space</p>
      </div>

      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const actif = estActif(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href} className="relative">
                {actif ? <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[color:var(--brand-blue-end)]" /> : null}
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    actif ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "text-brand-muted hover:bg-brand-line/60"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-brand-line px-3 py-4">
        <Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-muted hover:bg-brand-line/60">
          <SettingsIcon className="h-5 w-5 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
