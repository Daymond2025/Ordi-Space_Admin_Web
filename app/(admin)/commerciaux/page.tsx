"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, type TableauDeBordCommerciaux } from "@/lib/types";
import { BagIcon, CashIcon, CheckIcon, ClockIcon, CommerciauxIcon, PlusIcon, XIcon } from "@/components/icons";

const THEMES_KPI = {
  bleu: { carte: "border-blue-100 bg-blue-50", icone: "bg-blue-100 text-[color:var(--brand-blue-end)]", texte: "text-[color:var(--brand-blue-end)]" },
  emeraude: { carte: "border-emerald-100 bg-emerald-50", icone: "bg-emerald-100 text-emerald-600", texte: "text-emerald-600" },
  orange: { carte: "border-orange-100 bg-orange-50", icone: "bg-orange-100 text-orange-600", texte: "text-orange-600" },
  violet: { carte: "border-violet-100 bg-violet-50", icone: "bg-violet-100 text-violet-600", texte: "text-violet-600" },
  ambre: { carte: "border-amber-100 bg-amber-50", icone: "bg-amber-100 text-amber-700", texte: "text-amber-700" },
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

/**
 * Tableau de bord global de l'espace Commerciaux (GET
 * /admin/commerciaux/tableau-de-bord) — même patron que `/livreurs`
 * (page.tsx), "/commerciaux" devient le tableau de bord et la liste passe
 * sous "/commerciaux/liste".
 */
export default function CommerciauxTableauDeBordPage() {
  const { token } = useAuth();
  const [donnees, setDonnees] = useState<TableauDeBordCommerciaux | null>(null);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<TableauDeBordCommerciaux>("/admin/commerciaux/tableau-de-bord", { token })
      .then((data) => {
        setDonnees(data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token]);

  useEffect(charger, [charger]);

  if (erreur) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-rose-600">Impossible de charger le tableau de bord.</p>
        <button type="button" onClick={charger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
          Réessayer
        </button>
      </div>
    );
  }

  if (!donnees) {
    return <p className="py-10 text-center text-sm text-brand-muted">Chargement du tableau de bord…</p>;
  }

  const { commerciaux, inscriptions_par_semaine, commandes, commissions, retraits, top_commerciaux } = donnees;
  const retraitsEnAttente = retraits.par_statut.en_attente ?? { nombre: 0, montant: 0 };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <CarteKpi label="Total commerciaux" valeur={String(commerciaux.total)} sousLabel={`${commerciaux.nouveaux_30j} nouveaux (30j)`} icone={CommerciauxIcon} theme="bleu" />
        <CarteKpi label="Commandes livrées" valeur={String(commandes.livrees)} icone={CheckIcon} theme="emeraude" />
        <CarteKpi label="Commandes envoyées" valeur={String(commandes.total)} icone={BagIcon} theme="orange" />
        <CarteKpi label="Commandes annulées" valeur={String(commandes.annulees)} icone={XIcon} theme="rose" />
        <CarteKpi label="Commission créditée" valeur={`${formaterPrix(commissions.total_credite)} F`} sousLabel="Depuis toujours, tous commerciaux" icone={CashIcon} theme="ambre" />
        <CarteKpi label="Solde total à retirer" valeur={`${formaterPrix(commissions.solde_total_portefeuilles)} F`} icone={CashIcon} theme="violet" />
        <CarteKpi
          label="Retraits en attente"
          valeur={String(retraitsEnAttente.nombre)}
          sousLabel={`${formaterPrix(retraitsEnAttente.montant)} F à traiter`}
          icone={ClockIcon}
          theme="ambre"
        />
        <CarteKpi label="Nouveaux (7j)" valeur={String(commerciaux.nouveaux_7j)} icone={PlusIcon} theme="bleu" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CarteSection
          titre="Inscriptions par semaine"
          enfant={<GraphiqueBarres data={inscriptions_par_semaine.map((s) => ({ label: s.semaine, total: s.total }))} couleur="#0077FF" />}
        />

        <CarteSection
          titre="Répartition des comptes"
          action={
            <Link href="/commerciaux/liste" className="text-xs font-semibold text-[color:var(--brand-blue-end)]">
              Voir la liste →
            </Link>
          }
          enfant={
            <RepartitionBarre
              items={[
                { label: "Actifs", valeur: commerciaux.actifs, couleur: "#10B981" },
                { label: "Suspendus", valeur: commerciaux.suspendus, couleur: "#F59E0B" },
                { label: "Désactivés", valeur: commerciaux.desactives, couleur: "#EF4444" },
              ]}
            />
          }
        />

        <CarteSection
          titre="Commandes par statut"
          enfant={
            <RepartitionBarre
              items={[
                { label: "Validées", valeur: commandes.validees, couleur: "#00BFFF" },
                { label: "Livrées", valeur: commandes.livrees, couleur: "#10B981" },
                { label: "Annulées", valeur: commandes.annulees, couleur: "#EF4444" },
              ]}
            />
          }
        />

        <CarteSection
          titre="Demandes de retrait"
          action={
            <Link href="/commerciaux/retraits" className="text-xs font-semibold text-[color:var(--brand-blue-end)]">
              Voir les retraits →
            </Link>
          }
          enfant={
            <RepartitionBarre
              items={[
                { label: "En attente", valeur: retraits.par_statut.en_attente?.nombre ?? 0, couleur: "#F59E0B" },
                { label: "Payés", valeur: retraits.par_statut.valide?.nombre ?? 0, couleur: "#10B981" },
                { label: "Refusés", valeur: retraits.par_statut.refuse?.nombre ?? 0, couleur: "#EF4444" },
              ]}
            />
          }
        />
      </div>

      <CarteSection
        titre="Top 5 commerciaux (commission totale)"
        action={
          <Link href="/commerciaux/liste" className="text-xs font-semibold text-[color:var(--brand-blue-end)]">
            Voir la liste →
          </Link>
        }
        enfant={
          top_commerciaux.length === 0 ? (
            <p className="py-4 text-center text-sm text-brand-muted">Aucun commercial avec des ventes pour l&apos;instant.</p>
          ) : (
            <div className="flex flex-col divide-y divide-brand-line">
              {top_commerciaux.map((c, i) => (
                <Link
                  key={c.user_id}
                  href={`/commerciaux/${c.user_id}`}
                  className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-[11px] font-bold text-brand-muted">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-brand-ink">
                      {c.prenom ? `${c.prenom} ` : ""}
                      {c.nom}
                    </span>
                  </div>
                  <span className="font-bold text-brand-ink">{formaterPrix(c.commission_totale)} F</span>
                </Link>
              ))}
            </div>
          )
        }
      />
    </div>
  );
}
