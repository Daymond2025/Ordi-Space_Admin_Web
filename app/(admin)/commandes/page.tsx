"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError, apiFetch } from "@/lib/api";
import {
  formaterDate,
  formaterPrix,
  type CommandeCentrale,
  type ReponseCommandesCentrales,
  type StatutCommandeCentrale,
} from "@/lib/types";
import { BagIcon, CheckIcon, SearchIcon, ShieldCheckIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS: { id: StatutCommandeCentrale | "toutes"; label: string }[] = [
  { id: "en_attente", label: "À valider" },
  { id: "validee", label: "Validées" },
  { id: "en_preparation", label: "En préparation" },
  { id: "en_livraison", label: "En livraison" },
  { id: "livree", label: "Livrées" },
  { id: "annulee", label: "Annulées" },
  { id: "toutes", label: "Toutes" },
];

const ORIGINES: { id: "toutes" | "boutique" | "directe"; label: string }[] = [
  { id: "toutes", label: "Toutes les origines" },
  { id: "boutique", label: "Boutique des livreurs" },
  { id: "directe", label: "Directes (app, commerciaux…)" },
];

const STYLE_STATUT: Record<StatutCommandeCentrale, { classe: string; libelle: string }> = {
  en_attente: { classe: "bg-amber-50 text-amber-700", libelle: "À valider" },
  validee: { classe: "bg-sky-50 text-sky-700", libelle: "Validée" },
  en_preparation: { classe: "bg-indigo-50 text-indigo-700", libelle: "En préparation" },
  en_livraison: { classe: "bg-blue-50 text-blue-700", libelle: "En livraison" },
  livree: { classe: "bg-emerald-50 text-emerald-700", libelle: "Livrée" },
  annulee: { classe: "bg-red-50 text-red-600", libelle: "Annulée" },
  reportee: { classe: "bg-orange-50 text-orange-700", libelle: "Reportée" },
  client_injoignable: { classe: "bg-orange-50 text-orange-700", libelle: "Client injoignable" },
  numero_incorrect: { classe: "bg-orange-50 text-orange-700", libelle: "Numéro incorrect" },
};

const LIBELLE_SOURCE = { manuelle: "commande manuelle", whatsapp: "lien", qr: "QR" } as const;

/** "Boutique · Jean M. (QR)" ou le canal de vente pour les commandes directes. */
function libelleOrigine(c: CommandeCentrale): { titre: string; detail: string | null } {
  if (c.origine === "boutique") {
    return { titre: c.vendeur || "Livreur", detail: c.source ? `Boutique · ${LIBELLE_SOURCE[c.source]}` : "Boutique" };
  }
  return { titre: c.canal ?? "Directe", detail: null };
}

/**
 * Onglet "Commandes" — toutes les commandes de la plateforme au même endroit
 * (GET /admin/commandes), quelle que soit leur origine : app client, commercial,
 * Espace Coordinateur, ou un livreur (commande manuelle, lien, vitrine, QR
 * de l'affiche — donc aussi ce que l'acheteur commande sur la page publique).
 * "Valider" passe la commande à "validée" (PATCH /admin/commandes/{id}/statut,
 * comme depuis sa fiche) ; le reste du suivi se fait sur la fiche.
 */
export default function CommandesPage() {
  const { token } = useAuth();
  const [onglet, setOnglet] = useState<StatutCommandeCentrale | "toutes">("en_attente");
  const [origine, setOrigine] = useState<"toutes" | "boutique" | "directe">("toutes");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [reponse, setReponse] = useState<ReponseCommandesCentrales | null>(null);
  const [erreur, setErreur] = useState(false);
  const [aConfirmer, setAConfirmer] = useState<number | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(
    (jeton: string, annule: () => boolean = () => false) => {
      const params = new URLSearchParams({ per_page: "25", page: String(page) });
      if (onglet !== "toutes") params.set("statut", onglet);
      if (origine !== "toutes") params.set("origine", origine);
      if (recherche) params.set("q", recherche);

      return apiFetch<ReponseCommandesCentrales>(`/admin/commandes?${params}`, { token: jeton })
        .then((donnees) => {
          if (annule()) return;
          setReponse(donnees);
          setErreur(false);
        })
        .catch(() => {
          if (!annule()) setErreur(true);
        });
    },
    [onglet, origine, recherche, page]
  );

  useEffect(() => {
    if (!token) return;
    let annule = false;
    charger(token, () => annule);
    return () => {
      annule = true;
    };
  }, [token, charger]);

  // Chaque changement de filtre repart de la première page.
  function choisirOnglet(o: StatutCommandeCentrale | "toutes") {
    setOnglet(o);
    setPage(1);
  }

  async function valider(commande: CommandeCentrale) {
    if (!token) return;
    setEnCours(commande.id);
    setMessage(null);
    try {
      await apiFetch(`/admin/commandes/${commande.id}/statut`, { method: "PATCH", token, body: { statut_commande: "validee" } });
      setMessage(`Commande n°${commande.id} validée.`);
      setAConfirmer(null);
      await charger(token);
    } catch (e) {
      setMessage(e instanceof ApiRequestError ? e.message : "Impossible de valider la commande.");
    } finally {
      setEnCours(null);
    }
  }

  const stats = reponse?.stats;
  const liste = reponse?.commandes ?? null;
  const parStatut = stats?.par_statut;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Commandes"
        description="Toutes les commandes de la plateforme, quelle que soit leur origine."
        icone={BagIcon}
        action={
          <Link
            href="/commandes/confirmations"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            Confirmations
          </Link>
        }
        stats={[
          { valeur: parStatut ? parStatut.en_attente : "—", label: "À valider" },
          { valeur: parStatut ? parStatut.validee + parStatut.en_preparation + parStatut.en_livraison : "—", label: "En traitement" },
          { valeur: parStatut ? parStatut.livree : "—", label: "Livrées" },
          { valeur: stats ? stats.total : "—", label: "Total" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => choisirOnglet(o.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                onglet === o.id ? "bg-brand-ink text-white" : "border border-brand-line bg-white text-brand-muted"
              }`}
            >
              {o.label}
              {o.id !== "toutes" && parStatut ? ` (${parStatut[o.id]})` : ""}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={origine}
            onChange={(e) => {
              setOrigine(e.target.value as typeof origine);
              setPage(1);
            }}
            aria-label="Filtrer par origine"
            className="rounded-full border border-brand-line bg-white px-4 py-2.5 text-xs font-semibold text-brand-ink outline-none"
          >
            {ORIGINES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRecherche(saisie.trim());
              setPage(1);
            }}
            className="relative w-64"
          >
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              placeholder="N°, client, téléphone, produit…"
              className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none"
            />
          </form>
        </div>
      </div>

      {message ? <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-[color:var(--brand-blue-end)]">{message}</p> : null}
      {erreur ? <p className="text-center text-sm text-red-500">Impossible de charger les commandes.</p> : null}

      {liste === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : liste.data.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune commande ne correspond.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-brand-muted">
                <tr>
                  <th className="px-3 py-3">Commande</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3 text-right">Total à payer</th>
                  <th className="px-3 py-3">Origine</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                {liste.data.map((c) => {
                  const statut = STYLE_STATUT[c.statut_commande] ?? { classe: "bg-slate-100 text-slate-500", libelle: c.statut_commande };
                  const orig = libelleOrigine(c);
                  return (
                    <tr key={c.id}>
                      <td className="px-3 py-3">
                        <Link href={`/clients/commandes/${c.id}`} className="font-bold text-[color:var(--brand-blue-end)] hover:underline">
                          n°{c.id}
                        </Link>
                        <p className="text-xs text-brand-muted">{formaterDate(c.date)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-brand-ink">{c.client || "Client"}</p>
                        <p className="text-xs text-brand-muted">{c.client_telephone}</p>
                      </td>
                      <td className="min-w-[8.5rem] px-3 py-3 text-brand-ink">
                        {c.nom_produit ?? "—"}
                        {c.nombre_lignes > 1 ? <span className="text-xs text-brand-muted"> +{c.nombre_lignes - 1}</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <p className="font-extrabold text-brand-ink">{formaterPrix(c.total_a_payer)} F</p>
                        {c.confirmation && c.confirmation.statut === "confirme" ? (
                          <>
                            <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <ShieldCheckIcon className="h-3 w-3" />
                              Confirmation {formaterPrix(c.confirmation.montant)} F payée
                            </p>
                            <p className="mt-0.5 text-[11px] text-brand-muted">Reliquat : {formaterPrix(c.reliquat)} F</p>
                          </>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        {c.origine === "boutique" && c.vendeur_id ? (
                          <Link href={`/livreurs/${c.vendeur_id}`} className="font-semibold text-brand-ink hover:underline">
                            {orig.titre}
                          </Link>
                        ) : (
                          <p className="font-semibold text-brand-ink">{orig.titre}</p>
                        )}
                        {orig.detail ? <p className="text-xs text-brand-muted">{orig.detail}</p> : null}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${statut.classe}`}>{statut.libelle}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {c.statut_commande === "en_attente" ? (
                          aConfirmer === c.id ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => valider(c)}
                                disabled={enCours === c.id}
                                className="bg-gradient-brand-blue rounded-full px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-60"
                              >
                                {enCours === c.id ? "…" : "Confirmer"}
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
                              onClick={() => setAConfirmer(c.id)}
                              className="ml-auto flex items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-line px-3.5 py-2 text-xs font-semibold text-brand-ink"
                            >
                              <CheckIcon className="h-3.5 w-3.5" />
                              Valider
                            </button>
                          )
                        ) : (
                          <Link href={`/clients/commandes/${c.id}`} className="text-xs font-semibold text-brand-muted hover:underline">
                            Détails
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {liste.last_page > 1 ? (
            <div className="flex items-center justify-center gap-3 text-xs font-semibold text-brand-muted">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full border border-brand-line bg-white px-4 py-2 disabled:opacity-40"
              >
                Précédent
              </button>
              <span>
                Page {liste.current_page} / {liste.last_page} · {liste.total} commandes
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(liste.last_page, p + 1))}
                disabled={page >= liste.last_page}
                className="rounded-full border border-brand-line bg-white px-4 py-2 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
