"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDate, formaterDateHeure, formaterPrix } from "@/lib/types";
import type {
  ActiviteCoordinateur,
  Pagination,
  PeriodeEspaceCoordinateur,
  ProduitActifCoordinateur,
  StatistiquesEspaceCoordinateur,
  UtilisateurAdmin,
} from "@/lib/types";
import { PageHero } from "@/components/PageHero";
import { CalendarIcon, CashIcon, CoordinateursIcon, ImagePlaceholderIcon, TriangleAlerteIcon } from "@/components/icons";

const ONGLETS_PERIODE: { id: PeriodeEspaceCoordinateur; label: string }[] = [
  { id: "aujourd_hui", label: "Aujourd'hui" },
  { id: "semaine", label: "Cette semaine" },
  { id: "semaine_derniere", label: "Semaine dernière" },
  { id: "mois", label: "Ce mois" },
  { id: "tout", label: "Tout" },
];

function CarteDetail({ valeur, label }: { valeur: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-brand-line bg-white p-4">
      <p className="text-xl font-extrabold text-brand-ink">{valeur}</p>
      <p className="text-xs text-brand-muted">{label}</p>
    </div>
  );
}

/**
 * Miroir admin de Cordinateur_App_Web/src/app/(shell)/EcranSpace.tsx — mêmes
 * 2 endpoints (statistiques + produits actifs), mais avec le design system
 * propre à Admin_Web (PageHero + grilles de cartes) plutôt qu'un portage
 * pixel-perfect du mobile.
 */
export function TableauDeBordCoordinateur() {
  const { token } = useAuth();
  const [periode, setPeriode] = useState<PeriodeEspaceCoordinateur>("aujourd_hui");
  const [stats, setStats] = useState<StatistiquesEspaceCoordinateur | null>(null);
  const [produits, setProduits] = useState<ProduitActifCoordinateur[] | null>(null);

  const [coordinateurs, setCoordinateurs] = useState<UtilisateurAdmin[] | null>(null);
  const [coordinateurId, setCoordinateurId] = useState<number | null>(null);
  const [activites, setActivites] = useState<ActiviteCoordinateur[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    Promise.all([
      apiFetch<StatistiquesEspaceCoordinateur>(`/coordinateur/espace/statistiques?periode=${periode}`, { token }),
      apiFetch<ProduitActifCoordinateur[]>("/produits/activite-recente", { token }),
    ])
      .then(([statistiques, produitsActifs]) => {
        if (annule) return;
        setStats(statistiques);
        setProduits(produitsActifs);
      })
      .catch(() => {
        if (!annule) {
          setStats(null);
          setProduits([]);
        }
      });

    return () => {
      annule = true;
    };
  }, [token, periode]);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<UtilisateurAdmin>>("/admin/utilisateurs?type_utilisateur=coordinateur&per_page=100", { token }).then((page) => {
      setCoordinateurs(page.data);
      setCoordinateurId((actuel) => actuel ?? page.data[0]?.id ?? null);
    });
  }, [token]);

  useEffect(() => {
    if (!token || !coordinateurId) return;
    let annule = false;

    apiFetch<Pagination<ActiviteCoordinateur>>(`/admin/coordinateurs/${coordinateurId}/activites?periode=tout&per_page=20`, { token })
      .then((page) => {
        if (!annule) setActivites(page.data);
      })
      .catch(() => {
        if (!annule) setActivites([]);
      });

    return () => {
      annule = true;
    };
  }, [token, coordinateurId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Espace Coordinateur"
        description="Vue d'ensemble des opérations pilotées par le Coordinateur."
        icone={CoordinateursIcon}
        stats={[
          { valeur: stats?.commandes_recues ?? "—", label: "Commandes reçues" },
          { valeur: stats?.commandes_validees ?? "—", label: "Validées" },
          { valeur: stats?.commandes_en_cours ?? "—", label: "En cours" },
          { valeur: stats ? `${formaterPrix(stats.commission_generee)} CFA` : "—", label: "Commission générée" },
        ]}
      />

      <div className="flex gap-2">
        {ONGLETS_PERIODE.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setPeriode(o.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              periode === o.id ? "bg-brand-ink text-white" : "border border-brand-line bg-white text-brand-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <CarteDetail valeur={stats?.commandes_en_attente ?? "—"} label="En attente" />
        <CarteDetail valeur={stats?.commandes_en_livraison ?? "—"} label="En livraison" />
        <CarteDetail valeur={stats?.commandes_livrees ?? "—"} label="Livrées" />
        <CarteDetail valeur={stats?.commandes_annulees ?? "—"} label="Annulées" />
        <CarteDetail valeur={stats?.commandes_reportees ?? "—"} label="Reportées" />
        <CarteDetail valeur={stats?.commandes_client_injoignable ?? "—"} label="Client injoignable" />
        <CarteDetail valeur={stats?.commandes_numero_incorrect ?? "—"} label="Numéro incorrect" />
        <CarteDetail valeur={stats ? `${formaterPrix(stats.commission_distribuee)} CFA` : "—"} label="Commission distribuée" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TriangleAlerteIcon className="h-4 w-4 text-brand-muted" />
          <h2 className="text-sm font-bold text-brand-ink">Produits actifs</h2>
        </div>

        {produits === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : produits.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune activité récente pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {produits.map((produit) => (
              <div key={produit.produit_id} className="flex gap-3 rounded-2xl border border-brand-line bg-white p-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
                  {produit.photo ? (
                    <Image src={produit.photo} alt="" fill className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-brand-muted">
                      <ImagePlaceholderIcon className="h-6 w-6" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
                    {produit.nouvelles_activites > 0 ? (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {produit.nouvelles_activites}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-brand-muted">
                    <CashIcon className="h-3.5 w-3.5" />
                    {produit.statistiques.recues} reçues · {produit.statistiques.livrees} livrées · {produit.statistiques.annulees} annulées
                  </p>
                  {produit.derniere_activite ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-brand-muted">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      Dernière activité : {formaterDate(produit.derniere_activite)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-brand-ink">Activité du Coordinateur</h2>
          {coordinateurs && coordinateurs.length > 1 ? (
            <select
              value={coordinateurId ?? ""}
              onChange={(e) => setCoordinateurId(Number(e.target.value))}
              className="rounded-full border border-brand-line bg-white px-4 py-2 text-xs font-semibold text-brand-ink outline-none"
            >
              {coordinateurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom ? `${c.prenom} ` : ""}
                  {c.nom}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {coordinateurs !== null && coordinateurs.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">Aucun compte coordinateur pour l&apos;instant.</p>
        ) : activites === null ? (
          <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
        ) : activites.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">Aucune activité enregistrée pour ce coordinateur.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {activites.map((activite) => (
              <div key={activite.id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
                <div>
                  <p className="font-semibold text-brand-ink">{activite.details ?? activite.action}</p>
                  {activite.entite_concernee ? <p className="text-xs text-brand-muted">{activite.entite_concernee}</p> : null}
                </div>
                <span className="shrink-0 text-xs text-brand-muted">{formaterDateHeure(activite.date_heure)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
