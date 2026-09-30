"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, type TableauDeBordGeneral } from "@/lib/types";
import {
  BagIcon,
  CashIcon,
  ClientsIcon,
  CommerciauxIcon,
  CoordinateursIcon,
  FournisseursIcon,
  HelpCircleIcon,
  LivreursIcon,
  MaintenanceServiceIcon,
  OperationsIcon,
  TriangleAlerteIcon,
} from "@/components/icons";

function CarteKpi({
  label,
  valeur,
  sousLabel,
  icone: Icone,
  couleur,
}: {
  label: string;
  valeur: string;
  sousLabel?: string;
  icone: typeof CashIcon;
  couleur: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-brand-muted">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${couleur}`}>
          <Icone className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-brand-ink">{valeur}</p>
      {sousLabel ? <p className="mt-0.5 text-[11px] text-brand-muted">{sousLabel}</p> : null}
    </div>
  );
}

function CarteATraiter({
  href,
  valeur,
  label,
  icone: Icone,
}: {
  href: string;
  valeur: number;
  label: string;
  icone: typeof TriangleAlerteIcon;
}) {
  const actif = valeur > 0;
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
        actif ? "border-amber-200 bg-amber-50 hover:border-amber-300" : "border-brand-line bg-white hover:border-[color:var(--brand-blue-end)]/40"
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${actif ? "bg-amber-100 text-amber-600" : "bg-[#EEF1F6] text-brand-muted"}`}>
        <Icone className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className={`text-xl font-extrabold ${actif ? "text-amber-700" : "text-brand-ink"}`}>{valeur}</p>
        <p className="truncate text-xs text-brand-muted">{label}</p>
      </div>
    </Link>
  );
}

function RepartitionBarre({ items }: { items: { label: string; valeur: number; couleur: string }[] }) {
  const total = items.reduce((s, i) => s + i.valeur, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#EEF1F6]">
        {items.map((i) => (i.valeur > 0 ? <div key={i.label} style={{ width: `${(i.valeur / total) * 100}%`, background: i.couleur }} /> : null))}
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

function GraphiqueInscriptions({ data }: { data: { jour: string; total: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex h-28 items-end gap-2">
      {data.map((d) => (
        <div key={d.jour} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold text-brand-ink">{d.total}</span>
          <div
            className="w-full rounded-t-md bg-[color:var(--brand-blue-end)] transition-all"
            style={{ height: `${Math.max(4, (d.total / max) * 80)}px` }}
          />
          <p className="text-[10px] text-brand-muted">
            {new Date(`${d.jour}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short" })}
          </p>
        </div>
      ))}
    </div>
  );
}

function CarteRaccourci({ href, titre, icone: Icone, couleur }: { href: string; titre: string; icone: typeof OperationsIcon; couleur: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl border border-brand-line bg-white py-4 text-center transition-colors hover:border-[color:var(--brand-blue-end)]/40"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${couleur}`}>
        <Icone className="h-4.5 w-4.5" />
      </span>
      <p className="text-xs font-semibold text-brand-ink">{titre}</p>
    </Link>
  );
}

