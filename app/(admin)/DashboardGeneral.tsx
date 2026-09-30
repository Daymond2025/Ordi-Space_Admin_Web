"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  RefreshIcon,
  TrendUpIcon,
  TriangleAlerteIcon,
} from "@/components/icons";

/** Fait défiler un nombre de 0 vers `valeur` — l'écran est celui de l'admin général, les chiffres doivent avoir un peu de vie. */
function useCompteurAnime(valeur: number, duree = 900): number {
  const [affiche, setAffiche] = useState(0);
  const precedent = useRef(0);

  useEffect(() => {
    const depart = precedent.current;
    const arrivee = valeur;
    if (depart === arrivee) return;

    const t0 = performance.now();
    let frame: number;

    const tick = (t: number) => {
      const progres = Math.min(1, (t - t0) / duree);
      const ease = 1 - Math.pow(1 - progres, 3);
      setAffiche(depart + (arrivee - depart) * ease);
      if (progres < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        precedent.current = arrivee;
        setAffiche(arrivee);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [valeur, duree]);

  return affiche;
}

function NombreAnime({ valeur, formatter }: { valeur: number; formatter?: (n: number) => string }) {
  const affiche = useCompteurAnime(valeur);
  const arrondi = Math.round(affiche);
  return <>{formatter ? formatter(arrondi) : arrondi.toLocaleString("fr-FR")}</>;
}

const enCfa = (n: number) => `${formaterPrix(n)} CFA`;

function CarteKpi({
  label,
  valeur,
  formatter,
  sousLabel,
  tendance,
  icone: Icone,
  gradient,
  pastille,
  delai,
}: {
  label: string;
  valeur: number;
  formatter?: (n: number) => string;
  sousLabel?: string;
  tendance?: boolean;
  icone: typeof CashIcon;
  gradient: string;
  pastille: string;
  delai: number;
}) {
  return (
    <div
      className="animate-dash-fade-in-up group relative overflow-hidden rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ animationDelay: `${delai}ms` }}
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.08] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.16] ${gradient}`} />
      <div className="relative flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${gradient}`}>
          <Icone className="h-5 w-5" />
        </span>
      </div>
      <p className="relative mt-3 text-[28px] font-extrabold leading-none tracking-tight text-brand-ink tabular-nums">
        <NombreAnime valeur={valeur} formatter={formatter} />
      </p>
      {sousLabel ? (
        <p className={`relative mt-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${pastille}`}>
          {tendance ? <TrendUpIcon className="h-3 w-3" /> : null}
          {sousLabel}
        </p>
      ) : null}
    </div>
  );
}

