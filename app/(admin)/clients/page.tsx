"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  formaterPrix,
  LIBELLE_STATUT_COMMANDE,
  LIBELLE_STATUT_RECLAMATION,
  type TableauDeBordClients,
} from "@/lib/types";
import {
  BagIcon,
  CashIcon,
  ClientsIcon,
  GiftIconOutline,
  HelpCircleIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserPlusIcon,
} from "@/components/icons";

const COULEUR_SEGMENT: Record<string, string> = {
  Nouveau: "#3B82F6",
  "Gros Acheteur": "#F97316",
  VIP: "#8B5CF6",
  "Sans commande": "#D9DFEA",
};

const COULEUR_STATUT_COMMANDE = "#00BFFF";
const COULEUR_STATUT_RECLAMATION: Record<string, string> = {
  Nouvelle: "#F43F5E",
  "En cours": "#F59E0B",
  Résolue: "#10B981",
  Rejetée: "#94A3B8",
};

const THEMES_KPI = {
  bleu: { carte: "border-blue-100 bg-blue-50", icone: "bg-blue-100 text-[color:var(--brand-blue-end)]", texte: "text-[color:var(--brand-blue-end)]" },
  emeraude: { carte: "border-emerald-100 bg-emerald-50", icone: "bg-emerald-100 text-emerald-600", texte: "text-emerald-600" },
  orange: { carte: "border-orange-100 bg-orange-50", icone: "bg-orange-100 text-orange-600", texte: "text-orange-600" },
  violet: { carte: "border-violet-100 bg-violet-50", icone: "bg-violet-100 text-violet-600", texte: "text-violet-600" },
  ambre: { carte: "border-amber-100 bg-amber-50", icone: "bg-amber-100 text-amber-700", texte: "text-amber-700" },
  ciel: { carte: "border-sky-100 bg-sky-50", icone: "bg-sky-100 text-sky-600", texte: "text-sky-600" },
  rose: { carte: "border-rose-100 bg-rose-50", icone: "bg-rose-100 text-rose-600", texte: "text-rose-600" },
  fuchsia: { carte: "border-pink-100 bg-pink-50", icone: "bg-pink-100 text-pink-600", texte: "text-pink-600" },
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

export default function ClientsTableauDeBordPage() {
  const { token } = useAuth();
  const [donnees, setDonnees] = useState<TableauDeBordClients | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<TableauDeBordClients>("/admin/clients/tableau-de-bord", { token }).then(setDonnees);
  }, [token]);

  if (!donnees) {
    return <p className="py-10 text-center text-sm text-brand-muted">Chargement du tableau de bord…</p>;
  }

  const { clients, segments, inscriptions_par_semaine, commandes, fidelite, reclamations, garanties_actives } = donnees;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <CarteKpi label="Total clients" valeur={String(clients.total)} sousLabel={`${clients.nouveaux_30j} nouveaux (30j)`} icone={ClientsIcon} theme="bleu" />
        <CarteKpi label="Clients en ligne" valeur={String(clients.en_ligne)} sousLabel="En ce moment" icone={UserPlusIcon} theme="emeraude" />
        <CarteKpi label="Chiffre d'affaires" valeur={`${formaterPrix(commandes.chiffre_affaires)} FCFA`} sousLabel={`${commandes.total} commandes valides`} icone={CashIcon} theme="orange" />
        <CarteKpi label="Garanties actives" valeur={String(garanties_actives)} icone={ShieldCheckIcon} theme="violet" />
        <CarteKpi label="Solde fidélité" valeur={`${formaterPrix(fidelite.solde_total)} FCFA`} sousLabel={`${fidelite.clients_avec_filleuls} parrain(s) actif(s)`} icone={GiftIconOutline} theme="ambre" />
        <CarteKpi label="Panier moyen" valeur={`${formaterPrix(commandes.total > 0 ? Math.round(commandes.chiffre_affaires / commandes.total) : 0)} FCFA`} icone={BagIcon} theme="ciel" />
        <CarteKpi label="Réclamations" valeur={String(reclamations.total)} sousLabel={`${reclamations.par_statut.nouvelle ?? 0} nouvelle(s)`} icone={HelpCircleIcon} theme="rose" />
        <CarteKpi label="Codes parrainage utilisés" valeur={String(fidelite.clients_avec_filleuls)} icone={TicketIcon} theme="fuchsia" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CarteSection
          titre="Inscriptions par semaine"
          enfant={<GraphiqueBarres data={inscriptions_par_semaine.map((s) => ({ label: s.semaine, total: s.total }))} couleur="#0077FF" />}
        />

        <CarteSection
          titre="Segmentation clients"
          action={
            <Link href="/clients/liste" className="text-xs font-semibold text-[color:var(--brand-blue-end)]">
              Voir la liste →
            </Link>
          }
          enfant={
            <RepartitionBarre
              items={[
                { label: "Nouveau", valeur: segments.nouveau, couleur: COULEUR_SEGMENT.Nouveau },
                { label: "Gros Acheteur", valeur: segments.gros_acheteur, couleur: COULEUR_SEGMENT["Gros Acheteur"] },
                { label: "VIP", valeur: segments.vip, couleur: COULEUR_SEGMENT.VIP },
                { label: "Sans commande", valeur: segments.aucun, couleur: COULEUR_SEGMENT["Sans commande"] },
              ]}
            />
          }
        />

        <CarteSection
          titre="Commandes par statut"
          action={
            <Link href="/clients/consultation" className="text-xs font-semibold text-[color:var(--brand-blue-end)]">
              Rechercher un client →
            </Link>
          }
          enfant={
            <RepartitionBarre
              items={(Object.keys(LIBELLE_STATUT_COMMANDE) as (keyof typeof LIBELLE_STATUT_COMMANDE)[]).map((s) => ({
                label: LIBELLE_STATUT_COMMANDE[s],
                valeur: commandes.par_statut[s] ?? 0,
                couleur: COULEUR_STATUT_COMMANDE,
              }))}
            />
          }
        />

        <CarteSection
          titre="Réclamations par statut"
          action={
            <Link href="/clients/reclamations" className="text-xs font-semibold text-[color:var(--brand-blue-end)]">
              Voir les réclamations →
            </Link>
          }
          enfant={
            reclamations.total === 0 ? (
              <p className="py-4 text-center text-sm text-brand-muted">Aucune réclamation pour l&apos;instant.</p>
            ) : (
              <RepartitionBarre
                items={(Object.keys(LIBELLE_STATUT_RECLAMATION) as (keyof typeof LIBELLE_STATUT_RECLAMATION)[]).map((s) => ({
                  label: LIBELLE_STATUT_RECLAMATION[s],
                  valeur: reclamations.par_statut[s] ?? 0,
                  couleur: COULEUR_STATUT_RECLAMATION[LIBELLE_STATUT_RECLAMATION[s]],
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
              { label: "Actifs", valeur: clients.actifs, couleur: "#10B981" },
              { label: "Suspendus", valeur: clients.suspendus, couleur: "#F59E0B" },
              { label: "Désactivés", valeur: clients.desactives, couleur: "#EF4444" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
