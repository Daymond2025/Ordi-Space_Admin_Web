"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDate, formaterPrix, type PortefeuilleGlobalAdmin } from "@/lib/types";
import { FinanceIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS_STATUT = [
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "paye", label: "Payé" },
] as const;

const ONGLETS_PERIODE = [
  { id: "aujourd_hui", label: "Aujourd'hui" },
  { id: "semaine", label: "Cette semaine" },
  { id: "semaine_derniere", label: "Semaine dernière" },
  { id: "mois", label: "Ce mois" },
  { id: "tout", label: "Tout" },
] as const;

/**
 * Portefeuille global du Coordinateur (GET /coordinateur/portefeuille,
 * agrège tous les fournisseurs) — le règlement groupé par fournisseur
 * ("Payer tout") se fait depuis la fiche fournisseur (/fournisseurs/{id}),
 * pas ici (même convention que côté Coordinateur).
 */
export default function FinancePage() {
  const { token } = useAuth();
  const [statut, setStatut] = useState<(typeof ONGLETS_STATUT)[number]["id"]>("tous");
  const [periode, setPeriode] = useState<(typeof ONGLETS_PERIODE)[number]["id"]>("tout");
  const [portefeuille, setPortefeuille] = useState<PortefeuilleGlobalAdmin | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    const params = new URLSearchParams({ per_page: "50", periode });
    if (statut !== "tous") params.set("statut", statut);

    apiFetch<PortefeuilleGlobalAdmin>(`/coordinateur/portefeuille?${params}`, { token }).then((data) => {
      if (!annule) setPortefeuille(data);
    });

    return () => {
      annule = true;
    };
  }, [token, statut, periode]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Paiements"
        description="Portefeuille global des fournisseurs, piloté par le Coordinateur."
        icone={FinanceIcon}
        stats={[
          { valeur: portefeuille ? `${formaterPrix(portefeuille.solde_general)} CFA` : "—", label: "Solde général" },
          { valeur: portefeuille ? `${formaterPrix(portefeuille.total_en_attente)} CFA` : "—", label: "En attente" },
          { valeur: portefeuille ? `${formaterPrix(portefeuille.total_paye)} CFA` : "—", label: "Payé" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {ONGLETS_STATUT.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setStatut(o.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                statut === o.id ? "bg-brand-ink text-white" : "border border-brand-line bg-white text-brand-muted"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <select
          value={periode}
          onChange={(e) => setPeriode(e.target.value as (typeof ONGLETS_PERIODE)[number]["id"])}
          className="rounded-full border border-brand-line bg-white px-4 py-2 text-xs font-semibold text-brand-ink outline-none"
        >
          {ONGLETS_PERIODE.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {portefeuille === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : portefeuille.transactions.data.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune transaction dans cette catégorie.</p>
        ) : (
          portefeuille.transactions.data.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
              <div>
                <p className="font-bold text-brand-ink">{t.nom_produit ?? "Vente"}</p>
                <p className="text-xs text-brand-muted">
                  {t.nom_fournisseur ?? "Fournisseur inconnu"} · {formaterDate(t.date_transaction)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-brand-ink">{formaterPrix(t.montant)} CFA</p>
                <p className={`text-xs ${t.statut === "paye" ? "text-green-600" : "text-orange-600"}`}>
                  {t.statut === "paye" ? "Payé" : "En attente"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/fournisseurs" className="text-center text-xs font-semibold text-[color:var(--brand-blue-end)]">
        Régler un fournisseur précis →
      </Link>
    </div>
  );
}