function CarteATraiter({
  href,
  valeur,
  label,
  icone: Icone,
  delai,
}: {
  href: string;
  valeur: number;
  label: string;
  icone: typeof TriangleAlerteIcon;
  delai: number;
}) {
  const actif = valeur > 0;
  return (
    <Link
      href={href}
      className={`animate-dash-fade-in-up group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        actif ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white" : "border-brand-line bg-white"
      }`}
      style={{ animationDelay: `${delai}ms` }}
    >
      {actif ? <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" /> : null}
      <span
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
          actif ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md" : "bg-[#EEF1F6] text-brand-muted"
        }`}
      >
        {actif ? <span className="animate-dash-pulse-ring absolute inset-0 rounded-xl" /> : null}
        <Icone className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className={`text-2xl font-extrabold leading-none tabular-nums ${actif ? "text-amber-700" : "text-brand-ink"}`}>
          <NombreAnime valeur={valeur} />
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-brand-muted">{label}</p>
      </div>
    </Link>
  );
}

function RepartitionBarre({ items }: { items: { label: string; valeur: number; couleur: string }[] }) {
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMonte(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = items.reduce((s, i) => s + i.valeur, 0) || 1;

  return (
    <div>
      <div className="flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full bg-[#EEF1F6] shadow-inner">
        {items.map((i) =>
          i.valeur > 0 ? (
            <div
              key={i.label}
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{ width: monte ? `${(i.valeur / total) * 100}%` : "0%", background: i.couleur }}
              title={`${i.label} : ${i.valeur}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2">
        {items.map((i) => (
          <div key={i.label} className="group flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{ background: i.couleur }}
            />
            <span className="text-brand-muted transition-colors group-hover:text-brand-ink">{i.label}</span>
            <span className="font-bold text-brand-ink">{i.valeur}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GraphiqueInscriptions({ data }: { data: { jour: string; total: number }[] }) {
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMonte(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className="flex h-32 items-end gap-2">
      {data.map((d, i) => (
        <div key={d.jour} className="group flex flex-1 flex-col items-center gap-1.5">
          <span className="text-[10px] font-bold text-brand-ink">{d.total}</span>
          <div className="flex h-24 w-full items-end">
            <div
              className="w-full origin-bottom rounded-t-lg bg-gradient-to-t from-[color:var(--brand-blue-end)] to-[color:var(--brand-blue-start)] shadow-sm transition-transform duration-700 ease-out group-hover:brightness-110"
              style={{
                height: `${Math.max(6, (d.total / max) * 96)}px`,
                transform: monte ? "scaleY(1)" : "scaleY(0)",
                transitionDelay: `${i * 70}ms`,
              }}
              title={`${d.total} inscription(s)`}
            />
          </div>
          <p className="text-[10px] font-semibold text-brand-muted">
            {new Date(`${d.jour}T00:00:00`).toLocaleDateString("fr-FR", { weekday: "short" })}
          </p>
        </div>
      ))}
    </div>
  );
}

function CarteRaccourci({
  href,
  titre,
  icone: Icone,
  gradient,
  delai,
}: {
  href: string;
  titre: string;
  icone: typeof OperationsIcon;
  gradient: string;
  delai: number;
}) {
  return (
    <Link
      href={href}
      className="animate-dash-fade-in-up group flex flex-col items-center gap-2 rounded-2xl border border-brand-line bg-white py-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl"
      style={{ animationDelay: `${delai}ms` }}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${gradient}`}>
        <Icone className="h-4.5 w-4.5" />
      </span>
      <p className="text-xs font-semibold text-brand-ink">{titre}</p>
    </Link>
  );
}

export function DashboardGeneral() {
  const { token } = useAuth();
  const [donnees, setDonnees] = useState<TableauDeBordGeneral | null>(null);
  // Vrai dès le montage : le premier chargement est implicite, seuls les rechargements
  // manuels (bouton "Actualiser") ont besoin de le déclencher eux-mêmes.
  const [enChargement, setEnChargement] = useState(true);
  const [derniereMaj, setDerniereMaj] = useState<Date | null>(null);

  const recharger = useCallback(() => {
    if (!token) return;
    apiFetch<TableauDeBordGeneral>("/admin/statistiques/tableau-de-bord", { token })
      .then((data) => {
        setDonnees(data);
        setDerniereMaj(new Date());
      })
      .finally(() => setEnChargement(false));
  }, [token]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const actualiser = () => {
    setEnChargement(true);
    recharger();
  };

  const totalATraiter = donnees
    ? donnees.a_traiter.produits_a_valider + donnees.a_traiter.reclamations_nouvelles + donnees.a_traiter.pannes_en_attente + donnees.a_traiter.retraits_en_attente
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-brand-muted">Vue d&apos;ensemble en temps réel du système Ordi&apos;Space — l&apos;œil central de la plateforme.</p>
        <div className="flex items-center gap-3">
          {derniereMaj ? (
            <p className="text-xs text-brand-muted">
              Mis à jour à {derniereMaj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          ) : null}
          <button
            type="button"
            onClick={actualiser}
            disabled={enChargement}
            className="flex items-center gap-2 rounded-xl border border-brand-line bg-white px-3.5 py-2 text-xs font-bold text-brand-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
          >
            <RefreshIcon className={`h-4 w-4 ${enChargement ? "animate-dash-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CarteKpi
          label="Utilisateurs"
          valeur={donnees?.utilisateurs.total ?? 0}
          sousLabel={donnees ? `+${donnees.utilisateurs.nouveaux_7j} cette semaine` : undefined}
          tendance={!!donnees && donnees.utilisateurs.nouveaux_7j > 0}
          icone={ClientsIcon}
          gradient="bg-gradient-to-br from-blue-500 to-[color:var(--brand-blue-end)]"
          pastille="bg-blue-50 text-[color:var(--brand-blue-end)]"
          delai={0}
        />
        <CarteKpi
          label="Commandes"
          valeur={donnees?.commandes.total ?? 0}
          sousLabel={donnees ? `${donnees.commandes.aujourd_hui} aujourd'hui` : undefined}
          tendance={!!donnees && donnees.commandes.aujourd_hui > 0}
          icone={BagIcon}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
          pastille="bg-emerald-50 text-emerald-600"
          delai={60}
        />
        <CarteKpi
          label="Chiffre d'affaires"
          valeur={donnees?.finance.chiffre_affaires_total ?? 0}
          formatter={enCfa}
          sousLabel={donnees ? `${formaterPrix(donnees.finance.chiffre_affaires_mois)} CFA ce mois` : undefined}
          icone={CashIcon}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          pastille="bg-amber-50 text-amber-600"
          delai={120}
        />
        <CarteKpi
          label="Catalogue"
          valeur={donnees?.catalogue.total ?? 0}
          sousLabel={donnees ? `${donnees.catalogue.valides} validés` : undefined}
          icone={OperationsIcon}
          gradient="bg-gradient-to-br from-violet-400 to-violet-600"
          pastille="bg-violet-50 text-violet-600"
          delai={180}
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
            delai={0}
          />
          <CarteATraiter
            href="/clients/reclamations"
            valeur={donnees?.a_traiter.reclamations_nouvelles ?? 0}
            label="Réclamations nouvelles"
            icone={HelpCircleIcon}
            delai={60}
          />
          <CarteATraiter href="/maintenance" valeur={donnees?.a_traiter.pannes_en_attente ?? 0} label="Pannes en attente" icone={MaintenanceServiceIcon} delai={120} />
          <CarteATraiter href="/livreurs/retraits" valeur={donnees?.a_traiter.retraits_en_attente ?? 0} label="Retraits à traiter" icone={CashIcon} delai={180} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className="animate-dash-fade-in-up rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg"
          style={{ animationDelay: "220ms" }}
        >
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

        <div
          className="animate-dash-fade-in-up rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg"
          style={{ animationDelay: "260ms" }}
        >
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

        <div
          className="animate-dash-fade-in-up rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg"
          style={{ animationDelay: "300ms" }}
        >
          <p className="text-sm font-bold text-brand-ink">Inscriptions (7 derniers jours)</p>
          <div className="mt-4">
            {donnees ? <GraphiqueInscriptions data={donnees.inscriptions_7j} /> : <p className="py-4 text-center text-sm text-brand-muted">Chargement…</p>}
          </div>
        </div>

        <div
          className="animate-dash-fade-in-up rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg"
          style={{ animationDelay: "340ms" }}
        >
          <p className="text-sm font-bold text-brand-ink">Aperçu financier &amp; catalogue</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="group rounded-xl bg-[#F7F9FC] p-3 transition-colors duration-200 hover:bg-blue-50">
              <p className="text-lg font-extrabold text-brand-ink">{donnees ? `${formaterPrix(donnees.finance.fournisseurs_solde_du)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Dû aux fournisseurs</p>
            </div>
            <div className="group rounded-xl bg-[#F7F9FC] p-3 transition-colors duration-200 hover:bg-amber-50">
              <p className="text-lg font-extrabold text-brand-ink">{donnees ? `${formaterPrix(donnees.finance.retraits_en_attente_montant)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Retraits en attente</p>
            </div>
            <div className="group rounded-xl bg-[#F7F9FC] p-3 transition-colors duration-200 hover:bg-rose-50">
              <p className="text-lg font-extrabold text-brand-ink">{donnees?.catalogue.stock_faible ?? "—"}</p>
              <p className="text-xs text-brand-muted">Stock faible (≤5)</p>
            </div>
            <div className="group rounded-xl bg-[#F7F9FC] p-3 transition-colors duration-200 hover:bg-rose-50">
              <p className="text-lg font-extrabold text-brand-ink">{donnees?.catalogue.indisponibles ?? "—"}</p>
              <p className="text-xs text-brand-muted">Produits indisponibles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-brand-ink">Accès rapide</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          <CarteRaccourci href="/operations" titre="Operations" icone={OperationsIcon} gradient="bg-gradient-to-br from-blue-500 to-[color:var(--brand-blue-end)]" delai={0} />
          <CarteRaccourci href="/commandes" titre="Commandes" icone={BagIcon} gradient="bg-gradient-to-br from-emerald-400 to-emerald-600" delai={30} />
          <CarteRaccourci href="/clients" titre="Clients" icone={ClientsIcon} gradient="bg-gradient-to-br from-sky-400 to-sky-600" delai={60} />
          <CarteRaccourci href="/commerciaux" titre="Commerciaux" icone={CommerciauxIcon} gradient="bg-gradient-to-br from-pink-400 to-pink-600" delai={90} />
          <CarteRaccourci href="/fournisseurs" titre="Fournisseurs" icone={FournisseursIcon} gradient="bg-gradient-to-br from-violet-400 to-violet-600" delai={120} />
          <CarteRaccourci href="/livreurs" titre="Livreurs" icone={LivreursIcon} gradient="bg-gradient-to-br from-orange-400 to-orange-600" delai={150} />
          <CarteRaccourci href="/maintenance" titre="Maintenance" icone={MaintenanceServiceIcon} gradient="bg-gradient-to-br from-rose-400 to-rose-600" delai={180} />
          <CarteRaccourci href="/coordinateurs" titre="Coordinateurs" icone={CoordinateursIcon} gradient="bg-gradient-to-br from-teal-400 to-teal-600" delai={210} />
          <CarteRaccourci href="/finance" titre="Finance" icone={CashIcon} gradient="bg-gradient-to-br from-amber-400 to-amber-600" delai={240} />
        </div>
      </div>
    </div>
  );
}
