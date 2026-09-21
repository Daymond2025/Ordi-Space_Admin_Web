"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Produit } from "@/lib/types";
import { Listbox } from "@/components/Listbox";

/**
 * Champs d'une fiche produit qui alimentent la Boutique des livreurs et son écran
 * "Catégorie" : marque, caractéristiques (RAM, stockage, taille… — filtrables),
 * état, prix de vente / barré, réduction, commission de revente et barème de
 * livraison. Communs à la création et à la modification d'un produit Admin.
 */
export type ChampsBoutique = {
  marque: string;
  etat: string;
  processeur: string;
  ram: string;
  stockage: string;
  taille: string;
  systeme: string;
  carteGraphique: string;
  couleur: string;
  prixVente: string;
  prixBarre: string;
  reduction: string;
  commissionRevente: string;
  /** id de localité → frais saisis ; vide = localité non livrée. */
  frais: Record<number, string>;
};

export const CHAMPS_BOUTIQUE_VIDES: ChampsBoutique = {
  marque: "",
  etat: "",
  processeur: "",
  ram: "",
  stockage: "",
  taille: "",
  systeme: "",
  carteGraphique: "",
  couleur: "",
  prixVente: "",
  prixBarre: "",
  reduction: "",
  commissionRevente: "",
  frais: {},
};

const MARQUES_SUGGEREES = ["HP", "Dell", "Lenovo", "Macbook", "Asus", "Toshiba", "Chromebook"];

const ETATS = [
  { value: "", label: "Non précisé" },
  { value: "neuf", label: "Neuf" },
  { value: "quasi_neuf", label: "Quasi neuf" },
  { value: "occasion", label: "Occasion" },
  { value: "reconditionne", label: "Reconditionné" },
];

const CHAMP = "h-11 w-full rounded-xl border border-brand-line px-3 text-sm";

const texte = (valeur: string | null | undefined) => valeur ?? "";
const nombre = (valeur: string): number | null => (valeur.trim() === "" ? null : Number(valeur));

/** Valeurs d'un produit existant (le backend renvoie les décimaux en "380000.00"). */
export function champsDepuisProduit(p: Produit): ChampsBoutique {
  const entier = (v: string | null) => (v === null ? "" : String(Math.round(Number(v))));
  return {
    marque: texte(p.marque),
    etat: texte(p.etat_produit),
    processeur: texte(p.processeur),
    ram: texte(p.memoire_ram),
    stockage: texte(p.stockage),
    taille: texte(p.taille),
    systeme: texte(p.systeme_exploitation),
    carteGraphique: texte(p.carte_graphique),
    couleur: texte(p.couleur),
    prixVente: entier(p.prix_vente),
    prixBarre: entier(p.prix_barre),
    reduction: p.pourcentage_reduction === null ? "" : String(p.pourcentage_reduction),
    commissionRevente: entier(p.commission_revente),
    frais: Object.fromEntries((p.frais_livraison ?? []).filter((f) => f.localite).map((f) => [f.localite!.id, entier(f.montant)])),
  };
}

function lignesFrais(frais: Record<number, string>) {
  return Object.entries(frais)
    .filter(([, montant]) => montant.trim() !== "")
    .map(([localiteId, montant]) => ({ localite_id: Number(localiteId), montant: Number(montant) }));
}

/** Corps JSON d'une modification (PUT /produits/{id}) — un champ vidé est remis à null. */
export function champsVersCorps(c: ChampsBoutique): Record<string, unknown> {
  const frais = lignesFrais(c.frais);
  return {
    marque: c.marque.trim() || null,
    etat_produit: c.etat || null,
    processeur: c.processeur.trim() || null,
    memoire_ram: c.ram.trim() || null,
    stockage: c.stockage.trim() || null,
    taille: c.taille.trim() || null,
    systeme_exploitation: c.systeme.trim() || null,
    carte_graphique: c.carteGraphique.trim() || null,
    couleur: c.couleur.trim() || null,
    prix_vente: nombre(c.prixVente),
    prix_barre: nombre(c.prixBarre),
    pourcentage_reduction: nombre(c.reduction),
    commission_revente: nombre(c.commissionRevente),
    // Remplacement complet du barème ; omis, il reste tel quel (voir ProduitController::update()).
    ...(frais.length > 0 ? { frais_livraison: frais } : {}),
  };
}

/** Champs d'une création (POST /produits, multipart) — seuls les champs renseignés sont envoyés. */
export function champsVersFormData(donnees: FormData, c: ChampsBoutique): void {
  const corps = champsVersCorps(c);
  Object.entries(corps).forEach(([cle, valeur]) => {
    if (cle === "frais_livraison" || valeur === null) return;
    donnees.append(cle, String(valeur));
  });
  lignesFrais(c.frais).forEach((ligne, index) => {
    donnees.append(`frais_livraison[${index}][localite_id]`, String(ligne.localite_id));
    donnees.append(`frais_livraison[${index}][montant]`, String(ligne.montant));
  });
}

function Champ({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-brand-muted">{libelle}</label>
      {children}
    </div>
  );
}

