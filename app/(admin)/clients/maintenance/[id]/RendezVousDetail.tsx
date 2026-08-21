"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterDateHeure, formaterPrix, LIBELLE_STATUT_INTERVENTION, type RendezVous, type StatutIntervention } from "@/lib/types";
import { ChevronLeftIcon, UserAvatarIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";

const STATUTS: StatutIntervention[] = ["planifiee", "en_cours", "terminee", "annulee"];

export function RendezVousDetail({ id }: { id: string }) {
  const { token } = useAuth();
  const [rdv, setRdv] = useState<RendezVous | null | undefined>(undefined);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const [diagnostic, setDiagnostic] = useState("");
  const [reparation, setReparation] = useState("");
  const [statutIntervention, setStatutIntervention] = useState<StatutIntervention>("planifiee");
  const [cout, setCout] = useState("");

  function recharger() {
    if (!token) return;
    apiFetch<RendezVous>(`/sav/rendez-vous/${id}`, { token })
      .then((r) => {
        setRdv(r);
        if (r.intervention) {
          setDiagnostic(r.intervention.diagnostic ?? "");
          setReparation(r.intervention.reparation_effectuee ?? "");
          setStatutIntervention(r.intervention.statut_intervention);
          setCout(r.intervention.cout ?? "");
        }
      })
      .catch(() => setRdv(null));
  }

  useEffect(recharger, [token, id]);

  async function enregistrerIntervention() {
    if (!token) return;
    setErreur(null);
    setChargement(true);

    try {
      await apiFetch(`/sav/rendez-vous/${id}/intervention`, {
        method: "POST",
        token,
        body: {
          diagnostic: diagnostic || null,
          reparation_effectuee: reparation || null,
          statut_intervention: statutIntervention,
          cout: cout || null,
        },
      });
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer l'intervention.");
    } finally {
      setChargement(false);
    }
  }

  if (rdv === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (rdv === null) return <p className="text-sm text-brand-muted">Ce rendez-vous est introuvable.</p>;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/clients/maintenance" className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-brand-ink">Rendez-vous de maintenance</h1>
      </div>

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
          <div>
            <p className="text-xs font-medium text-brand-muted">Client</p>
            <p className="text-sm font-semibold text-brand-ink">
              {rdv.demande_sav?.client.user.prenom ? `${rdv.demande_sav.client.user.prenom} ` : ""}
              {rdv.demande_sav?.client.user.nom ?? "—"}
            </p>
          </div>

          {rdv.demande_sav ? (
            <div>
              <p className="text-xs font-medium text-brand-muted">Problème déclaré</p>
              <p className="mt-1 whitespace-pre-line text-sm text-brand-ink">{rdv.demande_sav.description_probleme}</p>
              <Link href={`/clients/declarations-panne/${rdv.demande_sav_id}`} className="mt-2 inline-block text-xs font-semibold text-[color:var(--brand-blue-end)] underline underline-offset-2">
                Voir la déclaration complète
              </Link>
            </div>
          ) : null}

          <div className="flex items-center gap-2 border-t border-brand-line pt-4 text-sm text-brand-ink">
            <UserAvatarIcon className="h-4 w-4 text-brand-muted" />
            {rdv.technicien ? `${rdv.technicien.user.prenom ? rdv.technicien.user.prenom + " " : ""}${rdv.technicien.user.nom}` : "Technicien non assigné"}
          </div>
          <p className="text-sm text-brand-ink">{formaterDateHeure(rdv.date_rdv)}</p>
          {rdv.lieu ? <p className="text-sm text-brand-muted">{rdv.lieu}</p> : null}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
          <p className="text-sm font-bold text-brand-ink">Intervention</p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Statut</label>
            <Listbox
              value={statutIntervention}
              onChange={(v) => setStatutIntervention(v as StatutIntervention)}
              options={STATUTS.map((s) => ({ value: s, label: LIBELLE_STATUT_INTERVENTION[s] }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Diagnostic</label>
            <textarea value={diagnostic} onChange={(e) => setDiagnostic(e.target.value)} rows={3} className="rounded-xl border border-brand-line px-3 py-2 text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Réparation effectuée</label>
            <textarea value={reparation} onChange={(e) => setReparation(e.target.value)} rows={3} className="rounded-xl border border-brand-line px-3 py-2 text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Coût (CFA)</label>
            <input type="number" min="0" value={cout} onChange={(e) => setCout(e.target.value)} className="h-11 w-40 rounded-xl border border-brand-line px-3 text-sm" />
            {cout ? <p className="text-xs text-brand-muted">{formaterPrix(cout)} CFA</p> : null}
          </div>

          <button
            type="button"
            onClick={enregistrerIntervention}
            disabled={chargement}
            className="bg-gradient-brand-blue mt-1 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          >
            {chargement ? "Enregistrement…" : "Enregistrer l'intervention"}
          </button>
        </div>
      </div>
    </div>
  );
}
