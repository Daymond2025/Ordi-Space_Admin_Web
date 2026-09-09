"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, type CommercialDetailAdmin } from "@/lib/types";
import { ChevronLeftIcon, CommerciauxIcon, PhoneIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

export function FicheCommercial({ commercialId }: { commercialId: number }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<CommercialDetailAdmin | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<CommercialDetailAdmin>(`/coordinateur/commerciaux/${commercialId}`, { token }).then(setDetail);
  }, [token, commercialId]);

  async function basculerActif() {
    if (!token || !detail || enCours) return;
    setEnCours(true);
    try {
      await apiFetch(`/coordinateur/commerciaux/${commercialId}/statut`, {
        method: "PATCH",
        token,
        body: { actif: !detail.actif },
      });
      setDetail({ ...detail, actif: !detail.actif });
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/commerciaux" className="flex items-center gap-1 text-sm font-semibold text-brand-muted">
        <ChevronLeftIcon className="h-4 w-4" /> Retour aux commerciaux
      </Link>

      <PageHero
        titre={detail ? `${detail.prenom ? `${detail.prenom} ` : ""}${detail.nom}` : "Commercial"}
        description={detail?.nom_entreprise ?? undefined}
        icone={CommerciauxIcon}
        stats={
          detail
            ? [
                { valeur: detail.statistiques.commandes_total, label: "Commandes" },
                { valeur: detail.statistiques.commandes_validees, label: "Validées" },
                { valeur: detail.statistiques.commandes_annulees, label: "Annulées" },
                { valeur: `${formaterPrix(detail.statistiques.commission_totale)} CFA`, label: "Commission" },
              ]
            : []
        }
      />

      {detail ? (
        <div className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4">
          <div className="flex flex-col gap-1 text-sm text-brand-muted">
            {detail.telephone ? (
              <span className="flex items-center gap-1.5">
                <PhoneIcon className="h-4 w-4" /> {detail.telephone}
              </span>
            ) : null}
            {detail.localisation ? <span>{detail.localisation}</span> : null}
          </div>

          <button
            type="button"
            onClick={basculerActif}
            disabled={enCours}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
              detail.actif ? "bg-rose-50 text-rose-600" : "bg-green-50 text-green-600"
            }`}
          >
            {detail.actif ? "Suspendre" : "Activer"}
          </button>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      )}
    </div>
  );
}
