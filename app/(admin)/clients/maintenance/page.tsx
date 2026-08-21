"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDateHeure, type Pagination, type RendezVous } from "@/lib/types";
import { CalendarIcon, MaintenanceServiceIcon, UserAvatarIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS = [
  { id: "tous", label: "Tous" },
  { id: "non_traite", label: "Non traités" },
  { id: "traite", label: "Traités" },
] as const;

function estTraite(rdv: RendezVous): boolean {
  return rdv.intervention?.statut_intervention === "terminee";
}

export default function MaintenancePage() {
  const { token } = useAuth();
  const [rendezVous, setRendezVous] = useState<RendezVous[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<RendezVous>>("/sav/rendez-vous?per_page=100", { token }).then((page) => setRendezVous(page.data));
  }, [token]);

  const listeFiltree = useMemo(() => {
    if (onglet === "tous") return rendezVous;
    if (!rendezVous) return null;
    return rendezVous.filter((r) => (onglet === "traite" ? estTraite(r) : !estTraite(r)));
  }, [rendezVous, onglet]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Maintenance"
        description="Rendez-vous techniciens issus des déclarations de panne."
        icone={MaintenanceServiceIcon}
        stats={[
          { valeur: rendezVous?.length ?? "—", label: "Total" },
          { valeur: rendezVous?.filter((r) => !estTraite(r)).length ?? "—", label: "Non traités" },
          { valeur: rendezVous?.filter((r) => estTraite(r)).length ?? "—", label: "Traités" },
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
          </button>
        ))}
      </div>

      {listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun rendez-vous dans cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {listeFiltree.map((rdv) => (
            <div key={rdv.id} className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
                <CalendarIcon className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-brand-ink">
                    {rdv.demande_sav?.client.user.prenom ? `${rdv.demande_sav.client.user.prenom} ` : ""}
                    {rdv.demande_sav?.client.user.nom ?? "Client"}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      estTraite(rdv) ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {estTraite(rdv) ? "Traité" : "Non traité"}
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-muted">
                  <UserAvatarIcon className="h-3.5 w-3.5" />
                  {rdv.technicien ? `${rdv.technicien.user.prenom ? rdv.technicien.user.prenom + " " : ""}${rdv.technicien.user.nom}` : "Technicien non assigné"}
                </p>
                <p className="mt-1 text-[11px] text-brand-muted">
                  {formaterDateHeure(rdv.date_rdv)}
                  {rdv.lieu ? ` — ${rdv.lieu}` : ""}
                </p>
              </div>

              <Link href={`/clients/maintenance/${rdv.id}`} className="shrink-0 rounded-full bg-brand-ink px-4 py-2 text-xs font-semibold text-white">
                Voir
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
