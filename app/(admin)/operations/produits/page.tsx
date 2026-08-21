"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  formaterPrix,
  LIBELLE_STATUT_PRODUIT,
  STYLE_STATUT_PRODUIT,
  type Pagination,
  type Produit,
  type StatutProduit,
} from "@/lib/types";
import { ImagePlaceholderIcon, OperationsIcon, PlusIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS: { id: StatutProduit | "tous"; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "valide", label: "Validés" },
  { id: "rejete", label: "Rejetés" },
  { id: "corrige", label: "Corrigés" },
];

export default function ProduitsPage() {
  const { token } = useAuth();
  const [produits, setProduits] = useState<Produit[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<Produit>>("/produits?per_page=100", { token }).then((page) => setProduits(page.data));
  }, [token]);

  const listeFiltree = useMemo(
    () => (onglet === "tous" ? produits : (produits?.filter((p) => p.statut_produit === onglet) ?? null)),
    [produits, onglet]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Produits"
        description="Catalogue publié aux clients — fiches admin et fournisseurs."
        icone={OperationsIcon}
        stats={[
          { valeur: produits?.length ?? "—", label: "Total" },
          { valeur: produits?.filter((p) => p.statut_produit === "valide").length ?? "—", label: "Validés" },
          { valeur: produits?.filter((p) => p.statut_produit === "en_attente").length ?? "—", label: "En attente" },
        ]}
        action={
          <Link
            href="/operations/produits/nouveau"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau produit
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
        <p className="py-10 text-center text-sm text-brand-muted">Aucun produit dans cette catégorie.</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {listeFiltree.map((produit) => (
            <div key={produit.id} className="flex flex-col overflow-hidden rounded-2xl border border-brand-line bg-white">
              <div className="relative aspect-square w-full bg-[#EEF1F6]">
                {produit.images[0] ? (
                  <Image src={produit.images[0].url_image} alt="" fill className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-brand-muted">
                    <ImagePlaceholderIcon className="h-8 w-8" />
                  </span>
                )}
                <span
                  className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${STYLE_STATUT_PRODUIT[produit.statut_produit]}`}
                >
                  {LIBELLE_STATUT_PRODUIT[produit.statut_produit]}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1 p-4">
                <p className="truncate text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
                <p className="truncate text-xs text-brand-muted">{produit.categorie.nom_categorie}</p>
                <p className="mt-1 text-sm font-semibold text-brand-ink">{formaterPrix(produit.prix)} CFA</p>
                <p className="text-[11px] text-brand-muted">{produit.fournisseur ? produit.fournisseur.nom_entreprise : "Admin"}</p>

                <Link
                  href={`/operations/produits/${produit.id}`}
                  className="mt-3 flex h-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white"
                >
                  Voir détails
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