export function DashboardGeneral() {
  const { token } = useAuth();
  const [donnees, setDonnees] = useState<TableauDeBordGeneral | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<TableauDeBordGeneral>("/admin/statistiques/tableau-de-bord", { token }).then(setDonnees);
  }, [token]);

  const totalATraiter = donnees
    ? donnees.a_traiter.produits_a_valider + donnees.a_traiter.reclamations_nouvelles + donnees.a_traiter.pannes_en_attente + donnees.a_traiter.retraits_en_attente
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CarteKpi
          label="Utilisateurs"
          valeur={donnees ? String(donnees.utilisateurs.total) : "—"}
          sousLabel={donnees ? `+${donnees.utilisateurs.nouveaux_7j} cette semaine` : undefined}
          icone={ClientsIcon}
          couleur="bg-blue-50 text-[color:var(--brand-blue-end)]"
        />
        <CarteKpi
          label="Commandes"
          valeur={donnees ? String(donnees.commandes.total) : "—"}
          sousLabel={donnees ? `${donnees.commandes.aujourd_hui} aujourd'hui` : undefined}
          icone={BagIcon}
          couleur="bg-emerald-50 text-emerald-600"
        />
        <CarteKpi
          label="Chiffre d'affaires"
          valeur={donnees ? `${formaterPrix(donnees.finance.chiffre_affaires_total)} CFA` : "—"}
          sousLabel={donnees ? `${formaterPrix(donnees.finance.chiffre_affaires_mois)} CFA ce mois` : undefined}
          icone={CashIcon}
          couleur="bg-amber-50 text-amber-600"
        />
        <CarteKpi
          label="Catalogue"
          valeur={donnees ? String(donnees.catalogue.total) : "—"}
          sousLabel={donnees ? `${donnees.catalogue.valides} validés` : undefined}
          icone={OperationsIcon}
          couleur="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TriangleAlerteIcon className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold text-brand-ink">
            À traiter maintenant {totalATraiter > 0 ? <span className="text-amber-600">({totalATraiter})</span> : null}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CarteATraiter
            href="/operations/produits?statut=en_attente"
            valeur={donnees?.a_traiter.produits_a_valider ?? 0}
            label="Produits à valider"
            icone={OperationsIcon}
          />
          <CarteATraiter
            href="/clients/reclamations"
            valeur={donnees?.a_traiter.reclamations_nouvelles ?? 0}
            label="Réclamations nouvelles"
            icone={HelpCircleIcon}
          />
          <CarteATraiter href="/maintenance" valeur={donnees?.a_traiter.pannes_en_attente ?? 0} label="Pannes en attente" icone={MaintenanceServiceIcon} />
          <CarteATraiter href="/livreurs/retraits" valeur={donnees?.a_traiter.retraits_en_attente ?? 0} label="Retraits à traiter" icone={CashIcon} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <p className="text-sm font-bold text-brand-ink">Répartition des utilisateurs</p>
          <div className="mt-4">
            {donnees ? (
              <RepartitionBarre
                items={[
                  { label: "Clients", valeur: donnees.utilisateurs.clients, couleur: "#0077FF" },
                  { label: "Fournisseurs", valeur: donnees.utilisateurs.fournisseurs, couleur: "#8B5CF6" },
                  { label: "Livreurs", valeur: donnees.utilisateurs.livreurs, couleur: "#F97316" },
                  { label: "Coordinateurs", valeur: donnees.utilisateurs.coordinateurs, couleur: "#10B981" },
                  { label: "Commerciaux", valeur: donnees.utilisateurs.commerciaux, couleur: "#F43F5E" },
                ]}
              />
            ) : (
              <p className="py-4 text-center text-sm text-brand-muted">Chargement…</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <p className="text-sm font-bold text-brand-ink">Commandes par statut</p>
          <div className="mt-4">
            {donnees ? (
              <RepartitionBarre
                items={[
                  { label: "En attente", valeur: donnees.commandes.en_attente, couleur: "#F59E0B" },
                  { label: "En cours", valeur: donnees.commandes.en_cours, couleur: "#00BFFF" },
                  { label: "Livrées", valeur: donnees.commandes.livrees, couleur: "#10B981" },
                  { label: "Annulées", valeur: donnees.commandes.annulees, couleur: "#EF4444" },
                ]}
              />
            ) : (
              <p className="py-4 text-center text-sm text-brand-muted">Chargement…</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <p className="text-sm font-bold text-brand-ink">Inscriptions (7 derniers jours)</p>
          <div className="mt-4">
            {donnees ? <GraphiqueInscriptions data={donnees.inscriptions_7j} /> : <p className="py-4 text-center text-sm text-brand-muted">Chargement…</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <p className="text-sm font-bold text-brand-ink">Aperçu financier &amp; catalogue</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F7F9FC] p-3">
              <p className="text-lg font-extrabold text-brand-ink">{donnees ? `${formaterPrix(donnees.finance.fournisseurs_solde_du)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Dû aux fournisseurs</p>
            </div>
            <div className="rounded-xl bg-[#F7F9FC] p-3">
              <p className="text-lg font-extrabold text-brand-ink">{donnees ? `${formaterPrix(donnees.finance.retraits_en_attente_montant)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Retraits en attente</p>
            </div>
            <div className="rounded-xl bg-[#F7F9FC] p-3">
              <p className="text-lg font-extrabold text-brand-ink">{donnees?.catalogue.stock_faible ?? "—"}</p>
              <p className="text-xs text-brand-muted">Stock faible (≤5)</p>
            </div>
            <div className="rounded-xl bg-[#F7F9FC] p-3">
              <p className="text-lg font-extrabold text-brand-ink">{donnees?.catalogue.indisponibles ?? "—"}</p>
              <p className="text-xs text-brand-muted">Produits indisponibles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-brand-ink">Accès rapide</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          <CarteRaccourci href="/operations" titre="Operations" icone={OperationsIcon} couleur="bg-blue-50 text-[color:var(--brand-blue-end)]" />
          <CarteRaccourci href="/commandes" titre="Commandes" icone={BagIcon} couleur="bg-emerald-50 text-emerald-600" />
          <CarteRaccourci href="/clients" titre="Clients" icone={ClientsIcon} couleur="bg-sky-50 text-sky-600" />
          <CarteRaccourci href="/commerciaux" titre="Commerciaux" icone={CommerciauxIcon} couleur="bg-pink-50 text-pink-600" />
          <CarteRaccourci href="/fournisseurs" titre="Fournisseurs" icone={FournisseursIcon} couleur="bg-violet-50 text-violet-600" />
          <CarteRaccourci href="/livreurs" titre="Livreurs" icone={LivreursIcon} couleur="bg-orange-50 text-orange-600" />
          <CarteRaccourci href="/maintenance" titre="Maintenance" icone={MaintenanceServiceIcon} couleur="bg-rose-50 text-rose-600" />
          <CarteRaccourci href="/coordinateurs" titre="Coordinateurs" icone={CoordinateursIcon} couleur="bg-teal-50 text-teal-600" />
          <CarteRaccourci href="/finance" titre="Finance" icone={CashIcon} couleur="bg-amber-50 text-amber-600" />
        </div>
      </div>
    </div>
  );
}
