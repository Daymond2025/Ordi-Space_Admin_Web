"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import {
  LIBELLE_STATUT_PRODUIT,
  STYLE_STATUT_PRODUIT,
  type Categorie,
  type Produit,
} from "@/lib/types";
import { ChevronLeftIcon, TrashIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";

const OPTIONS_LIVRAISON = [
  { value: "physique", label: "Physique" },
  { value: "numerique", label: "Numérique" },
];

export function EditionProduit({ id }: { id: string }) {
  const router = useRouter();
  const { token, user } = useAuth();

  const [produit, setProduit] = useState<Produit | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieId, setCategorieId] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("");
  const [typeLivraison, setTypeLivraison] = useState<"physique" | "numerique">("physique");
  const [dureeGarantie, setDureeGarantie] = useState("");
  const [nouvellesImages, setNouvellesImages] = useState<FileList | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<Categorie[]>("/categories", { token }).then(setCategories);
    apiFetch<Produit>(`/produits/${id}`, { token }).then((p) => {
      setProduit(p);
      setCategorieId(String(p.categorie.id));
      setNom(p.nom_produit);
      setDescription(p.description ?? "");
      setPrix(p.prix);
      setStock(String(p.quantite_stock));
      setTypeLivraison(p.type_livraison);
      setDureeGarantie(p.duree_garantie_mois ? String(p.duree_garantie_mois) : "");
    });
  }, [token, id]);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setErreur(null);
    setMessage(null);
    setChargement(true);

    try {
      const misAJour = await apiFetch<Produit>(`/produits/${id}`, {
        method: "PUT",
        token,
        body: {
          categorie_id: Number(categorieId),
          nom_produit: nom,
          description: description || null,
          prix: Number(prix),
          quantite_stock: Number(stock),
          type_livraison: typeLivraison,
          duree_garantie_mois: dureeGarantie ? Number(dureeGarantie) : null,
        },
      });
      setProduit(misAJour);
      setMessage("Produit mis à jour.");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer.");
    } finally {
      setChargement(false);
    }
  }

  async function ajouterImages() {
    if (!token || !nouvellesImages || nouvellesImages.length === 0) return;

    setErreur(null);
    setChargement(true);

    const donnees = new FormData();
    Array.from(nouvellesImages).forEach((fichier) => donnees.append("images[]", fichier));

    try {
      await apiFetch(`/produits/${id}/images`, { method: "POST", token, body: donnees });
      const rafraichi = await apiFetch<Produit>(`/produits/${id}`, { token });
      setProduit(rafraichi);
      setNouvellesImages(null);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'ajouter les images.");
    } finally {
      setChargement(false);
    }
  }

  async function supprimerImage(imageId: number) {
    if (!token) return;
    try {
      await apiFetch(`/produits/${id}/images/${imageId}`, { method: "DELETE", token });
      setProduit((p) => (p ? { ...p, images: p.images.filter((img) => img.id !== imageId) } : p));
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de supprimer l'image.");
    }
  }

  async function decider(decision: "valide" | "rejete") {
    if (!token) return;
    const motif = decision === "rejete" ? prompt("Motif du rejet :") : null;
    if (decision === "rejete" && !motif) return;

    setChargement(true);
    try {
      const misAJour = await apiFetch<Produit>(`/produits/${id}/valider`, {
        method: "POST",
        token,
        body: { decision, motif_rejet: motif },
      });
      setProduit(misAJour);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Action impossible.");
    } finally {
      setChargement(false);
    }
  }

  async function supprimerProduit() {
    if (!token || !confirm("Supprimer définitivement ce produit ?")) return;
    try {
      await apiFetch(`/produits/${id}`, { method: "DELETE", token });
      router.push("/operations/produits");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Suppression impossible.");
    }
  }

  if (!produit) {
    return <p className="text-sm text-brand-muted">Chargement…</p>;
  }

  const estAdminProduit = !produit.fournisseur;
  const peutValider = ["en_attente", "corrige"].includes(produit.statut_produit);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-brand-line">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-brand-ink">{produit.nom_produit}</h1>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${STYLE_STATUT_PRODUIT[produit.statut_produit]}`}>
            {LIBELLE_STATUT_PRODUIT[produit.statut_produit]}
          </span>
        </div>

        <div className="flex gap-2">
          {peutValider ? (
            <>
              <button type="button" onClick={() => decider("valide")} className="h-9 rounded-full bg-emerald-500 px-4 text-xs font-semibold text-white">
                Valider
              </button>
              <button type="button" onClick={() => decider("rejete")} className="h-9 rounded-full bg-rose-500 px-4 text-xs font-semibold text-white">
                Rejeter
              </button>
            </>
          ) : null}
          {user?.type_utilisateur === "administrateur" ? (
            <button type="button" onClick={supprimerProduit} className="flex h-9 items-center gap-1.5 rounded-full bg-brand-line px-4 text-xs font-semibold text-brand-muted">
              <TrashIcon className="h-3.5 w-3.5" />
              Supprimer
            </button>
          ) : null}
        </div>
      </div>

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{message}</p> : null}

      <div className="rounded-2xl border border-brand-line bg-white p-6">
        <p className="text-sm font-bold text-brand-ink">Images</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {produit.images.map((img) => (
            <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-brand-line">
              <Image src={img.url_image} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => supprimerImage(img.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <input type="file" multiple accept="image/*" onChange={(e) => setNouvellesImages(e.target.files)} className="text-sm" />
          <button
            type="button"
            onClick={ajouterImages}
            disabled={!nouvellesImages || chargement}
            className="h-9 rounded-full bg-brand-ink px-4 text-xs font-semibold text-white disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      </div>

      <form onSubmit={enregistrer} className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
        {!estAdminProduit ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Produit d&apos;un fournisseur — seule la validation/le rejet est disponible ici, pas la modification de la fiche.
          </p>
        ) : null}

        <fieldset disabled={!estAdminProduit} className="flex flex-col gap-4 disabled:opacity-60">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Catégorie</label>
              <Listbox value={categorieId} onChange={setCategorieId} options={categories.map((c) => ({ value: String(c.id), label: c.nom_categorie }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Type de livraison</label>
              <Listbox value={typeLivraison} onChange={(v) => setTypeLivraison(v as "physique" | "numerique")} options={OPTIONS_LIVRAISON} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Nom du produit</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-xl border border-brand-line px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Prix (CFA)</label>
              <input type="number" min="0" value={prix} onChange={(e) => setPrix(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Stock</label>
              <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Garantie (mois)</label>
              <input type="number" min="0" value={dureeGarantie} onChange={(e) => setDureeGarantie(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            </div>
          </div>

          <button type="submit" disabled={chargement} className="bg-gradient-brand-blue mt-2 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60">
            {chargement ? "Enregistrement…" : "Enregistrer"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
