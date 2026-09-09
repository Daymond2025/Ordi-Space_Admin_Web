"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, type CommercialAdmin } from "@/lib/types";
import { CommerciauxIcon, SearchIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS = [
  { id: "tous", label: "Tous" },
  { id: "actif", label: "Actifs" },
  { id: "inactif", label: "Inactifs" },
] as const;

/**
 * Miroir admin de Cordinateur_App_Web/EcranAgent.tsx — GET
 * /coordinateur/commerciaux (déjà accessible à l'Admin).
 */
export default function CommerciauxPage() {
  const { token } = useAuth();
  const [commerciaux, setCommerciaux] = useState<CommercialAdmin[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    if (!token) return;
    apiFetch<CommercialAdmin[]>("/coordinateur/commerciaux", { token }).then(setCommerciaux);
  }, [token]);

  const listeFiltree = useMemo(() => {
    if (!commerciaux) return null;
    const terme = recherche.trim().toLowerCase();
    return commerciaux.filter((c) => {
      if (onglet === "actif" && !c.actif) return false;
      if (onglet === "inactif" && c.actif) return false;
      if (!terme) return true;
      return `${c.prenom ?? ""} ${c.nom}`.toLowerCase().includes(terme);
    });
  }, [commerciaux, onglet, recherche]);

  const actifs = commerciaux?.filter((c) => c.actif).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Commerciaux"
        description="Commandes et commissions des commerciaux pilotés par le Coordinateur."
        icone={CommerciauxIcon}
        stats={[
          { valeur: commerciaux?.length ?? "—", label: "Total" },
          { valeur: actifs, label: "Actifs" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOnglet(o.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                onglet === o.id ? "bg-brand-ink text-white" : "border border-brand-line bg-white text-brand-muted"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un commercial…"
            className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none"
          />
        </div>
      </div>

      {listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun commercial dans cette catégorie.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {listeFiltree.map((commercial) => (
            <Link
              key={commercial.user_id}
              href={`/commerciaux/${commercial.user_id}`}
              className="flex flex-col gap-2 rounded-2xl border border-brand-line bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-bold text-brand-ink">
                  {commercial.prenom ? `${commercial.prenom} ` : ""}
                  {commercial.nom}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    commercial.actif ? "bg-green-50 text-green-600" : "bg-gray-100 text-brand-muted"
                  }`}
                >
                  {commercial.actif ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-brand-muted">
                <span>{commercial.commandes_total} commandes</span>
                <span>{formaterPrix(commercial.commission_totale)} CFA</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
