"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  clientDepuisLibelle,
  LIBELLE_STATUT_COMPTE,
  STYLE_STATUT_COMPTE,
  type CoordinateurAdmin,
  type Pagination,
} from "@/lib/types";
import { CoordinateursIcon, PlusIcon, SearchIcon, UserAvatarIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { ModaleProvisionnerUtilisateur } from "@/components/ModaleProvisionnerUtilisateur";

/** CRUD complet côté admin, comme pour un client — GET/POST /admin/coordinateurs. */
export default function CoordinateursListePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [coordinateurs, setCoordinateurs] = useState<CoordinateurAdmin[] | null>(null);
  const [recherche, setRecherche] = useState("");
  const [modaleOuverte, setModaleOuverte] = useState(false);

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams({ per_page: "100" });
    if (recherche) params.set("recherche", recherche);
    apiFetch<Pagination<CoordinateurAdmin>>(`/admin/coordinateurs?${params}`, { token }).then((page) => setCoordinateurs(page.data));
  }, [token, recherche]);

  const actifs = useMemo(() => coordinateurs?.filter((c) => c.statut_compte === "actif").length ?? null, [coordinateurs]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Coordinateurs"
        description="Équipe de coordination pilotant produits, commandes et livreurs."
        icone={CoordinateursIcon}
        stats={[
          { valeur: coordinateurs?.length ?? "—", label: "Total" },
          { valeur: actifs ?? "—", label: "Actifs" },
        ]}
        action={
          <button
            type="button"
            onClick={() => setModaleOuverte(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau coordinateur
          </button>
        }
      />

      {modaleOuverte && token ? (
        <ModaleProvisionnerUtilisateur
          role="coordinateur"
          token={token}
          onClose={() => setModaleOuverte(false)}
          onCree={(id) => router.push(`/coordinateurs/${id}`)}
        />
      ) : null}

      <div className="relative w-80">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un coordinateur…"
          className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none"
        />
      </div>

      {coordinateurs === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : coordinateurs.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun coordinateur.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {coordinateurs.map((c) => (
            <Link
              key={c.user_id}
              href={`/coordinateurs/${c.user_id}`}
              className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white p-4 transition-colors hover:border-[color:var(--brand-blue-end)]/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
                <UserAvatarIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-brand-ink">
                    {c.prenom ? `${c.prenom} ` : ""}
                    {c.nom}
                  </p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STYLE_STATUT_COMPTE[c.statut_compte]}`}>
                    {LIBELLE_STATUT_COMPTE[c.statut_compte]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-brand-muted">{c.email ?? c.telephone ?? "—"}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-brand-muted">
                <p>{c.zone_couverte ?? "Zone non renseignée"}</p>
                <p>Depuis {clientDepuisLibelle(c.membre_depuis)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
