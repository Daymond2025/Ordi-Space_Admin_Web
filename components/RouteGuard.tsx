"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { peutAccederEspace, useAuth } from "@/context/AuthContext";
import { NAV_ITEMS } from "@/lib/nav";

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, pret } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pret && !user) {
      router.replace("/login");
    }
  }, [pret, user, router]);

  useEffect(() => {
    if (!pret || !user) return;
    // Empêche un admin restreint d'atteindre un espace non accordé en tapant
    // l'URL directement — la sidebar le masque déjà, ceci est la barrière
    // côté front (l'API reste la vraie barrière, cf. VerifieEspaceAdmin).
    const racine = "/" + (pathname.split("/")[1] ?? "");
    const item = NAV_ITEMS.find((i) => i.href === racine);
    if (item?.espace && !peutAccederEspace(user, item.espace)) {
      router.replace("/");
    }
  }, [pret, user, pathname, router]);

  if (!pret || !user) {
    return <div className="flex h-screen w-screen items-center justify-center text-sm text-brand-muted">Chargement…</div>;
  }

  return <>{children}</>;
}
