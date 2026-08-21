"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterPrix, type ExclusionGarantix, type FormuleGarantix } from "@/lib/types";
import { MaintenanceServiceIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

type BrouillonFormule = {
  nom: string;
  libelle_complet: string;
  libelle_badge: string;
  prix_annuel: string;
  frequence_interventions: string;
  description: string;
};

const BROUILLON_VIDE: BrouillonFormule = {
  nom: "",
  libelle_complet: "",
  libelle_badge: "",
  prix_annuel: "",
  frequence_interventions: "",
  description: "",
};

export default function GarantixPage() {
  const { token } = useAuth();
  const [formules, setFormules] = useState<FormuleGarantix[] | null>(null);
  const [exclusions, setExclusions] = useState<ExclusionGarantix[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const [creationOuverte, setCreationOuverte] = useState(false);
  const [brouillon, setBrouillon] = useState<BrouillonFormule>(BROUILLON_VIDE);
  const [nouvellesPrestations, setNouvellesPrestations] = useState<Record<number, string>>({});
  const [nouvelleExclusion, setNouvelleExclusion] = useState("");
  const [chargement, setChargement] = useState(false);

  function recharger() {
    if (!token) return;
    apiFetch<FormuleGarantix[]>("/garantix/formules", { token }).then(setFormules);
    apiFetch<ExclusionGarantix[]>("/garantix/exclusions", { token }).then(setExclusions);
  }

  useEffect(recharger, [token]);

  async function creerFormule() {
    if (!token) return;
    setErreur(null);
    setChargement(true);

    try {
      await apiFetch("/garantix/formules", {
        method: "POST",
        token,
        body: {
          ...brouillon,
          libelle_badge: brouillon.libelle_badge || null,
          description: brouillon.description || null,
          prix_annuel: Number(brouillon.prix_annuel),
          frequence_interventions: Number(brouillon.frequence_interventions),
        },
      });
      setBrouillon(BROUILLON_VIDE);
      setCreationOuverte(false);
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de créer cette formule.");
    } finally {
      setChargement(false);
    }
  }

  async function basculerActif(formule: FormuleGarantix) {
    if (!token) return;
    try {
      await apiFetch(`/garantix/formules/${formule.id}`, { method: "PUT", token, body: { actif: !formule.actif } });
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Action impossible.");
    }
  }

  async function supprimerFormule(formule: FormuleGarantix) {
    if (!token || !confirm(`Supprimer la formule "${formule.libelle_complet}" ?`)) return;
    try {
      await apiFetch(`/garantix/formules/${formule.id}`, { method: "DELETE", token });
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Suppression impossible — désactivez-la plutôt si des clients y sont déjà abonnés.");
    }
  }

  async function ajouterPrestation(formule: FormuleGarantix) {
    const libelle = nouvellesPrestations[formule.id]?.trim();
    if (!token || !libelle) return;

    try {
      await apiFetch(`/garantix/formules/${formule.id}/prestations`, { method: "POST", token, body: { libelle } });
      setNouvellesPrestations((p) => ({ ...p, [formule.id]: "" }));
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'ajouter cette prestation.");
    }
  }

  async function supprimerPrestation(prestationId: number) {
    if (!token) return;
    try {
      await apiFetch(`/garantix/prestations/${prestationId}`, { method: "DELETE", token });
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Suppression impossible.");
    }
  }

  async function ajouterExclusion() {
    if (!token || !nouvelleExclusion.trim()) return;
    try {
      await apiFetch("/garantix/exclusions", { method: "POST", token, body: { libelle: nouvelleExclusion.trim() } });
      setNouvelleExclusion("");
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'ajouter cette exclusion.");
    }
  }

  async function supprimerExclusion(id: number) {
    if (!token) return;
    try {
      await apiFetch(`/garantix/exclusions/${id}`, { method: "DELETE", token });
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Suppression impossible.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="GarantiX"
        description="Abonnements de maintenance étendue proposés aux clients."
        icone={MaintenanceServiceIcon}
        stats={[
          { valeur: formules?.length ?? "—", label: "Formules" },
          { valeur: formules?.filter((f) => f.actif).length ?? "—", label: "Actives" },
          { valeur: exclusions?.length ?? "—", label: "Exclusions" },
        ]}
        action={
          <button
            type="button"
            onClick={() => setCreationOuverte((v) => !v)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle formule
          </button>
        }
      />

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      {creationOuverte ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-6">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Nom (ex: essentielle)" value={brouillon.nom} onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            <input placeholder="Libellé complet" value={brouillon.libelle_complet} onChange={(e) => setBrouillon({ ...brouillon, libelle_complet: e.target.value })} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            <input placeholder="Badge (optionnel)" value={brouillon.libelle_badge} onChange={(e) => setBrouillon({ ...brouillon, libelle_badge: e.target.value })} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            <input type="number" min="0" placeholder="Prix annuel (CFA)" value={brouillon.prix_annuel} onChange={(e) => setBrouillon({ ...brouillon, prix_annuel: e.target.value })} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            <input type="number" min="1" placeholder="Fréquence d'interventions" value={brouillon.frequence_interventions} onChange={(e) => setBrouillon({ ...brouillon, frequence_interventions: e.target.value })} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
          </div>
          <textarea placeholder="Description" value={brouillon.description} onChange={(e) => setBrouillon({ ...brouillon, description: e.target.value })} rows={2} className="rounded-xl border border-brand-line px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="button" onClick={creerFormule} disabled={chargement} className="h-10 rounded-full bg-brand-ink px-5 text-xs font-semibold text-white disabled:opacity-50">
              Créer
            </button>
            <button type="button" onClick={() => setCreationOuverte(false)} className="h-10 rounded-full px-5 text-xs font-semibold text-brand-muted">
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        {formules === null ? (
          <p className="col-span-3 text-center text-sm text-brand-muted">Chargement…</p>
        ) : (
          formules.map((formule) => (
            <div key={formule.id} className="flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-ink">{formule.libelle_complet}</p>
                  {formule.libelle_badge ? <p className="text-[11px] text-[color:var(--brand-blue-end)]">{formule.libelle_badge}</p> : null}
                </div>
                <button type="button" onClick={() => supprimerFormule(formule)} className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-line text-brand-muted">
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-xl font-extrabold text-brand-ink">{formaterPrix(formule.prix_annuel)} CFA / an</p>
              <p className="text-xs text-brand-muted">{formule.frequence_interventions} intervention(s) / an</p>
              {formule.description ? <p className="text-xs text-brand-muted">{formule.description}</p> : null}

              <button
                type="button"
                onClick={() => basculerActif(formule)}
                className={`self-start rounded-full px-3 py-1 text-[11px] font-semibold ${formule.actif ? "bg-emerald-100 text-emerald-600" : "bg-brand-line text-brand-muted"}`}
              >
                {formule.actif ? "Actif — cliquer pour désactiver" : "Inactif — cliquer pour activer"}
              </button>

              <div className="mt-2 flex flex-col gap-1.5 border-t border-brand-line pt-3">
                <p className="text-xs font-bold uppercase text-brand-muted">Prestations</p>
                {formule.prestations.map((prestation) => (
                  <div key={prestation.id} className="flex items-center justify-between text-xs text-brand-ink">
                    <span>• {prestation.libelle}</span>
                    <button type="button" onClick={() => supprimerPrestation(prestation.id)} className="text-brand-muted hover:text-rose-500">
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="mt-1 flex gap-1.5">
                  <input
                    value={nouvellesPrestations[formule.id] ?? ""}
                    onChange={(e) => setNouvellesPrestations((p) => ({ ...p, [formule.id]: e.target.value }))}
                    placeholder="Nouvelle prestation…"
                    className="h-8 flex-1 rounded-lg border border-brand-line px-2 text-xs"
                  />
                  <button type="button" onClick={() => ajouterPrestation(formule)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-ink text-white">
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-6">
        <p className="text-sm font-bold text-brand-ink">Exclusions (communes à toutes les formules)</p>
        <div className="mt-3 flex flex-col gap-1.5">
          {exclusions?.map((exclusion) => (
            <div key={exclusion.id} className="flex items-center justify-between text-sm text-brand-ink">
              <span>• {exclusion.libelle}</span>
              <button type="button" onClick={() => supprimerExclusion(exclusion.id)} className="text-brand-muted hover:text-rose-500">
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex max-w-sm gap-2">
          <input
            value={nouvelleExclusion}
            onChange={(e) => setNouvelleExclusion(e.target.value)}
            placeholder="Nouvelle exclusion…"
            className="h-9 flex-1 rounded-lg border border-brand-line px-3 text-sm"
          />
          <button type="button" onClick={ajouterExclusion} className="h-9 rounded-lg bg-brand-ink px-4 text-xs font-semibold text-white">
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
