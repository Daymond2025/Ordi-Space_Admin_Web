"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, LIBELLE_STATUT_LIVRAISON, LIBELLE_STATUT_RETOUR, type TableauDeBordLivreurs } from "@/lib/types";
import {
  CashIcon,
  CheckIcon,
  ClockIcon,
  LivreursIcon,
  PlusIcon,
  TriangleAlerteIcon,
  UserPlusIcon,
} from "@/components/icons";

const COULEUR_TYPE_VEHICULE: Record<string, string> = {
  Moto: "#3B82F6",
  Voiture: "#F97316",
  Tricycle: "#8B5CF6",
  Vélo: "#10B981",
  "Non renseigné": "#D9DFEA",
};

const COULEUR_STATUT_LIVRAISON = "#00BFFF";
const COULEUR_STATUT_RETOUR: Record<string, string> = {
  "Retour en cours": "#F59E0B",
  "Retour effectué": "#10B981",
};

const THEMES_KPI = {
  bleu: { carte: "border-blue-100 bg-blue-50", icone: "bg-blue-100 text-[color:var(--brand-blue-end)]", texte: "text-[color:var(--brand-blue-end)]" },
  emeraude: { carte: "border-emerald-100 bg-emerald-50", icone: "bg-emerald-100 text-emerald-600", texte: "text-emerald-600" },
  orange: { carte: "border-orange-100 bg-orange-50", icone: "bg-orange-100 text-orange-600", texte: "text-orange-600" },
  violet: { carte: "border-violet-100 bg-violet-50", icone: "bg-violet-100 text-violet-600", texte: "text-violet-600" },
  ambre: { carte: "border-amber-100 bg-amber-50", icone: "bg-amber-100 text-amber-700", texte: "text-amber-700" },
  ciel: { carte: "border-sky-100 bg-sky-50", icone: "bg-sky-100 text-sky-600", texte: "text-sky-600" },
  rose: { carte: "border-rose-100 bg-rose-50", icone: "bg-rose-100 text-rose-600", texte: "text-rose-600" },
} as const;

type ThemeKpi = keyof typeof THEMES_KPI;

function CarteKpi({
  label,
  valeur,
  sousLabel,
  icone: Icone,
  theme,
}: {
  label: string;
  valeur: string;
  sousLabel?: string;
  icone: typeof CashIcon;
  theme: ThemeKpi;
}) {
  const t = THEMES_KPI[theme];
  return (
    <div className={`rounded-2xl border p-5 shadow-none ${t.carte}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold ${t.texte}`}>{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.icone}`}>
          <Icone className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-3 text-2xl font-extrabold ${t.texte}`}>{valeur}</p>
      {sousLabel ? <p className="mt-0.5 text-[11px] text-brand-muted">{sousLabel}</p> : null}
    </div>
  );
}

