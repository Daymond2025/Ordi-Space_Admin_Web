"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, type CommercialAdmin } from "@/lib/types";
import { CommerciauxIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { ModaleProvisionnerUtilisateur } from "@/components/ModaleProvisionnerUtilisateur";

const ONGLETS = [
  { id: "tous", label: "Tous" },
  { id: "actif", label: "Actifs" },
  { id: "inactif", label: "Inactifs" },
] as const;

/**
 * Liste des commerciaux (GET /coordinateur/commerciaux, déjà accessible à
 * l'Admin) — déplacée de `/commerciaux` vers `/commerciaux/liste` quand
 * `/commerciaux` est devenu le tableau de bord global, même schéma que
 * `/livreurs` + `/livreurs/liste`.
 */
export default function CommerciauxListePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [commerciaux, setCommerciaux] = useState<CommercialAdmin[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");
  const [recherche, setRecherche] = useState("");
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<CommercialAdmin[]>("/coordinateur/commerciaux", { token })
      .then((data) => {
        setCommerciaux(data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token]);

  useEffect(charger, [charger]);

  const listeFiltree = useMemo(() => {
    if (!commerciaux) return null;
    const terme = recherche.trim().toLowerCase();
    return commerciaux.filter((c) => {
      if (onglet === "actif" && !c.actif) return false;
      if (onglet === "inactif" && c.actif) return false;
      if (!terme) return true;
      return `${c.prenom ?? ""} ${c.nom}`.toLowerCase().includes(terme);
    });
  }, [commerciaux, onglet, recherche]);

  const actifs = commerciaux?.filter((c) => c.actif).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Commerciaux"
        description="Commandes et commissions des commerciaux pilotés par le Coordinateur."
        icone={CommerciauxIcon}
        stats={[
          { valeur: commerciaux?.length ?? "—", label: "Total" },
          { valeur: actifs, label: "Actifs" },
        ]}
        action={
          <button
            type="button"
            onClick={() => setModaleOuverte(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau commercial
          </button>
        }
      />

      {modaleOuverte && token ? (
        <ModaleProvisionnerUtilisateur
          role="commercial"
          token={token}
          onClose={() => setModaleOuverte(false)}
          onCree={(id) => router.push(`/commerciaux/${id}`)}
        />
      ) : null}

      <div className="flex items-center justify-between gap-4">
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

        <div className="relative w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un commercial…"
            className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none"
          />
        </div>
      </div>

      {erreur ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-rose-600">Impossible de charger les commerciaux.</p>
          <button type="button" onClick={charger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
            Réessayer
          </button>
        </div>
      ) : listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun commercial dans cette catégorie.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {listeFiltree.map((commercial) => (
            <Link
              key={commercial.user_id}
              href={`/commerciaux/${commercial.user_id}`}
              className="flex flex-col gap-2 rounded-2xl border border-brand-line bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-bold text-brand-ink">
                  {commercial.prenom ? `${commercial.prenom} ` : ""}
                  {commercial.nom}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    commercial.actif ? "bg-green-50 text-green-600" : "bg-gray-100 text-brand-muted"
                  }`}
                >
                  {commercial.actif ? "Actif" : "Inactif"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-brand-muted">
                <span>{commercial.commandes_total} commandes</span>
                <span>{formaterPrix(commercial.commission_totale)} CFA</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
