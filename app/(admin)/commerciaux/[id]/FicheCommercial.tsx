"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDate, formaterPrix, type CommandeCommercialAdmin, type CommercialDetailAdmin, type Pagination } from "@/lib/types";
import { ChevronLeftIcon, CommerciauxIcon, PhoneIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const LIBELLE_STATUT_COMMANDE: Record<string, string> = {
  en_attente: "En attente",
  validee: "Validée",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
  reportee: "Reportée",
  client_injoignable: "Client injoignable",
  numero_incorrect: "Numéro incorrect",
};

export function FicheCommercial({ commercialId }: { commercialId: number }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<CommercialDetailAdmin | null>(null);
  const [commandes, setCommandes] = useState<CommandeCommercialAdmin[] | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<CommercialDetailAdmin>(`/coordinateur/commerciaux/${commercialId}`, { token }).then(setDetail);
  }, [token, commercialId]);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<CommandeCommercialAdmin>>(`/coordinateur/commerciaux/${commercialId}/commandes?per_page=50`, { token }).then((page) =>
      setCommandes(page.data)
    );
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

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-brand-ink">Commandes saisies</p>
        {commandes === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : commandes.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune commande.</p>
        ) : (
          commandes.map((c) => (
            <Link
              key={c.commande_id}
              href={`/clients/commandes/${c.commande_id}`}
              className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm"
            >
              <div>
                <p className="font-bold text-brand-ink">{c.nom_produit ?? `Commande #${c.commande_id}`}</p>
                <p className="text-xs text-brand-muted">
                  {c.nom_client} · {formaterDate(c.date_commande)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-brand-ink">{formaterPrix(c.montant_total)} CFA</p>
                <p className="text-xs text-brand-muted">{LIBELLE_STATUT_COMMANDE[c.statut] ?? c.statut}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