function GraphiqueBarres({ data, couleur }: { data: { label: string; total: number }[]; couleur: string }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex h-36 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold text-brand-ink">{d.total}</span>
          <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(6, (d.total / max) * 110)}px`, background: couleur }} />
          <p className="text-[10px] text-brand-muted">{d.label}</p>
        </div>
      ))}
    </div>
  );
}

function RepartitionBarre({ items }: { items: { label: string; valeur: number; couleur: string }[] }) {
  const total = items.reduce((s, i) => s + i.valeur, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#EEF1F6]">
        {items.map((i) =>
          i.valeur > 0 ? <div key={i.label} style={{ width: `${(i.valeur / total) * 100}%`, background: i.couleur }} /> : null
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {items.map((i) => (
          <div key={i.label} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: i.couleur }} />
            <span className="text-brand-muted">{i.label}</span>
            <span className="font-bold text-brand-ink">{i.valeur}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CarteSection({ titre, enfant, action }: { titre: string; enfant: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-none">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-brand-ink">{titre}</p>
        {action}
      </div>
      <div className="mt-4">{enfant}</div>
    </div>
  );
}

const LIBELLE_TYPE_VEHICULE: Record<keyof TableauDeBordLivreurs["types_vehicule"], string> = {
  moto: "Moto",
  voiture: "Voiture",
  tricycle: "Tricycle",
  velo: "Vélo",
  non_defini: "Non renseigné",
};

export default function LivreursTableauDeBordPage() {
  const { token } = useAuth();
  const [donnees, setDonnees] = useState<TableauDeBordLivreurs | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<TableauDeBordLivreurs>("/admin/livreurs/tableau-de-bord", { token }).then(setDonnees);
  }, [token]);

  if (!donnees) {
    return <p className="py-10 text-center text-sm text-brand-muted">Chargement du tableau de bord…</p>;
  }

  const { livreurs, types_vehicule, inscriptions_par_semaine, missions, retours, paiements_cod } = donnees;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <CarteKpi label="Total livreurs" valeur={String(livreurs.total)} sousLabel={`${livreurs.nouveaux_30j} nouveaux (30j)`} icone={LivreursIcon} theme="bleu" />
        <CarteKpi label="Disponibles maintenant" valeur={String(livreurs.disponibles_maintenant)} icone={CheckIcon} theme="emeraude" />
        <CarteKpi label="En ligne" valeur={String(livreurs.en_ligne)} sousLabel="En ce moment" icone={UserPlusIcon} theme="ciel" />
        <CarteKpi label="Missions livrées" valeur={String(missions.livrees)} icone={CheckIcon} theme="orange" />
        <CarteKpi label="Vivier (sans livreur)" valeur={String(missions.vivier)} sousLabel="Livraisons publiées, en attente" icone={ClockIcon} theme="violet" />
        <CarteKpi label="Cash non déposé" valeur={`${formaterPrix(paiements_cod.non_depose)} FCFA`} icone={CashIcon} theme="ambre" />
        <CarteKpi label="Retards de dépôt" valeur={String(paiements_cod.en_retard)} sousLabel="Échéance dépassée" icone={TriangleAlerteIcon} theme="rose" />
        <CarteKpi label="Nouveaux (7j)" valeur={String(livreurs.nouveaux_7j)} icone={PlusIcon} theme="bleu" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CarteSection
          titre="Inscriptions par semaine"
          enfant={<GraphiqueBarres data={inscriptions_par_semaine.map((s) => ({ label: s.semaine, total: s.total }))} couleur="#0077FF" />}
        />

        <CarteSection
          titre="Répartition par type de véhicule"
          action={
            <Link href="/livreurs/liste" className="text-xs font-semibold text-[color:var(--brand-blue-end)]">
              Voir la liste →
            </Link>
          }
          enfant={
            <RepartitionBarre
              items={(Object.keys(LIBELLE_TYPE_VEHICULE) as (keyof typeof LIBELLE_TYPE_VEHICULE)[]).map((t) => ({
                label: LIBELLE_TYPE_VEHICULE[t],
                valeur: types_vehicule[t],
                couleur: COULEUR_TYPE_VEHICULE[LIBELLE_TYPE_VEHICULE[t]],
              }))}
            />
          }
        />

        <CarteSection
          titre="Missions par statut"
          enfant={
            <RepartitionBarre
              items={Object.entries(missions.par_statut).map(([statut, total]) => ({
                label: LIBELLE_STATUT_LIVRAISON[statut] ?? statut,
                valeur: total ?? 0,
                couleur: COULEUR_STATUT_LIVRAISON,
              }))}
            />
          }
        />

        <CarteSection
          titre="Retours"
          enfant={
            retours.total === 0 ? (
              <p className="py-4 text-center text-sm text-brand-muted">Aucun retour pour l&apos;instant.</p>
            ) : (
              <RepartitionBarre
                items={(Object.keys(LIBELLE_STATUT_RETOUR) as (keyof typeof LIBELLE_STATUT_RETOUR)[]).map((s) => ({
                  label: LIBELLE_STATUT_RETOUR[s],
                  valeur: retours.par_statut[s as "en_cours" | "effectue"] ?? 0,
                  couleur: COULEUR_STATUT_RETOUR[LIBELLE_STATUT_RETOUR[s]],
                }))}
              />
            )
          }
        />
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-none">
        <p className="text-sm font-bold text-brand-ink">Répartition des comptes</p>
        <div className="mt-4">
          <RepartitionBarre
            items={[
              { label: "Actifs", valeur: livreurs.actifs, couleur: "#10B981" },
              { label: "Suspendus", valeur: livreurs.suspendus, couleur: "#F59E0B" },
              { label: "Désactivés", valeur: livreurs.desactives, couleur: "#EF4444" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
