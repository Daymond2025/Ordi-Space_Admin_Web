"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  formaterDate,
  formaterPrix,
  type CommandeBoutiqueAdmin,
  type LivreurDetailAdmin,
  type MissionLivreurAdmin,
  type ReponseCommandesBoutiqueAdmin,
} from "@/lib/types";
import { ChevronLeftIcon, LivreursIcon, PhoneIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const LIBELLE_STATUT_LIVRAISON: Record<string, string> = {
  en_preparation: "En préparation",
  en_attente_livreur: "En attente d'un livreur",
  assignee: "En attente d'acceptation",
  en_cours: "En cours",
  livree: "Livrée",
  echouee: "Échouée",
};

const LIBELLE_STATUT_VENTE_BOUTIQUE: Record<CommandeBoutiqueAdmin["statut"], string> = {
  en_attente: "À valider",
  en_cours: "En cours",
  livree: "Livrée",
  annulee: "Annulée",
};

export function FicheLivreur({ livreurId }: { livreurId: number }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<LivreurDetailAdmin | null>(null);
  const [missions, setMissions] = useState<MissionLivreurAdmin[] | null>(null);
  const [ventesBoutique, setVentesBoutique] = useState<ReponseCommandesBoutiqueAdmin | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<LivreurDetailAdmin>(`/coordinateur/livreurs/${livreurId}`, { token }),
      apiFetch<MissionLivreurAdmin[]>(`/coordinateur/livreurs/${livreurId}/missions`, { token }),
    ]).then(([d, m]) => {
      setDetail(d);
      setMissions(m);
    });
  }, [token, livreurId]);

  useEffect(() => {
    if (!token) return;
    apiFetch<ReponseCommandesBoutiqueAdmin>(`/admin/boutique/commandes?livreur_id=${livreurId}&per_page=50`, { token }).then(
      setVentesBoutique
    );
  }, [token, livreurId]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/livreurs" className="flex items-center gap-1 text-sm font-semibold text-brand-muted">
        <ChevronLeftIcon className="h-4 w-4" /> Retour aux livreurs
      </Link>

      <PageHero
        titre={detail ? `${detail.prenom ? `${detail.prenom} ` : ""}${detail.nom}` : "Livreur"}
        description={detail ? (detail.disponible ? "Disponible" : "Occupé") : undefined}
        icone={LivreursIcon}
        stats={
          detail
            ? [
                { valeur: detail.statistiques.commandes_total, label: "Missions totales" },
                { valeur: detail.statistiques.commandes_livrees, label: "Livrées" },
                { valeur: detail.statistiques.commandes_retournees, label: "Retournées" },
                { valeur: `${formaterPrix(detail.statistiques.gains_total_recu)} CFA`, label: "Cash encaissé" },
                { valeur: `${formaterPrix(detail.statistiques.gains_non_deposes)} CFA`, label: "Non déposé" },
              ]
            : []
        }
      />

      {detail?.telephone ? (
        <div className="flex items-center gap-1.5 rounded-2xl border border-brand-line bg-white p-4 text-sm text-brand-muted">
          <PhoneIcon className="h-4 w-4" /> {detail.telephone}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-brand-ink">Missions</p>
        {missions === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : missions.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune mission.</p>
        ) : (
          missions.map((mission) => (
            <div key={mission.commande_id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
              <div>
                <p className="font-bold text-brand-ink">{mission.nom_produit ?? `Commande #${mission.commande_id}`}</p>
                <p className="text-xs text-brand-muted">
                  {mission.nom_client} · {mission.zone_destination ?? "Zone non renseignée"}
                </p>
                {mission.nom_fournisseur ? <p className="text-[11px] text-brand-muted">Chez {mission.nom_fournisseur}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-brand-ink">{LIBELLE_STATUT_LIVRAISON[mission.statut_livraison] ?? mission.statut_livraison}</p>
                {mission.date_livraison_effective ? (
                  <p className="text-[11px] text-brand-muted">{formaterDate(mission.date_livraison_effective)}</p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-brand-ink">Ventes Boutique (affiliation)</p>
          {ventesBoutique ? (
            <p className="text-xs text-brand-muted">
              {formaterPrix(ventesBoutique.stats.commission_acquise)} CFA de commission acquise
            </p>
          ) : null}
        </div>
        <p className="text-xs text-brand-muted">
          Commandes apportées par ce livreur via son lien/QR affilié — distinctes des missions de livraison ci-dessus.
        </p>
        {ventesBoutique === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : ventesBoutique.commandes.data.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune vente boutique apportée par ce livreur.</p>
        ) : (
          ventesBoutique.commandes.data.map((vente) => (
            <Link
              key={vente.id}
              href={`/clients/commandes/${vente.commande_id}`}
              className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm"
            >
              <div>
                <p className="font-bold text-brand-ink">{vente.nom_produit ?? `Commande #${vente.commande_id}`}</p>
                <p className="text-xs text-brand-muted">
                  {vente.client} · {formaterDate(vente.date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-orange-500">+{formaterPrix(vente.commission)} CFA</p>
                <p className="text-[11px] text-brand-muted">{LIBELLE_STATUT_VENTE_BOUTIQUE[vente.statut]}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
