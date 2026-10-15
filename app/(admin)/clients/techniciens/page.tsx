"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { LIBELLE_STATUT_COMPTE, STYLE_STATUT_COMPTE, type TechnicienAdmin } from "@/lib/types";
import { MaintenanceServiceIcon, PlusIcon, SearchIcon, UserAvatarIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { ModaleProvisionnerUtilisateur } from "@/components/ModaleProvisionnerUtilisateur";

/**
 * Comptes des techniciens de maintenance (app Maintenancier) — connexion par
 * téléphone+OTP uniquement, provisionnés ici par l'Admin (aucune
 * auto-inscription, voir roles_provisionnes_par_admin() côté backend).
 * GET /sav/techniciens (RendezVousController) ; création via la même modale
 * que les autres rôles (POST /admin/utilisateurs).
 */
export default function TechniciensListePage() {
  const { token } = useAuth();
  const [techniciens, setTechniciens] = useState<TechnicienAdmin[] | null>(null);
  const [recherche, setRecherche] = useState("");
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<TechnicienAdmin[]>("/sav/techniciens", { token })
      .then((data) => {
        setTechniciens(data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token]);

  useEffect(charger, [charger]);

  const listeFiltree = useMemo(() => {
    if (!techniciens) return null;
    const terme = recherche.trim().toLowerCase();
    if (!terme) return techniciens;
    return techniciens.filter((t) => `${t.prenom ?? ""} ${t.nom}`.toLowerCase().includes(terme));
  }, [techniciens, recherche]);

  const actifs = techniciens?.filter((t) => t.statut_compte === "actif").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Techniciens"
        description="Comptes des techniciens de maintenance, connectés par téléphone + OTP depuis l'app Maintenancier."
        icone={MaintenanceServiceIcon}
        stats={[
          { valeur: techniciens?.length ?? "—", label: "Total" },
          { valeur: actifs, label: "Actifs" },
        ]}
        action={
          <button
            type="button"
            onClick={() => setModaleOuverte(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau technicien
          </button>
        }
      />

      {modaleOuverte && token ? (
        <ModaleProvisionnerUtilisateur
          role="technicien_maintenance"
          token={token}
          onClose={() => setModaleOuverte(false)}
          onCree={() => {
            setModaleOuverte(false);
            charger();
          }}
        />
      ) : null}

      <div className="relative w-80">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un technicien…"
          className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none"
        />
      </div>

      {erreur ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-rose-600">Impossible de charger les techniciens.</p>
          <button type="button" onClick={charger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
            Réessayer
          </button>
        </div>
      ) : listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun technicien.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {listeFiltree.map((t) => (
            <div key={t.user_id} className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
                <UserAvatarIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-brand-ink">
                    {t.prenom ? `${t.prenom} ` : ""}
                    {t.nom}
                  </p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STYLE_STATUT_COMPTE[t.statut_compte]}`}>
                    {LIBELLE_STATUT_COMPTE[t.statut_compte]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-brand-muted">{t.telephone ?? "—"}</p>
              </div>
              <p className="shrink-0 text-xs text-brand-muted">{t.specialite ?? "Spécialité non renseignée"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
