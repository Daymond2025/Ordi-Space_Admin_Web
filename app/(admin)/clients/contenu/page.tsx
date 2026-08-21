"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { LIBELLE_TYPE_TUTORIEL, type Pagination, type Tutoriel, type TypeTutoriel } from "@/lib/types";
import { GraduationCapIcon, ImagePlaceholderIcon, PlayIcon, PlusIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS: { id: TypeTutoriel | "tous"; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "tutoriel_rapide", label: "Tutos rapides" },
  { id: "formation", label: "Formations" },
];

export default function ContenuPage() {
  const { token } = useAuth();
  const [contenus, setContenus] = useState<Tutoriel[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<Tutoriel>>("/tutoriels?per_page=100", { token }).then((page) => setContenus(page.data));
  }, [token]);

  const listeFiltree = useMemo(
    () => (onglet === "tous" ? contenus : (contenus?.filter((c) => c.type === onglet) ?? null)),
    [contenus, onglet]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Tutos & Formations"
        description="Academy Space — contenus vidéo et articles publiés aux clients."
        icone={GraduationCapIcon}
        stats={[
          { valeur: contenus?.length ?? "—", label: "Total" },
          { valeur: contenus?.filter((c) => c.type === "tutoriel_rapide").length ?? "—", label: "Tutos rapides" },
          { valeur: contenus?.filter((c) => c.type === "formation").length ?? "—", label: "Formations" },
        ]}
        action={
          <Link
            href="/clients/contenu/nouveau"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau contenu
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

      {listeFiltree === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : listeFiltree.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun contenu dans cette catégorie.</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {listeFiltree.map((contenu) => (
            <div key={contenu.id} className="flex flex-col overflow-hidden rounded-2xl border border-brand-line bg-white">
              <div className="relative aspect-video w-full bg-[#EEF1F6]">
                {contenu.image_couverture ? (
                  <Image src={contenu.image_couverture} alt="" fill className="object-cover" />
                ) : contenu.id_video_youtube ? (
                  <Image src={`https://i.ytimg.com/vi/${contenu.id_video_youtube}/hqdefault.jpg`} alt="" fill className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-brand-muted">
                    <ImagePlaceholderIcon className="h-8 w-8" />
                  </span>
                )}
                {contenu.id_video_youtube ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-ink">
                      <PlayIcon className="h-4 w-4" />
                    </span>
                  </span>
                ) : null}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    contenu.statut === "publie" ? "bg-emerald-100 text-emerald-600" : "bg-white/90 text-brand-muted"
                  }`}
                >
                  {contenu.statut === "publie" ? "Publié" : "Brouillon"}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1 p-4">
                <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--brand-blue-end)]">
                  {LIBELLE_TYPE_TUTORIEL[contenu.type]}
                </span>
                <p className="mt-1 line-clamp-2 text-sm font-bold text-brand-ink">{contenu.titre}</p>

                <Link
                  href={`/clients/contenu/${contenu.id}`}
                  className="mt-3 flex h-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white"
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
