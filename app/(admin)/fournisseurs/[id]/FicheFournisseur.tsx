"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  formaterDate,
  formaterPrix,
  type FournisseurDetailAdmin,
  type Pagination,
  type PortefeuilleFournisseurAdmin,
  type StatistiquesFournisseurAdmin,
} from "@/lib/types";
import { ChevronLeftIcon, FournisseursIcon, MailIcon, PhoneIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

type CommandeFournisseur = {
  commande_id: number;
  nom_produit: string | null;
  nom_client: string;
  statut: string;
  derniere_action: string;
};

const ONGLETS = [
  { id: "apercu", label: "Aperçu" },
  { id: "commandes", label: "Commandes" },
  { id: "portefeuille", label: "Portefeuille" },
] as const;

export function FicheFournisseur({ fournisseurId }: { fournisseurId: number }) {
  const { token } = useAuth();
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("apercu");

  const [detail, setDetail] = useState<FournisseurDetailAdmin | null>(null);
  const [ventes, setVentes] = useState<StatistiquesFournisseurAdmin | null>(null);
  const [commandes, setCommandes] = useState<CommandeFournisseur[] | null>(null);
  const [portefeuille, setPortefeuille] = useState<PortefeuilleFournisseurAdmin | null>(null);
  const [referencePaiement, setReferencePaiement] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<FournisseurDetailAdmin>(`/fournisseurs/${fournisseurId}`, { token }),
      apiFetch<StatistiquesFournisseurAdmin>(`/fournisseurs/${fournisseurId}/statistiques?periode=tout`, { token }),
    ]).then(([d, s]) => {
      setDetail(d);
      setVentes(s);
    });
  }, [token, fournisseurId]);

  useEffect(() => {
    if (!token || onglet !== "commandes" || commandes !== null) return;
    apiFetch<{ commandes: Pagination<CommandeFournisseur> }>(`/fournisseurs/${fournisseurId}/commandes?per_page=50`, { token }).then(
      (r) => setCommandes(r.commandes.data)
    );
  }, [token, onglet, commandes, fournisseurId]);

  useEffect(() => {
    if (!token || onglet !== "portefeuille" || portefeuille !== null) return;
    apiFetch<PortefeuilleFournisseurAdmin>(`/fournisseurs/${fournisseurId}/portefeuille?periode=tout`, { token }).then(setPortefeuille);
  }, [token, onglet, portefeuille, fournisseurId]);

  async function payerTout() {
    if (!token || !referencePaiement.trim() || enCours) return;
    setEnCours(true);
    try {
      await apiFetch(`/fournisseurs/${fournisseurId}/portefeuille/payer-tout`, {
        method: "POST",
        token,
        body: { reference_paiement: referencePaiement.trim() },
      });
      setReferencePaiement("");
      setPortefeuille(null);
      apiFetch<PortefeuilleFournisseurAdmin>(`/fournisseurs/${fournisseurId}/portefeuille?periode=tout`, { token }).then(setPortefeuille);
    } finally {
      setEnCours(false);
    }
  }

  const fournisseur = detail?.fournisseur;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/fournisseurs" className="flex items-center gap-1 text-sm font-semibold text-brand-muted">
        <ChevronLeftIcon className="h-4 w-4" /> Retour aux fournisseurs
      </Link>

      <PageHero
        titre={fournisseur?.nom_entreprise ?? "Fournisseur"}
        description={fournisseur?.zone_couverte ?? undefined}
        icone={FournisseursIcon}
        stats={
          detail
            ? [
                { valeur: detail.statistiques.produits_total, label: "Produits" },
                { valeur: detail.statistiques.commandes_recues, label: "Commandes reçues" },
                { valeur: detail.statistiques.commandes_livrees, label: "Livrées" },
                { valeur: detail.statistiques.commandes_annulees, label: "Annulées" },
              ]
            : []
        }
      />

      {fournisseur ? (
        <div className="flex flex-wrap gap-4 rounded-2xl border border-brand-line bg-white p-4 text-sm text-brand-muted">
          {fournisseur.contact_pro ? (
            <span className="flex items-center gap-1.5">
              <PhoneIcon className="h-4 w-4" /> {fournisseur.contact_pro}
            </span>
          ) : null}
          {fournisseur.user.email ? (
            <span className="flex items-center gap-1.5">
              <MailIcon className="h-4 w-4" /> {fournisseur.user.email}
            </span>
          ) : null}
          {fournisseur.nom_gerant ? <span>Gérant : {fournisseur.nom_gerant}</span> : null}
        </div>
      ) : null}

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

      {onglet === "apercu" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{ventes ? `${formaterPrix(ventes.chiffre_affaires)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Chiffre d&apos;affaires</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{ventes ? `${formaterPrix(ventes.commission_ordispace)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Commission OrdiSpace</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{ventes?.produits_vendus ?? "—"}</p>
              <p className="text-xs text-brand-muted">Produits vendus</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{ventes?.produits_distincts_vendus ?? "—"}</p>
              <p className="text-xs text-brand-muted">Références distinctes</p>
            </div>
          </div>

          {ventes && ventes.produits_plus_vendus.length > 0 ? (
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="mb-3 text-sm font-bold text-brand-ink">Produits les plus vendus</p>
              <div className="flex flex-col gap-2">
                {ventes.produits_plus_vendus.map((p) => (
                  <div key={p.produit_id} className="flex items-center justify-between text-sm">
                    <span className="text-brand-ink">{p.nom_produit ?? `Produit #${p.produit_id}`}</span>
                    <span className="text-brand-muted">
                      {p.quantite_vendue} vendus · {formaterPrix(p.montant)} CFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {onglet === "commandes" ? (
        <div className="flex flex-col gap-2">
          {commandes === null ? (
            <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
          ) : commandes.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">Aucune commande.</p>
          ) : (
            commandes.map((c) => (
              <div key={c.commande_id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
                <div>
                  <p className="font-bold text-brand-ink">{c.nom_produit ?? `Commande #${c.commande_id}`}</p>
                  <p className="text-xs text-brand-muted">{c.nom_client}</p>
                </div>
                <span className="text-xs text-brand-muted">{c.statut}</span>
              </div>
            ))
          )}
        </div>
      ) : null}

      {onglet === "portefeuille" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{portefeuille ? `${formaterPrix(portefeuille.solde)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Solde</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">
                {portefeuille ? `${formaterPrix(portefeuille.total_en_attente)} CFA` : "—"}
              </p>
              <p className="text-xs text-brand-muted">En attente de paiement</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{portefeuille ? `${portefeuille.taux_commission}%` : "—"}</p>
              <p className="text-xs text-brand-muted">Taux de commission</p>
            </div>
          </div>

          {portefeuille && portefeuille.total_en_attente > 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4">
              <input
                value={referencePaiement}
                onChange={(e) => setReferencePaiement(e.target.value)}
                placeholder="Référence du paiement"
                className="flex-1 rounded-full border border-brand-line px-4 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={payerTout}
                disabled={!referencePaiement.trim() || enCours}
                className="rounded-full bg-brand-ink px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {enCours ? "Paiement…" : "Payer tout"}
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {portefeuille === null ? (
              <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
            ) : portefeuille.transactions.data.length === 0 ? (
              <p className="py-10 text-center text-sm text-brand-muted">Aucune transaction.</p>
            ) : (
              portefeuille.transactions.data.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
                  <div>
                    <p className="font-bold text-brand-ink">{t.nom_produit ?? "Vente"}</p>
                    <p className="text-xs text-brand-muted">{formaterDate(t.date_transaction)}</p>
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
        </div>
      ) : null}
    </div>
  );
}
