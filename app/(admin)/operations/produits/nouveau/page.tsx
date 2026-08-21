"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type { Categorie, Produit } from "@/lib/types";
import { ChevronLeftIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";

const OPTIONS_LIVRAISON = [
  { value: "physique", label: "Physique" },
  { value: "numerique", label: "Numérique" },
];

export default function NouveauProduitPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieId, setCategorieId] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("");
  const [typeLivraison, setTypeLivraison] = useState<"physique" | "numerique">("physique");
  const [dureeGarantie, setDureeGarantie] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<Categorie[]>("/categories", { token }).then(setCategories);
  }, [token]);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (!categorieId) {
      setErreur("Choisissez une catégorie.");
      return;
    }

    setErreur(null);
    setChargement(true);

    const donnees = new FormData();
    donnees.append("categorie_id", categorieId);
    donnees.append("nom_produit", nom);
    if (description) donnees.append("description", description);
    donnees.append("prix", prix);
    donnees.append("quantite_stock", stock);
    donnees.append("type_livraison", typeLivraison);
    if (dureeGarantie) donnees.append("duree_garantie_mois", dureeGarantie);
    if (images) {
      Array.from(images).forEach((fichier) => donnees.append("images[]", fichier));
    }

    try {
      const produit = await apiFetch<Produit>("/produits", { method: "POST", token, body: donnees });
      router.push(`/operations/produits/${produit.id}`);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de créer le produit.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-brand-ink">Nouveau produit</h1>
      </div>

      <form onSubmit={soumettre} className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Catégorie</label>
            <Listbox
              value={categorieId}
              onChange={setCategorieId}
              placeholder="Choisir…"
              options={categories.map((c) => ({ value: String(c.id), label: c.nom_categorie }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Type de livraison</label>
            <Listbox value={typeLivraison} onChange={(v) => setTypeLivraison(v as "physique" | "numerique")} options={OPTIONS_LIVRAISON} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Nom du produit</label>
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded-xl border border-brand-line px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Prix (CFA)</label>
            <input required type="number" min="0" value={prix} onChange={(e) => setPrix(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Stock</label>
            <input required type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Garantie (mois)</label>
            <input type="number" min="0" value={dureeGarantie} onChange={(e) => setDureeGarantie(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Images</label>
          <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} className="text-sm" />
        </div>

        {erreur ? <p className="text-sm text-rose-600">{erreur}</p> : null}

        <button
          type="submit"
          disabled={chargement}
          className="bg-gradient-brand-blue mt-2 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60"
        >
          {chargement ? "Création…" : "Créer le produit"}
        </button>
      </form>
    </div>
  );
}
