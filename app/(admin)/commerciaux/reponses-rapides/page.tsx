"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { ReponseRapide } from "@/lib/types";
import { ChatIcon, ChevronRightIcon, PlusIcon, StarIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS = [
  { id: "tous", label: "Toutes" },
  { id: "favoris", label: "Favoris" },
] as const;

/**
 * "Réponses rapides" (Espace Commercial) — bibliothèque lue par l'app
 * Commercial (EcranReponseRapide.tsx), entièrement alimentée ici par
 * l'Admin (demande explicite). `est_favori` : mis en avant côté app, pas un
 * favori personnel par commercial. `nombre_copies` : compteur réel
 * (incrémenté par l'app à chaque "Copier"), affiché ici en lecture seule.
 */
export default function ReponsesRapidesPage() {
  const { token } = useAuth();
  const [reponses, setReponses] = useState<ReponseRapide[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<ReponseRapide[]>("/reponses-rapides", { token })
      .then((data) => {
        setReponses(data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token]);

  useEffect(charger, [charger]);

  const listeFiltree = useMemo(
    () => (onglet === "favoris" ? reponses?.filter((r) => r.est_favori) ?? null : reponses),
    [reponses, onglet]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Réponses rapides"
        description="Bibliothèque de réponses prêtes à l'emploi pour les commerciaux — vous seul pouvez en ajouter ou en modifier."
        icone={ChatIcon}
        stats={[
          { valeur: reponses?.length ?? "—", label: "Total" },
          { valeur: reponses?.filter((r) => r.est_favori).length ?? "—", label: "Favorites" },
          { valeur: reponses?.reduce((s, r) => s + r.nombre_copies, 0) ?? "—", label: "Copies cumulées" },
        ]}
        action={
          <Link
            href="/commerciaux/reponses-rapides/nouveau"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle réponse
          </Link>
        }
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

      {erreur ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-rose-600">Impossible de charger les réponses rapides.</p>
          <button type="button" onClick={charger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
            Réessayer
          </button>
        </div>
      ) : listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune réponse rapide dans cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {listeFiltree.map((reponse) => (
            <Link
              key={reponse.id}
              href={`/commerciaux/reponses-rapides/${reponse.id}`}
              className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-brand-ink">{reponse.titre}</p>
                  {reponse.est_favori ? <StarIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" /> : null}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-brand-muted">{reponse.contenu}</p>
              </div>
              <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--brand-blue-end)]">
                {reponse.nombre_copies} copie{reponse.nombre_copies === 1 ? "" : "s"}
              </span>
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
