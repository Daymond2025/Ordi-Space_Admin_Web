"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type { Categorie, Produit } from "@/lib/types";
import { CheckIcon, ChevronLeftIcon, ImagePlaceholderIcon, XIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";
import { AjoutCategorieRapide } from "@/components/AjoutCategorieRapide";
import {
  CHAMPS_BOUTIQUE_VIDES,
  SectionCadeauxPack,
  SectionCaracteristiques,
  SectionFraisLivraison,
  SectionVente,
  champsVersFormData,
  type ChampsBoutique,
} from "@/components/ChampsBoutiqueProduit";

const OPTIONS_LIVRAISON = [
  { value: "physique", label: "Physique" },
  { value: "numerique", label: "Numérique" },
];

const CHAMP = "h-11 w-full rounded-xl border border-brand-line px-3 text-sm";

type Etape = {
  id: string;
  titre: string;
  sousTitre: string;
};

const ETAPE_LIVRAISON: Etape = { id: "pack", titre: "Cadeaux, pack & livraison", sousTitre: "Incitations et zones livrées" };
const ETAPE_LIVRAISON_NUMERIQUE: Etape = { id: "pack", titre: "Cadeaux & pack", sousTitre: "Incitations marketing" };

const ETAPES_BASE: Etape[] = [
  { id: "infos", titre: "Informations générales", sousTitre: "Catégorie, nom, description" },
  { id: "prix", titre: "Prix & vente", sousTitre: "Prix, stock, revente livreurs" },
  { id: "caracteristiques", titre: "Caractéristiques", sousTitre: "Fiche technique" },
];

function Etiquette({ children }: { children: ReactNode }) {
  return <label className="text-xs font-medium text-brand-muted">{children}</label>;
}

/** Indicateur d'étapes — cercles numérotés reliés par un trait, coché une fois dépassé. */
function IndicateurEtapes({ etapes, etapeActuelle }: { etapes: Etape[]; etapeActuelle: number }) {
  return (
    <div className="flex items-center">
      {etapes.map((etape, i) => {
        const atteint = i <= etapeActuelle;
        const complet = i < etapeActuelle;
        return (
          <div key={etape.id} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  atteint ? "bg-gradient-brand-blue text-white" : "border-2 border-brand-line bg-white text-brand-muted"
                }`}
              >
                {complet ? <CheckIcon className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-center text-[11px] font-semibold sm:block ${atteint ? "text-brand-ink" : "text-brand-muted"}`}>
                {etape.titre}
              </span>
            </div>
            {i < etapes.length - 1 ? (
              <span className="mx-2 h-0.5 flex-1 rounded-full" style={{ background: i < etapeActuelle ? "var(--color-brand-blue-end, #1d63e0)" : "var(--color-brand-line)" }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * `titre`/`sousTitre` omis pour les étapes qui n'enveloppent qu'une seule
 * Section (elle porte déjà son propre en-tête) — évite de répéter le même
 * texte deux fois.
 */
function Carte({ titre, sousTitre, children }: { titre?: string; sousTitre?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-brand-line bg-white p-6 sm:p-8">
      {titre ? (
        <div>
          <h2 className="text-lg font-bold text-brand-ink">{titre}</h2>
          {sousTitre ? <p className="mt-0.5 text-sm text-brand-muted">{sousTitre}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

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
  const [boutique, setBoutique] = useState<ChampsBoutique>(CHAMPS_BOUTIQUE_VIDES);
  const [images, setImages] = useState<File[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurEtape, setErreurEtape] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [etapeActuelle, setEtapeActuelle] = useState(0);

  useEffect(() => {
    if (!token) return;
    apiFetch<Categorie[]>("/categories", { token }).then(setCategories);
  }, [token]);

  const etapes = useMemo(
    () => [...ETAPES_BASE, typeLivraison === "physique" ? ETAPE_LIVRAISON : ETAPE_LIVRAISON_NUMERIQUE, { id: "images", titre: "Photos", sousTitre: "Visuels du produit" }],
    [typeLivraison]
  );
  const derniereEtape = etapeActuelle === etapes.length - 1;

  const apercusImages = useMemo(() => images.map((fichier) => ({ fichier, url: URL.createObjectURL(fichier) })), [images]);
  useEffect(() => () => apercusImages.forEach((a) => URL.revokeObjectURL(a.url)), [apercusImages]);

  function ajouterImages(liste: FileList | null) {
    if (!liste) return;
    setImages((courant) => [...courant, ...Array.from(liste)]);
  }

  function retirerImage(index: number) {
    setImages((courant) => courant.filter((_, i) => i !== index));
  }

  function valider(): boolean {
    if (etapeActuelle === 0) {
      if (!categorieId) return (setErreurEtape("Choisissez une catégorie."), false);
      if (!nom.trim()) return (setErreurEtape("Le nom du produit est obligatoire."), false);
    }
    if (etapeActuelle === 1) {
      if (!prix.trim()) return (setErreurEtape("Le prix est obligatoire."), false);
      if (!stock.trim()) return (setErreurEtape("Le stock est obligatoire."), false);
    }
    setErreurEtape(null);
    return true;
  }

  function suivant() {
    if (!valider()) return;
    setEtapeActuelle((e) => Math.min(etapes.length - 1, e + 1));
  }

  function precedent() {
    setErreurEtape(null);
    setEtapeActuelle((e) => Math.max(0, e - 1));
  }

  async function creerProduit() {
    if (!token || !valider()) return;

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
    champsVersFormData(donnees, boutique);
    images.forEach((fichier) => donnees.append("images[]", fichier));

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Nouveau produit</h1>
          <p className="text-sm text-brand-muted">
            Étape {etapeActuelle + 1} sur {etapes.length} — {etapes[etapeActuelle].titre}
          </p>
        </div>
      </div>

      <IndicateurEtapes etapes={etapes} etapeActuelle={etapeActuelle} />

      {etapeActuelle === 0 ? (
        <Carte titre="Informations générales" sousTitre="Catégorie, nom, description et type de livraison">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Etiquette>Catégorie</Etiquette>
              <Listbox
                value={categorieId}
                onChange={setCategorieId}
                placeholder="Choisir…"
                options={categories.map((c) => ({ value: String(c.id), label: c.nom_categorie }))}
              />
              <AjoutCategorieRapide
                token={token}
                onCreee={(categorie) => {
                  setCategories((liste) => [...liste, categorie]);
                  setCategorieId(String(categorie.id));
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Etiquette>Type de livraison</Etiquette>
              <Listbox value={typeLivraison} onChange={(v) => setTypeLivraison(v as "physique" | "numerique")} options={OPTIONS_LIVRAISON} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Etiquette>Nom du produit</Etiquette>
            <input value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} placeholder="Ex. HP EliteBook 840 G5 Core i5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Etiquette>Description</Etiquette>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-xl border border-brand-line px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Etiquette>Garantie (mois)</Etiquette>
              <input type="number" min="0" value={dureeGarantie} onChange={(e) => setDureeGarantie(e.target.value)} className={CHAMP} placeholder="Ex. 12" />
            </div>
          </div>
        </Carte>
      ) : null}

      {etapeActuelle === 1 ? (
        <Carte titre="Prix & vente" sousTitre="Prix d'achat, stock, et conditions de revente par les livreurs">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Etiquette>Prix (CFA)</Etiquette>
              <input type="number" min="0" value={prix} onChange={(e) => setPrix(e.target.value)} className={CHAMP} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Etiquette>Stock</Etiquette>
              <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className={CHAMP} />
            </div>
          </div>

          <SectionVente valeurs={boutique} onChange={setBoutique} />
        </Carte>
      ) : null}

      {etapeActuelle === 2 ? (
        <Carte>
          <SectionCaracteristiques valeurs={boutique} onChange={setBoutique} />
        </Carte>
      ) : null}

      {etapeActuelle === 3 ? (
        <Carte
          titre={typeLivraison === "physique" ? "Cadeaux, pack & livraison" : "Cadeaux & pack"}
          sousTitre="Incitations marketing, contenu du carton, zones livrées"
        >
          <SectionCadeauxPack valeurs={boutique} onChange={setBoutique} />
          {typeLivraison === "physique" ? <SectionFraisLivraison valeurs={boutique} onChange={setBoutique} token={token} /> : null}
        </Carte>
      ) : null}

      {etapeActuelle === 4 ? (
        <Carte titre="Photos" sousTitre="Au moins une photo est recommandée avant publication">
          <div className="flex flex-col gap-3">
            <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-line text-brand-muted hover:border-[color:var(--brand-blue-end)] hover:text-[color:var(--brand-blue-end)]">
              <ImagePlaceholderIcon className="h-7 w-7" />
              <span className="text-sm font-semibold">Ajouter des photos</span>
              <input type="file" multiple accept="image/*" onChange={(e) => ajouterImages(e.target.files)} className="hidden" />
            </label>

            {apercusImages.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {apercusImages.map((a, i) => (
                  <div key={a.url} className="relative aspect-square overflow-hidden rounded-xl border border-brand-line bg-[#EEF1F6]">
                    <Image src={a.url} alt="" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => retirerImage(i)}
                      aria-label="Retirer cette photo"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-[#F7F9FC] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Récapitulatif</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <p className="text-brand-muted">Produit</p>
              <p className="text-right font-semibold text-brand-ink">{nom || "—"}</p>
              <p className="text-brand-muted">Catégorie</p>
              <p className="text-right font-semibold text-brand-ink">
                {categories.find((c) => String(c.id) === categorieId)?.nom_categorie ?? "—"}
              </p>
              <p className="text-brand-muted">Prix</p>
              <p className="text-right font-semibold text-brand-ink">{prix ? `${prix} CFA` : "—"}</p>
              <p className="text-brand-muted">Stock</p>
              <p className="text-right font-semibold text-brand-ink">{stock || "—"}</p>
              <p className="text-brand-muted">Photos</p>
              <p className="text-right font-semibold text-brand-ink">{images.length}</p>
            </div>
          </div>
        </Carte>
      ) : null}

      {erreurEtape ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreurEtape}</p> : null}
      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={precedent}
          disabled={etapeActuelle === 0}
          className="flex h-11 items-center gap-1.5 rounded-full border border-brand-line px-5 text-sm font-semibold text-brand-ink disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Précédent
        </button>

        {derniereEtape ? (
          <button
            type="button"
            onClick={creerProduit}
            disabled={chargement}
            className="bg-gradient-brand-blue flex h-11 items-center justify-center rounded-full px-8 text-sm font-semibold text-white disabled:opacity-60"
          >
            {chargement ? "Création…" : "Créer le produit"}
          </button>
        ) : (
          <button
            type="button"
            onClick={suivant}
            className="bg-gradient-brand-blue flex h-11 items-center justify-center rounded-full px-8 text-sm font-semibold text-white"
          >
            Suivant
          </button>
        )}
      </div>
    </div>
  );
}
