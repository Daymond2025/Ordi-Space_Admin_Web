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

const ONGLETS: { id: StatutProduit | "tous" | "indisponible"; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "en_attente", label: "En attente" },
  { id: "valide", label: "Validés" },
  { id: "rejete", label: "Rejetés" },
  { id: "corrige", label: "Corrigés" },
  { id: "indisponible", label: "Indisponible" },
];

export default function ProduitsPage() {
  const { token } = useAuth();
  const [produits, setProduits] = useState<Produit[] | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("tous");
  const [fournisseurId, setFournisseurId] = useState<number | "tous">("tous");
  const [enCoursBoost, setEnCoursBoost] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    // ?statut=tous : sans ce paramètre, le backend applique la file d'attente
    // de validation par défaut (en_attente + corrige) — voir
    // ProduitController::filtrerCatalogueCoordinateur(), désormais aussi
    // appliqué à l'Admin. Cette page charge tout une fois, puis filtre les
    // onglets côté client (y compris "Indisponible", basé sur le stock).
    apiFetch<Pagination<Produit>>("/produits?statut=tous&per_page=100", { token }).then((page) => setProduits(page.data));
  }, [token]);

  const fournisseurs = useMemo(() => {
    if (!produits) return [];
    const uniques = new Map<number, string>();
    produits.forEach((p) => {
      if (p.fournisseur) uniques.set(p.fournisseur.id, p.fournisseur.nom_entreprise);
    });
    return Array.from(uniques.entries()).map(([id, nom]) => ({ id, nom }));
  }, [produits]);

  const listeFiltree = useMemo(() => {
    if (!produits) return null;
    return produits.filter((p) => {
      if (onglet === "indisponible" && p.quantite_stock > 0) return false;
      if (onglet !== "tous" && onglet !== "indisponible" && p.statut_produit !== onglet) return false;
      if (fournisseurId !== "tous" && p.fournisseur?.id !== fournisseurId) return false;
      return true;
    });
  }, [produits, onglet, fournisseurId]);

  async function basculerBoost(produit: Produit) {
    if (!token || enCoursBoost !== null) return;
    setEnCoursBoost(produit.id);
    try {
      await apiFetch(`/produits/${produit.id}/booster`, { method: "PATCH", token, body: { est_booste: !produit.est_booste } });
      setProduits((prev) => prev?.map((p) => (p.id === produit.id ? { ...p, est_booste: !p.est_booste } : p)) ?? null);
    } finally {
      setEnCoursBoost(null);
    }
  }

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
          { valeur: produits?.filter((p) => p.est_booste).length ?? "—", label: "Boostés" },
          { valeur: produits?.filter((p) => p.quantite_stock <= 0).length ?? "—", label: "Indisponibles" },
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

        {fournisseurs.length > 0 ? (
          <select
            value={fournisseurId}
            onChange={(e) => setFournisseurId(e.target.value === "tous" ? "tous" : Number(e.target.value))}
            className="rounded-full border border-brand-line bg-white px-4 py-2 text-xs font-semibold text-brand-ink outline-none"
          >
            <option value="tous">Tous les fournisseurs</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        ) : null}
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
                {produit.quantite_stock <= 0 ? (
                  <span className="absolute right-2 top-2 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold text-rose-600">
                    Indisponible
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-1 p-4">
                <p className="truncate text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
                <p className="truncate text-xs text-brand-muted">{produit.categorie.nom_categorie}</p>
                <p className="mt-1 text-sm font-semibold text-brand-ink">{formaterPrix(produit.prix)} CFA</p>
                <p className="text-[11px] text-brand-muted">{produit.fournisseur ? produit.fournisseur.nom_entreprise : "Admin"}</p>

                <button
                  type="button"
                  onClick={() => basculerBoost(produit)}
                  disabled={enCoursBoost === produit.id}
                  className={`mt-2 flex h-8 items-center justify-center rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                    produit.est_booste ? "bg-orange-50 text-orange-600" : "border border-brand-line text-brand-muted"
                  }`}
                >
                  {produit.est_booste ? "Boosté ★" : "Booster"}
                </button>

                <Link
                  href={`/operations/produits/${produit.id}`}
                  className="mt-1 flex h-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white"
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
