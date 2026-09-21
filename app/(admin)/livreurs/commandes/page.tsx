"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError, apiFetch } from "@/lib/api";
import {
  formaterDate,
  formaterPrix,
  type ReponseCommandesBoutiqueAdmin,
  type SourceVenteBoutiqueAdmin,
  type StatutVenteBoutiqueAdmin,
} from "@/lib/types";
import { BagIcon, CheckIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS: { id: StatutVenteBoutiqueAdmin | "tous"; label: string }[] = [
  { id: "en_attente", label: "À valider" },
  { id: "en_cours", label: "En cours" },
  { id: "livree", label: "Livrées" },
  { id: "annulee", label: "Annulées" },
  { id: "tous", label: "Toutes" },
];

const SOURCES: { id: SourceVenteBoutiqueAdmin | "toutes"; label: string }[] = [
  { id: "toutes", label: "Toutes les sources" },
  { id: "manuelle", label: "Commande manuelle" },
  { id: "whatsapp", label: "Lien" },
  { id: "qr", label: "QR" },
];

const LIBELLE_SOURCE: Record<SourceVenteBoutiqueAdmin, string> = { manuelle: "Manuelle", whatsapp: "Lien", qr: "QR" };

const STYLE_STATUT: Record<StatutVenteBoutiqueAdmin, { classe: string; libelle: string }> = {
  en_attente: { classe: "bg-amber-50 text-amber-700", libelle: "À valider" },
  en_cours: { classe: "bg-blue-50 text-blue-700", libelle: "En cours" },
  livree: { classe: "bg-emerald-50 text-emerald-700", libelle: "Livrée" },
  annulee: { classe: "bg-red-50 text-red-600", libelle: "Annulée" },
};

/**
 * Commandes apportées par les livreurs (Boutique) — GET /admin/boutique/commandes.
 * Ce sont des commandes ordinaires : "Valider" passe la commande à "validée"
 * (PATCH /admin/commandes/{id}/statut, comme depuis la fiche commande) et c'est
 * précisément ce qui rend la commission acquise au livreur. Le détail complet
 * (paiement, livraison, autres statuts) reste sur la fiche de la commande.
 */
export default function CommandesBoutiquePage() {
  const { token } = useAuth();
  const [onglet, setOnglet] = useState<StatutVenteBoutiqueAdmin | "tous">("en_attente");
  const [source, setSource] = useState<SourceVenteBoutiqueAdmin | "toutes">("toutes");
  const [reponse, setReponse] = useState<ReponseCommandesBoutiqueAdmin | null>(null);
  const [erreur, setErreur] = useState(false);
  const [aConfirmer, setAConfirmer] = useState<number | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(
    (jeton: string, annule: () => boolean = () => false) => {
      const params = new URLSearchParams({ per_page: "50" });
      if (onglet !== "tous") params.set("statut", onglet);
      if (source !== "toutes") params.set("source", source);

      return apiFetch<ReponseCommandesBoutiqueAdmin>(`/admin/boutique/commandes?${params}`, { token: jeton })
        .then((donnees) => {
          if (annule()) return;
          setReponse(donnees);
          setErreur(false);
        })
        .catch(() => {
          if (!annule()) setErreur(true);
        });
    },
    [onglet, source]
  );

  useEffect(() => {
    if (!token) return;
    let annule = false;
    charger(token, () => annule);
    return () => {
      annule = true;
    };
  }, [token, charger]);

  async function valider(commandeId: number, livreur: string, commission: number) {
    if (!token) return;
    setEnCours(commandeId);
    setMessage(null);
    try {
      await apiFetch(`/admin/commandes/${commandeId}/statut`, { method: "PATCH", token, body: { statut_commande: "validee" } });
      setMessage(`Commande n°${commandeId} validée — ${formaterPrix(commission)} F de commission acquis par ${livreur}.`);
      setAConfirmer(null);
      await charger(token);
    } catch (e) {
      setMessage(e instanceof ApiRequestError ? e.message : "Impossible de valider la commande.");
    } finally {
      setEnCours(null);
    }
  }

  const stats = reponse?.stats;
  const lignes = reponse?.commandes.data ?? null;
  const total = stats ? Object.values(stats.par_statut).reduce((a, b) => a + b, 0) : "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Commandes boutique"
        description="Ventes apportées par les livreurs — valider une commande leur acquiert la commission."
        icone={BagIcon}
        stats={[
          { valeur: stats ? `${stats.par_statut.en_attente} · ${formaterPrix(stats.commission_a_valider)} F` : "—", label: "À valider (commission)" },
          { valeur: stats ? `${formaterPrix(stats.commission_acquise)} F` : "—", label: "Commission acquise" },
          { valeur: total, label: "Commandes" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
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
              {o.id !== "tous" && stats ? ` (${stats.par_statut[o.id]})` : ""}
            </button>
          ))}
        </div>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value as SourceVenteBoutiqueAdmin | "toutes")}
          aria-label="Filtrer par source"
          className="rounded-full border border-brand-line bg-white px-4 py-2 text-xs font-semibold text-brand-ink outline-none"
        >
          {SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {message ? <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-[color:var(--brand-blue-end)]">{message}</p> : null}
      {erreur ? <p className="text-center text-sm text-red-500">Impossible de charger les commandes.</p> : null}

      {lignes === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : lignes.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune commande dans cette catégorie.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-brand-muted">
              <tr>
                <th className="px-3 py-3">Commande</th>
                <th className="px-3 py-3">Livreur vendeur</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Produit</th>
                <th className="px-3 py-3 text-right">Prix</th>
                <th className="px-3 py-3 text-right">Commission</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Statut</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {lignes.map((c) => {
                const statut = STYLE_STATUT[c.statut];
                return (
                  <tr key={c.id}>
                    <td className="px-3 py-3">
                      <Link href={`/clients/commandes/${c.commande_id}`} className="font-bold text-[color:var(--brand-blue-end)] hover:underline">
                        n°{c.commande_id}
                      </Link>
                      <p className="text-xs text-brand-muted">{formaterDate(c.date)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/livreurs/${c.livreur_id}`} className="font-semibold text-brand-ink hover:underline">
                        {c.livreur || "Livreur"}
                      </Link>
                      <p className="text-xs text-brand-muted">{c.livreur_telephone}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-brand-ink">{c.client || "Client"}</p>
                      <p className="text-xs text-brand-muted">{c.client_telephone}</p>
                    </td>
                    <td className="min-w-[8.5rem] px-3 py-3 text-brand-ink">{c.nom_produit ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-brand-ink">{formaterPrix(c.prix_vente)} F</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-extrabold text-orange-500">+{formaterPrix(c.commission)} F</td>
                    <td className="px-3 py-3 text-xs text-brand-muted">{LIBELLE_SOURCE[c.source]}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${statut.classe}`}>{statut.libelle}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {c.statut === "en_attente" ? (
                        aConfirmer === c.commande_id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => valider(c.commande_id, c.livreur, c.commission)}
                              disabled={enCours === c.commande_id}
                              className="bg-gradient-brand-blue rounded-full px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60"
                            >
                              {enCours === c.commande_id ? "…" : "Confirmer"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAConfirmer(null)}
                              className="rounded-full border border-brand-line px-3.5 py-2 text-xs font-semibold text-brand-muted"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAConfirmer(c.commande_id)}
                            className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-line px-3.5 py-2 text-xs font-semibold text-brand-ink"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Valider
                          </button>
                        )
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