function ChampTexte({ libelle, valeur, onChange, type = "text", suffixe }: { libelle: string; valeur: string; onChange: (v: string) => void; type?: "text" | "number"; suffixe?: string }) {
  return (
    <Champ libelle={suffixe ? `${libelle} (${suffixe})` : libelle}>
      <input type={type} min={type === "number" ? 0 : undefined} value={valeur} onChange={(e) => onChange(e.target.value)} className={CHAMP} />
    </Champ>
  );
}

export function ChampsBoutiqueProduit({
  valeurs,
  onChange,
  token,
}: {
  valeurs: ChampsBoutique;
  onChange: (valeurs: ChampsBoutique) => void;
  token: string | null;
}) {
  const [localites, setLocalites] = useState<{ id: number; nom: string }[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    apiFetch<{ id: number; nom: string }[]>("/localites", { token })
      .then((liste) => {
        if (!annule) setLocalites(liste);
      })
      .catch(() => {
        if (!annule) setLocalites([]);
      });
    return () => {
      annule = true;
    };
  }, [token]);

  const maj = (patch: Partial<ChampsBoutique>) => onChange({ ...valeurs, ...patch });

  return (
    <>
      <section className="flex flex-col gap-4 border-t border-brand-line pt-5">
        <div>
          <p className="text-sm font-bold text-brand-ink">Caractéristiques</p>
          <p className="text-xs text-brand-muted">
            La marque, la RAM, le stockage et la taille alimentent les filtres de l&apos;écran « Catégorie » des livreurs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Champ libelle="Marque">
            <input list="marques-produit" value={valeurs.marque} onChange={(e) => maj({ marque: e.target.value })} className={CHAMP} placeholder="Déduite du nom si vide" />
            <datalist id="marques-produit">
              {MARQUES_SUGGEREES.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Champ>
          <ChampTexte libelle="Processeur" valeur={valeurs.processeur} onChange={(v) => maj({ processeur: v })} />
          <ChampTexte libelle="Mémoire (RAM)" valeur={valeurs.ram} onChange={(v) => maj({ ram: v })} />
          <ChampTexte libelle="Stockage" valeur={valeurs.stockage} onChange={(v) => maj({ stockage: v })} />
          <ChampTexte libelle="Taille d'écran" valeur={valeurs.taille} onChange={(v) => maj({ taille: v })} />
          <ChampTexte libelle="Système d'exploitation" valeur={valeurs.systeme} onChange={(v) => maj({ systeme: v })} />
          <ChampTexte libelle="Carte graphique" valeur={valeurs.carteGraphique} onChange={(v) => maj({ carteGraphique: v })} />
          <ChampTexte libelle="Couleur" valeur={valeurs.couleur} onChange={(v) => maj({ couleur: v })} />
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-brand-line pt-5">
        <div>
          <p className="text-sm font-bold text-brand-ink">Vente par les livreurs</p>
          <p className="text-xs text-brand-muted">
            Sans prix de vente, la Boutique affiche « Prix à venir » ; sans commission, le produit n&apos;est pas proposé à la revente.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Champ libelle="État du produit">
            <Listbox value={valeurs.etat} onChange={(v) => maj({ etat: v })} options={ETATS} />
          </Champ>
          <ChampTexte libelle="Prix de vente" suffixe="CFA" type="number" valeur={valeurs.prixVente} onChange={(v) => maj({ prixVente: v })} />
          <ChampTexte libelle="Prix barré (référence)" suffixe="CFA" type="number" valeur={valeurs.prixBarre} onChange={(v) => maj({ prixBarre: v })} />
          <ChampTexte libelle="Réduction affichée" suffixe="%" type="number" valeur={valeurs.reduction} onChange={(v) => maj({ reduction: v })} />
          <ChampTexte libelle="Commission du livreur" suffixe="CFA" type="number" valeur={valeurs.commissionRevente} onChange={(v) => maj({ commissionRevente: v })} />
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-brand-line pt-5">
        <div>
          <p className="text-sm font-bold text-brand-ink">Frais de livraison</p>
          <p className="text-xs text-brand-muted">Renseignez les localités livrées — les autres restent indisponibles (commande impossible).</p>
        </div>

        {localites === null ? (
          <p className="text-xs text-brand-muted">Chargement des localités…</p>
        ) : (
          <div className="grid max-h-80 grid-cols-2 gap-x-6 gap-y-2 overflow-y-auto pr-1">
            {localites.map((localite) => (
              <label key={localite.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-brand-ink">{localite.nom}</span>
                <span className="flex w-32 shrink-0 items-center rounded-xl border border-brand-line px-3">
                  <input
                    type="number"
                    min={0}
                    value={valeurs.frais[localite.id] ?? ""}
                    onChange={(e) => maj({ frais: { ...valeurs.frais, [localite.id]: e.target.value } })}
                    placeholder="—"
                    aria-label={`Frais de livraison ${localite.nom}`}
                    className="h-9 min-w-0 flex-1 bg-transparent text-right text-sm outline-none"
                  />
                  <span className="ml-1.5 text-[11px] text-brand-muted">CFA</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
