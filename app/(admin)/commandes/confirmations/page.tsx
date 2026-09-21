"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDateHeure, formaterPrix, type ConfirmationSuivi, type ReponseConfirmations } from "@/lib/types";
import { ChevronLeftIcon, SearchIcon, ShieldCheckIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

type Onglet = "toutes" | "en_attente" | "confirme" | "echoue" | "anomalie";

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "toutes", label: "Toutes" },
  { id: "confirme", label: "Payées" },
  { id: "en_attente", label: "En attente de Wave" },
  { id: "echoue", label: "Échouées" },
  { id: "anomalie", label: "Anomalies" },
];

const LIBELLE_SOURCE = { whatsapp: "lien", qr: "QR" } as const;

function Statut({ c }: { c: ConfirmationSuivi }) {
  if (c.anomalie) return <span className="inline-block whitespace-nowrap rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">Payée — commande impossible</span>;
  if (c.statut === "confirme") return <span className="inline-block whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Payée</span>;
  if (c.statut === "echoue") return <span className="inline-block whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">Échouée</span>;
  return <span className="inline-block whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">En attente de Wave</span>;
}

/**
 * Suivi des paiements de confirmation (GET /admin/confirmations) : l'acheteur de la page
 * publique règle d'abord 200 F sur Wave (non remboursables) ; la commande n'existe qu'une
 * fois ce paiement confirmé. Ici, tout ce qui précède la commande — paiements en attente,
 * échoués ou abandonnés — et les anomalies : payé, mais commande impossible à créer (stock
 * épuisé entre-temps), à traiter en rappelant l'acheteur. Le suivi de la commande elle-même,
 * jusqu'à la livraison, se fait dans l'onglet Commandes.
 */
export default function ConfirmationsPage() {
  const { token } = useAuth();
  const [onglet, setOnglet] = useState<Onglet>("toutes");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [reponse, setReponse] = useState<ReponseConfirmations | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    const params = new URLSearchParams({ per_page: "25", page: String(page) });
    if (onglet !== "toutes") params.set("statut", onglet);
    if (recherche) params.set("q", recherche);

    apiFetch<ReponseConfirmations>(`/admin/confirmations?${params}`, { token })
      .then((donnees) => {
        if (annule) return;
        setReponse(donnees);
        setErreur(false);
      })
      .catch(() => {
        if (!annule) setErreur(true);
      });
    return () => {
      annule = true;
    };
  }, [token, onglet, recherche, page]);

  const stats = reponse?.stats;
  const liste = reponse?.confirmations ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Confirmations"
        description="Paiements de confirmation (Wave, non remboursables) des commandes passées sur la page acheteur."
        icone={ShieldCheckIcon}
        action={
          <Link href="/commandes" className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm">
            <ChevronLeftIcon className="h-4 w-4" />
            Commandes
          </Link>
        }
        stats={[
          { valeur: stats ? stats.confirme : "—", label: "Payées" },
          { valeur: stats ? stats.en_attente : "—", label: "En attente" },
          { valeur: stats ? stats.echoue : "—", label: "Échouées" },
          { valeur: stats ? stats.anomalie : "—", label: "Anomalies" },
          { valeur: stats ? `${formaterPrix(stats.encaisse)} F` : "—", label: "Encaissé" },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setOnglet(o.id);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                onglet === o.id ? "bg-brand-ink text-white" : "border border-brand-line bg-white text-brand-muted"
              }`}
            >
              {o.label}
              {stats && o.id !== "toutes" ? ` (${stats[o.id]})` : ""}
            </button>
          ))}
        </div>

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
            placeholder="N° de commande, nom, téléphone…"
            className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none"
          />
        </form>
      </div>

      {erreur ? <p className="text-center text-sm text-red-500">Impossible de charger les confirmations.</p> : null}

      {liste === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : liste.data.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune confirmation ne correspond.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-brand-muted">
                <tr>
                  <th className="px-3 py-3">Ouverte le</th>
                  <th className="px-3 py-3">Acheteur</th>
                  <th className="px-3 py-3">Produit</th>
                  <th className="px-3 py-3">Vendeur</th>
                  <th className="px-3 py-3 text-right">Confirmation</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3 text-right">Commande</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                {liste.data.map((c) => (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-brand-muted">
                      {formaterDateHeure(c.date)}
                      {c.date_paiement ? <p className="text-emerald-600">payée {formaterDateHeure(c.date_paiement)}</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-brand-ink">{c.client || "Acheteur"}</p>
                      <p className="text-xs text-brand-muted">{c.client_telephone}</p>
                    </td>
                    <td className="min-w-[8.5rem] px-3 py-3 text-brand-ink">
                      {c.quantite > 1 ? `${c.quantite} × ` : ""}
                      {c.nom_produit ?? "—"}
                      {c.localite ? <p className="text-xs text-brand-muted">Livraison : {c.localite}</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-brand-ink">{c.vendeur ?? "—"}</p>
                      <p className="text-xs text-brand-muted">{LIBELLE_SOURCE[c.source]}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-extrabold text-brand-ink">{formaterPrix(c.montant)} F</td>
                    <td className="px-3 py-3">
                      <Statut c={c} />
                      {c.anomalie && c.erreur ? <p className="mt-1 max-w-[16rem] text-[11px] text-red-600">{c.erreur} — rappeler l&apos;acheteur.</p> : null}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {c.commande_id ? (
                        <Link href={`/clients/commandes/${c.commande_id}`} className="font-bold text-[color:var(--brand-blue-end)] hover:underline">
                          n°{c.commande_id}
                        </Link>
                      ) : (
                        <span className="text-xs text-brand-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {liste.last_page > 1 ? (
            <div className="flex items-center justify-center gap-3 text-xs font-semibold text-brand-muted">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-full border border-brand-line bg-white px-4 py-2 disabled:opacity-40">
                Précédent
              </button>
              <span>
                Page {liste.current_page} / {liste.last_page} · {liste.total} confirmations
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
