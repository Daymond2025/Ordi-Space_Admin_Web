"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SECTIONS_SECONDAIRES } from "@/lib/nav";
import { PrimarySidebar } from "./PrimarySidebar";
import { SecondarySidebar } from "./SecondarySidebar";
import { Topbar } from "./Topbar";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const racine = "/" + (pathname.split("/")[1] ?? "");
  const section = SECTIONS_SECONDAIRES[racine];
  const estClients = racine === "/clients";

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <PrimarySidebar />
      <SecondarySidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar
          titre={pathname === "/" ? "Dashboard général" : undefined}
          rechercheLabel={section?.rechercheLabel ?? "Recherche Général"}
          onRechercheSubmit={estClients ? (valeur) => router.push(`/clients/consultation?recherche=${encodeURIComponent(valeur)}`) : undefined}
          rapportHref={estClients ? "/clients" : undefined}
        />
        <main className="flex-1 px-8 pb-10">{children}</main>
      </div>
    </div>
  );
}
