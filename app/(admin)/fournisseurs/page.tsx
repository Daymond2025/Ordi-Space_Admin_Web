"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDate, formaterPrix, type FournisseurAdmin, type Pagination } from "@/lib/types";
import { FournisseursIcon, SearchIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

/**
 * Miroir admin du "Centre des opérations" de Cordinateur_App_Web — l'Admin
 * (superviseur global) voit les mêmes fournisseurs et les mêmes chiffres que
 * le Coordinateur (GET /fournisseurs, déjà accessible via ses permissions).
 */
export default function FournisseursPage() {
  const { token } = useAuth();
  const [fournisseurs, setFournisseurs] = useState<FournisseurAdmin[] | null>(null);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<FournisseurAdmin>>("/fournisseurs?per_page=100", { token }).then((page) => setFournisseurs(page.data));
  }, [token]);

  const listeFiltree = useMemo(() => {
    if (!fournisseurs) return null;
    const terme = recherche.trim().toLowerCase();
    if (!terme) return fournisseurs;
    return fournisseurs.filter((f) => f.nom_entreprise.toLowerCase().includes(terme));
  }, [fournisseurs, recherche]);

  const montantTotalEnAttente = fournisseurs?.reduce((total, f) => total + f.montant_en_attente, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Fournisseurs"
        description="Activité des fournisseurs pilotée par le Coordinateur — produits, commandes, portefeuille."
        icone={FournisseursIcon}
        stats={[
          { valeur: fournisseurs?.length ?? "—", label: "Total" },
          { valeur: `${formaterPrix(montantTotalEnAttente)} CFA`, label: "En attente de paiement" },
        ]}
      />

      <div className="relative w-80">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un fournisseur…"
          className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none"
        />
      </div>

      {listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun fournisseur.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {listeFiltree.map((fournisseur) => (
            <Link
              key={fournisseur.user_id}
              href={`/fournisseurs/${fournisseur.user_id}`}
              className="flex flex-col gap-2 rounded-2xl border border-brand-line bg-white p-4"
            >
              <p className="truncate text-sm font-bold text-brand-ink">{fournisseur.nom_entreprise}</p>
              <p className="truncate text-xs text-brand-muted">{fournisseur.zone_couverte ?? "Zone non renseignée"}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-brand-muted">
                <span>{fournisseur.produits_count} produits</span>
                <span>{fournisseur.commandes_total_count} commandes</span>
              </div>
              {fournisseur.montant_en_attente > 0 ? (
                <p className="mt-1 text-xs font-semibold text-orange-600">
                  {formaterPrix(fournisseur.montant_en_attente)} CFA en attente
                </p>
              ) : null}
              {fournisseur.derniere_commande_le ? (
                <p className="text-[11px] text-brand-muted">Dernière commande : {formaterDate(fournisseur.derniere_commande_le)}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
