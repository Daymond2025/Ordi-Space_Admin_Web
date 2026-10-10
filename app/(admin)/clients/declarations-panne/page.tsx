"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  formaterDateHeure,
  LIBELLE_STATUT_DEMANDE_SAV,
  STYLE_STATUT_DEMANDE_SAV,
  type DemandeSav,
  type Pagination,
  type StatutDemandeSav,
} from "@/lib/types";
import { TriangleAlerteIcon, UserAvatarIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS: { id: StatutDemandeSav | "tous"; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "planifiee", label: "Planifiées" },
  { id: "en_cours", label: "En cours" },
  { id: "resolue", label: "Résolues" },
  { id: "cloturee", label: "Clôturées" },
];

export default function DeclarationsPannePage() {
  const { token } = useAuth();
  const [demandes, setDemandes] = useState<DemandeSav[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<Pagination<DemandeSav>>("/sav/demandes?per_page=100", { token })
      .then((page) => {
        setDemandes(page.data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token]);

  useEffect(charger, [charger]);

  const listeFiltree = useMemo(
    () => (onglet === "tous" ? demandes : (demandes?.filter((d) => d.statut_demande === onglet) ?? null)),
    [demandes, onglet]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Déclarations de panne"
        description="Pannes signalées par les clients — suivi et affectation aux techniciens."
        icone={TriangleAlerteIcon}
        stats={[
          { valeur: demandes?.length ?? "—", label: "Total" },
          { valeur: demandes?.filter((d) => d.statut_demande === "en_attente").length ?? "—", label: "En attente" },
          { valeur: demandes?.filter((d) => d.statut_demande === "resolue").length ?? "—", label: "Résolues" },
        ]}
      />

      <div className="flex flex-wrap gap-2">
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

      {erreur ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-rose-600">Impossible de charger les déclarations de panne.</p>
          <button type="button" onClick={charger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
            Réessayer
          </button>
        </div>
      ) : listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune déclaration dans cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {listeFiltree.map((demande) => (
            <div key={demande.id} className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
                <UserAvatarIcon className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-brand-ink">
                    {demande.client.user.prenom ? `${demande.client.user.prenom} ` : ""}
                    {demande.client.user.nom}
                  </p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STYLE_STATUT_DEMANDE_SAV[demande.statut_demande]}`}>
                    {LIBELLE_STATUT_DEMANDE_SAV[demande.statut_demande]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-brand-muted">{demande.description_probleme}</p>
                <p className="mt-1 text-[11px] text-brand-muted">
                  {demande.garantie?.ligne_commande?.produit ? `${demande.garantie.ligne_commande.produit.nom_produit} — ` : ""}
                  {formaterDateHeure(demande.date_demande)}
                </p>
              </div>

              <Link
                href={`/clients/declarations-panne/${demande.id}`}
                className="shrink-0 rounded-full bg-brand-ink px-4 py-2 text-xs font-semibold text-white"
              >
                Voir
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
