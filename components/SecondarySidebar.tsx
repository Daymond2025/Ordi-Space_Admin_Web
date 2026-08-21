"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SECTIONS_SECONDAIRES, type GroupeSecondaire } from "@/lib/nav";
import { ChevronDownIcon, ChevronLeftIcon, HomeIcon } from "./icons";

function trouverSection(pathname: string) {
  const racine = "/" + (pathname.split("/")[1] ?? "");
  return SECTIONS_SECONDAIRES[racine];
}

function estActif(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function groupeContientPageActive(groupe: GroupeSecondaire, pathname: string) {
  return groupe.elements.some((element) => estActif(pathname, element.href));
}

function LienSecondaire({ href, label, actif }: { href: string; label: string; actif: boolean }) {
  return (
    <Link
      href={href}
      style={actif ? { clipPath: "polygon(0% 0%, 88% 0%, 100% 50%, 88% 100%, 0% 100%)" } : undefined}
      className={`flex items-center gap-3 rounded-l-full px-3 py-2.5 text-sm font-medium transition-colors ${
        actif ? "bg-gradient-brand-blue rounded-r-full pr-6 text-white shadow-sm" : "rounded-r-full text-brand-ink hover:bg-brand-line/50"
      }`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${actif ? "bg-white/25" : "bg-blue-50"}`}>
        <HomeIcon className={`h-4 w-4 ${actif ? "text-white" : "text-[color:var(--brand-blue-end)]"}`} />
      </span>
      {label}
    </Link>
  );
}

export function SecondarySidebar() {
  const pathname = usePathname();
  const section = trouverSection(pathname);
  const [visible, setVisible] = useState(true);
  const [groupesOuverts, setGroupesOuverts] = useState<string[]>([]);

  // Réaffiche le panneau et ouvre le groupe de la page courante à chaque
  // changement d'entité ou de route.
  useEffect(() => {
    setVisible(true);
    if (!section) return;
    const groupeActif = section.groupes.find((g) => groupeContientPageActive(g, pathname));
    setGroupesOuverts(groupeActif ? [groupeActif.label] : []);
  }, [section, pathname]);

  if (!section) return null;

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        aria-label="Afficher le panneau"
        className="flex h-10 w-6 shrink-0 items-center justify-center self-center rounded-r-full border border-l-0 border-brand-line bg-white text-brand-muted"
      >
        <ChevronLeftIcon className="h-4 w-4 rotate-180" />
      </button>
    );
  }

  function basculerGroupe(label: string) {
    setGroupesOuverts((precedent) => (precedent.includes(label) ? precedent.filter((g) => g !== label) : [...precedent, label]));
  }

  return (
    <div className="relative flex h-full w-[280px] shrink-0 flex-col border-r border-brand-line bg-white pb-14">
      <div className="relative">
        <div className="bg-gradient-brand-blue rounded-b-[1.75rem] px-6 py-6">
          <p className="text-lg font-extrabold text-white">{section.titre}</p>
        </div>
        <span
          className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[14px] border-x-transparent border-t-[14px]"
          style={{ borderTopColor: "var(--brand-blue-end)" }}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pt-6">
        <LienSecondaire href={section.racine.href} label={section.racine.label} actif={pathname === section.racine.href} />

        <div className="mt-4 flex flex-col gap-3">
          {section.groupes.map((groupe) => {
            const ouvert = groupesOuverts.includes(groupe.label);

            return (
              <div key={groupe.label}>
                <button
                  type="button"
                  onClick={() => basculerGroupe(groupe.label)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-brand-muted"
                >
                  {groupe.label}
                  <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${ouvert ? "rotate-180" : ""}`} />
                </button>

                {ouvert ? (
                  <ul className="mt-1 flex flex-col gap-1">
                    {groupe.elements.map((element) => (
                      <li key={element.href}>
                        <LienSecondaire href={element.href} label={element.label} actif={estActif(pathname, element.href)} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Réduire le panneau"
        className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-brand-ink text-white shadow-md"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
