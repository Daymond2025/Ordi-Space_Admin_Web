"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { Pagination, Tutoriel } from "@/lib/types";
import { GraduationCapIcon, ImagePlaceholderIcon, PlayIcon, PlusIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

/**
 * Formations spécifiques de vente — contenus (vidéo YouTube et/ou texte)
 * visibles des seuls commerciaux, dans l'écran « Formation » de leur app.
 * Mêmes tutoriels que l'Academy Space des clients (TutorielController),
 * type "formation_vente".
 */
export default function FormationsVentePage() {
  const { token } = useAuth();
  const [formations, setFormations] = useState<Tutoriel[] | null>(null);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    if (!token) return;
    apiFetch<Pagination<Tutoriel>>("/tutoriels?type=formation_vente&per_page=100", { token })
      .then((page) => {
        setFormations(page.data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token]);

  useEffect(charger, [charger]);

  const publiees = formations?.filter((f) => f.statut === "publie").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Formations de vente"
        description="Formations spécifiques de vente, visibles uniquement des commerciaux dans leur application."
        icone={GraduationCapIcon}
        stats={[
          { valeur: formations?.length ?? "—", label: "Total" },
          { valeur: formations ? publiees : "—", label: "Publiées" },
        ]}
        action={
          <Link
            href="/commerciaux/formations/nouvelle"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle formation
          </Link>
        }
      />

      {erreur ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-rose-600">Impossible de charger les formations.</p>
          <button type="button" onClick={charger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
            Réessayer
          </button>
        </div>
      ) : formations === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : formations.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune formation de vente pour le moment.</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {formations.map((formation) => (
            <div key={formation.id} className="flex flex-col overflow-hidden rounded-2xl border border-brand-line bg-white">
              <div className="relative aspect-video w-full bg-[#EEF1F6]">
                {formation.image_couverture ? (
                  <Image src={formation.image_couverture} alt="" fill className="object-cover" />
                ) : formation.id_video_youtube ? (
                  <Image src={`https://i.ytimg.com/vi/${formation.id_video_youtube}/hqdefault.jpg`} alt="" fill className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-brand-muted">
                    <ImagePlaceholderIcon className="h-8 w-8" />
                  </span>
                )}
                {formation.id_video_youtube ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-ink">
                      <PlayIcon className="h-4 w-4" />
                    </span>
                  </span>
                ) : null}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    formation.statut === "publie" ? "bg-emerald-100 text-emerald-600" : "bg-white/90 text-brand-muted"
                  }`}
                >
                  {formation.statut === "publie" ? "Publiée" : "Brouillon"}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1 p-4">
                <p className="line-clamp-2 text-sm font-bold text-brand-ink">{formation.titre}</p>
                <Link
                  href={`/clients/contenu/${formation.id}`}
                  className="mt-auto flex h-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white"
                >
                  Voir
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
