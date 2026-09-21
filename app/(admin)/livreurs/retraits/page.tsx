"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { formaterDateHeure, formaterPrix, type RetraitAdmin, type ReponseRetraitsAdmin, type StatutRetraitAdmin } from "@/lib/types";
import { CheckIcon, FinanceIcon, XIcon } from "@/components/icons";
import { ModalSaisie } from "@/components/ModalSaisie";
import { PageHero } from "@/components/PageHero";

const ONGLETS: { id: StatutRetraitAdmin | "tous"; label: string }[] = [
  { id: "en_attente", label: "En attente" },
  { id: "valide", label: "Payés" },
  { id: "refuse", label: "Refusés" },
  { id: "annule", label: "Annulés" },
  { id: "tous", label: "Tous" },
];

const STYLE_STATUT: Record<StatutRetraitAdmin, { classe: string; libelle: string }> = {
  en_attente: { classe: "bg-amber-50 text-amber-700", libelle: "En attente" },
  valide: { classe: "bg-emerald-50 text-emerald-700", libelle: "Payé" },
  refuse: { classe: "bg-red-50 text-red-600", libelle: "Refusé" },
  annule: { classe: "bg-slate-100 text-slate-500", libelle: "Annulé" },
};

const NOM_OPERATEUR: Record<string, string> = { Orange: "Orange Money", Wave: "Wave", Mtn: "MTN Mobile Money", Moov: "Moov Money" };

type Action = { type: "valider" | "refuser"; retrait: RetraitAdmin };

/**
 * Retraits de commissions des livreurs (GET /admin/retraits). Le livreur
 * demande, l'Admin envoie l'argent HORS de l'application (Mobile Money) puis
 * clique "Marquer comme payé" en saisissant la référence du transfert — ou
 * "Refuser" avec un motif : le montant redevient alors disponible pour le
 * livreur, qui est notifié dans les deux cas.
 */
export default function RetraitsLivreursPage() {
  const { token } = useAuth();
  const [onglet, setOnglet] = useState<StatutRetraitAdmin | "tous">("en_attente");
  const [reponse, setReponse] = useState<ReponseRetraitsAdmin | null>(null);
  const [erreur, setErreur] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(
    (jeton: string, annule: () => boolean = () => false) => {
      const params = new URLSearchParams({ per_page: "50" });
      if (onglet !== "tous") params.set("statut", onglet);

      return apiFetch<ReponseRetraitsAdmin>(`/admin/retraits?${params}`, { token: jeton })
        .then((donnees) => {
          if (annule()) return;
          setReponse(donnees);
          setErreur(false);
        })
        .catch(() => {
          if (!annule()) setErreur(true);
        });
    },
    [onglet]
  );

  useEffect(() => {
    if (!token) return;
    let annule = false;
    charger(token, () => annule);
    return () => {
      annule = true;
    };
  }, [token, charger]);

  /** Renvoie le message d'erreur à afficher dans la boîte, ou rien quand tout est passé. */
  async function confirmer(valeur: string): Promise<string | void> {
    if (!token || !action) return;
    const corps = action.type === "valider" ? { reference: valeur } : { remarque: valeur };
    try {
      await apiFetch(`/admin/retraits/${action.retrait.id}/${action.type === "valider" ? "valider" : "refuser"}`, {
        method: "POST",
        token,
        body: corps,
      });
    } catch (e) {
      return e instanceof ApiRequestError ? e.message : "Impossible de traiter cette demande.";
    }
    setMessage(
      action.type === "valider"
        ? `Retrait de ${formaterPrix(action.retrait.montant)} FCFA marqué comme payé — ${action.retrait.livreur} a été notifié.`
        : `Retrait refusé — ${action.retrait.livreur} a été notifié et son montant est de nouveau disponible.`
    );
    setAction(null);
    await charger(token);
  }

  const stats = reponse?.stats;
  const retraits = reponse?.retraits.data ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Retraits des livreurs"
        description="Commissions de la Boutique à reverser par Mobile Money."
        icone={FinanceIcon}
        stats={[
          { valeur: stats ? `${stats.en_attente.nombre} · ${formaterPrix(stats.en_attente.montant)} F` : "—", label: "À payer" },
          { valeur: stats ? `${formaterPrix(stats.valide.montant)} F` : "—", label: "Déjà payé" },
          { valeur: stats ? stats.refuse.nombre : "—", label: "Refusés" },
        ]}
      />

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
            {o.id !== "tous" && stats ? ` (${stats[o.id].nombre})` : ""}
          </button>
        ))}
      </div>

      {message ? <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-[color:var(--brand-blue-end)]">{message}</p> : null}
      {erreur ? <p className="text-center text-sm text-red-500">Impossible de charger les retraits.</p> : null}

      {retraits === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : retraits.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune demande dans cette catégorie.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-brand-muted">
              <tr>
                <th className="px-4 py-3">Livreur</th>
                <th className="px-4 py-3">Envoyer à</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Demandé le</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {retraits.map((r) => {
                const statut = STYLE_STATUT[r.statut];
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-brand-ink">{r.livreur || "Livreur"}</p>
                      <p className="text-xs text-brand-muted">{r.livreur_telephone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-ink">{NOM_OPERATEUR[r.operateur] ?? r.operateur}</p>
                      <p className="text-xs text-brand-muted">{r.telephone}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold text-brand-ink">{formaterPrix(r.montant)} F</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-brand-muted">{formaterDateHeure(r.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${statut.classe}`}>{statut.libelle}</span>
                      {r.statut === "valide" && r.reference ? <p className="mt-1 text-[11px] text-emerald-700">Réf : {r.reference}</p> : null}
                      {r.statut === "refuse" && r.remarque ? <p className="mt-1 max-w-[16rem] text-[11px] text-red-600">{r.remarque}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.statut === "en_attente" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setAction({ type: "valider", retrait: r })}
                            className="bg-gradient-brand-blue flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold text-white"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Marquer payé
                          </button>
                          <button
                            type="button"
                            onClick={() => setAction({ type: "refuser", retrait: r })}
                            className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-500"
                          >
                            <XIcon className="h-3.5 w-3.5" />
                            Refuser
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {action ? (
        <ModalSaisie
          titre={action.type === "valider" ? "Marquer le retrait comme payé" : "Refuser le retrait"}
          resume={
            <>
              <p className="font-bold">
                {formaterPrix(action.retrait.montant)} FCFA → {NOM_OPERATEUR[action.retrait.operateur] ?? action.retrait.operateur}
              </p>
              <p className="text-xs text-brand-muted">
                {action.retrait.livreur} · {action.retrait.telephone}
              </p>
            </>
          }
          libelle={action.type === "valider" ? "Référence du transfert" : "Motif du refus (visible par le livreur)"}
          placeholder={action.type === "valider" ? "Ex. OM-260920-48213" : "Ex. Numéro incorrect, merci de renvoyer la demande"}
          confirmer={action.type === "valider" ? "Confirmer le paiement" : "Refuser la demande"}
          danger={action.type === "refuser"}
          onConfirmer={confirmer}
          onFermer={() => setAction(null)}
        />
      ) : null}
    </div>
  );
}
