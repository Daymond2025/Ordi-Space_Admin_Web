"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { LivreurAdmin } from "@/lib/types";
import { LivreursIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";
import { ModaleProvisionnerUtilisateur } from "@/components/ModaleProvisionnerUtilisateur";

const ONGLETS = [
  { id: "tous", label: "Tous" },
  { id: "disponible", label: "Disponible" },
  { id: "occupe", label: "Occupé" },
] as const;

/**
 * Miroir admin de Cordinateur_App_Web/EcranLivreurs.tsx — GET
 * /coordinateur/livreurs (déjà accessible à l'Admin depuis le correctif de
 * rôle) renvoie un tableau brut, pas une pagination.
 */
export default function LivreursListePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [livreurs, setLivreurs] = useState<LivreurAdmin[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");
  const [recherche, setRecherche] = useState("");
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<LivreurAdmin[]>("/coordinateur/livreurs", { token })
      .then((data) => {
        setLivreurs(data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token]);

  useEffect(charger, [charger]);

  const listeFiltree = useMemo(() => {
    if (!livreurs) return null;
    const terme = recherche.trim().toLowerCase();
    return livreurs.filter((l) => {
      if (onglet === "disponible" && !l.disponible) return false;
      if (onglet === "occupe" && l.disponible) return false;
      if (!terme) return true;
      return `${l.prenom ?? ""} ${l.nom}`.toLowerCase().includes(terme);
    });
  }, [livreurs, onglet, recherche]);

  const disponibles = livreurs?.filter((l) => l.disponible).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Livreurs"
        description="Disponibilité et missions des livreurs pilotés par le Coordinateur."
        icone={LivreursIcon}
        stats={[
          { valeur: livreurs?.length ?? "—", label: "Total" },
          { valeur: disponibles, label: "Disponibles" },
        ]}
        action={
          <button
            type="button"
            onClick={() => setModaleOuverte(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau livreur
          </button>
        }
      />

      {modaleOuverte && token ? (
        <ModaleProvisionnerUtilisateur
          role="livreur"
          token={token}
          onClose={() => setModaleOuverte(false)}
          onCree={(id) => router.push(`/livreurs/${id}`)}
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
            placeholder="Rechercher un livreur…"
            className="w-full rounded-full border border-brand-line bg-white py-2.5 pl-10 pr-4 text-sm text-brand-ink outline-none"
          />
        </div>
      </div>

      {erreur ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-rose-600">Impossible de charger les livreurs.</p>
          <button type="button" onClick={charger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
            Réessayer
          </button>
        </div>
      ) : listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun livreur dans cette catégorie.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {listeFiltree.map((livreur) => (
            <Link
              key={livreur.user_id}
              href={`/livreurs/${livreur.user_id}`}
              className="flex flex-col gap-2 rounded-2xl border border-brand-line bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <p className="truncate text-sm font-bold text-brand-ink">
                  {livreur.prenom ? `${livreur.prenom} ` : ""}
                  {livreur.nom}
                </p>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${livreur.disponible ? "bg-green-500" : "bg-orange-500"}`} />
              </div>
              <p className="text-xs text-brand-muted">{livreur.type_vehicule ?? "Véhicule non renseigné"}</p>
              <p className="text-xs text-brand-muted">{livreur.zone_couverture ?? "Zone non renseignée"}</p>
              {livreur.telephone ? <p className="text-xs text-brand-muted">{livreur.telephone}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
