"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDate, LIBELLE_STATUT_PRODUIT, type Categorie, type Pagination, type Produit, type ProduitActifCoordinateur, type StatutProduit } from "@/lib/types";
import {
  BagIcon,
  CalendarIcon,
  CashIcon,
  ChatIcon,
  ImagePlaceholderIcon,
  OperationsIcon,
  PlusIcon,
  TriangleAlerteIcon,
} from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const COULEUR_STATUT: Record<StatutProduit, string> = {
  en_attente: "#F59E0B",
  valide: "#10B981",
  rejete: "#EF4444",
  corrige: "#0077FF",
};

function CarteAction({ href, titre, description, icone: Icone, couleur }: { href: string; titre: string; description: string; icone: typeof PlusIcon; couleur: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4 transition-colors hover:border-[color:var(--brand-blue-end)]/40">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${couleur}`}>
        <Icone className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-brand-ink">{titre}</p>
        <p className="truncate text-xs text-brand-muted">{description}</p>
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

export default function OperationsPage() {
  const { token } = useAuth();
  const [produits, setProduits] = useState<Produit[] | null>(null);
  const [categories, setCategories] = useState<Categorie[] | null>(null);
  const [activite, setActivite] = useState<ProduitActifCoordinateur[] | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<Produit>>("/produits?statut=tous&per_page=100", { token }).then((page) => setProduits(page.data));
    apiFetch<Categorie[]>("/categories", { token }).then(setCategories);
    apiFetch<ProduitActifCoordinateur[]>("/produits/activite-recente", { token }).then(setActivite);
  }, [token]);

  const parStatut = useMemo(() => {
    if (!produits) return null;
    return {
      en_attente: produits.filter((p) => p.statut_produit === "en_attente").length,
      valide: produits.filter((p) => p.statut_produit === "valide").length,
      rejete: produits.filter((p) => p.statut_produit === "rejete").length,
      corrige: produits.filter((p) => p.statut_produit === "corrige").length,
    };
  }, [produits]);

  const conversationsActives = activite?.filter((a) => a.nouvelles_activites > 0).length ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Operations"
        description="Catalogue produits, catégories, et conversations sur les commandes."
        icone={OperationsIcon}
        stats={[
          { valeur: produits?.length ?? "—", label: "Produits" },
          { valeur: parStatut?.en_attente ?? "—", label: "À valider" },
          { valeur: categories?.length ?? "—", label: "Catégories" },
          { valeur: conversationsActives ?? "—", label: "Conversations actives" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CarteAction
          href="/operations/produits/nouveau"
          titre="Nouveau produit"
          description="Ajouter une fiche au catalogue"
          icone={PlusIcon}
          couleur="bg-blue-50 text-[color:var(--brand-blue-end)]"
        />
        <CarteAction
          href="/operations/categories"
          titre="Nouvelle catégorie"
          description="Ranger le catalogue"
          icone={OperationsIcon}
          couleur="bg-violet-50 text-violet-600"
        />
        <CarteAction
          href="/operations/produits"
          titre="Voir le catalogue"
          description={`${produits?.length ?? "—"} produits, tous statuts`}
          icone={BagIcon}
          couleur="bg-emerald-50 text-emerald-600"
        />
        <CarteAction
          href="/operations/produits?statut=en_attente"
          titre="File de validation"
          description={`${parStatut?.en_attente ?? "—"} produit(s) en attente`}
          icone={TriangleAlerteIcon}
          couleur="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <p className="text-sm font-bold text-brand-ink">Répartition des produits par statut</p>
          <div className="mt-4">
            {parStatut ? (
              <RepartitionBarre
                items={[
                  { label: LIBELLE_STATUT_PRODUIT.valide, valeur: parStatut.valide, couleur: COULEUR_STATUT.valide },
                  { label: LIBELLE_STATUT_PRODUIT.en_attente, valeur: parStatut.en_attente, couleur: COULEUR_STATUT.en_attente },
                  { label: LIBELLE_STATUT_PRODUIT.corrige, valeur: parStatut.corrige, couleur: COULEUR_STATUT.corrige },
                  { label: LIBELLE_STATUT_PRODUIT.rejete, valeur: parStatut.rejete, couleur: COULEUR_STATUT.rejete },
                ]}
              />
            ) : (
              <p className="py-4 text-center text-sm text-brand-muted">Chargement…</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-line bg-white p-5">
          <p className="text-sm font-bold text-brand-ink">Catalogue</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F7F9FC] p-3">
              <p className="text-xl font-extrabold text-brand-ink">{produits?.filter((p) => p.fournisseur).length ?? "—"}</p>
              <p className="text-xs text-brand-muted">Produits fournisseurs</p>
            </div>
            <div className="rounded-xl bg-[#F7F9FC] p-3">
              <p className="text-xl font-extrabold text-brand-ink">{produits?.filter((p) => !p.fournisseur).length ?? "—"}</p>
              <p className="text-xs text-brand-muted">Publiés par Ordi&apos;Space</p>
            </div>
            <div className="rounded-xl bg-[#F7F9FC] p-3">
              <p className="text-xl font-extrabold text-brand-ink">{produits?.filter((p) => p.quantite_stock <= 0).length ?? "—"}</p>
              <p className="text-xs text-brand-muted">Indisponibles (stock)</p>
            </div>
            <div className="rounded-xl bg-[#F7F9FC] p-3">
              <p className="text-xl font-extrabold text-brand-ink">{produits?.filter((p) => p.est_booste).length ?? "—"}</p>
              <p className="text-xs text-brand-muted">Boostés</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ChatIcon className="h-4 w-4 text-brand-muted" />
          <h2 className="text-sm font-bold text-brand-ink">Conversations récentes sur les commandes</h2>
        </div>

        {activite === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : activite.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune activité récente pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activite.map((produit) => (
              <Link
                key={produit.produit_id}
                href={`/operations/produits/${produit.produit_id}/conversation`}
                className="flex gap-3 rounded-2xl border border-brand-line bg-white p-4 transition-colors hover:border-[color:var(--brand-blue-end)]/40"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
                  {produit.photo ? (
                    <Image src={produit.photo} alt="" fill className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-brand-muted">
                      <ImagePlaceholderIcon className="h-6 w-6" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
                    {produit.nouvelles_activites > 0 ? (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {produit.nouvelles_activites}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-brand-muted">
                    <CashIcon className="h-3.5 w-3.5" />
                    {produit.statistiques.recues} reçues · {produit.statistiques.livrees} livrées · {produit.statistiques.annulees} annulées
                  </p>
                  {produit.derniere_activite ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-brand-muted">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      Dernière activité : {formaterDate(produit.derniere_activite)}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
