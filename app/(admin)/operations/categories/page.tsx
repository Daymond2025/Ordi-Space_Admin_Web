"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { LIBELLE_FAMILLE_CATEGORIE, type Categorie, type FamilleCategorie } from "@/lib/types";
import { OperationsIcon, PencilIcon, PlusIcon, XIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";
import { PageHero } from "@/components/PageHero";

const OPTIONS_FAMILLE = [
  { value: "", label: "Aucune (hors filtres)" },
  { value: "ordinateur", label: "Ordinateur" },
  { value: "accessoires", label: "Accessoires" },
  { value: "logiciels", label: "Logiciels" },
];

type Brouillon = { nom: string; famille: string; groupe: string; libelle: string; ordre: string };

const brouillonDe = (c: Categorie | null): Brouillon => ({
  nom: c?.nom_categorie ?? "",
  famille: c?.famille ?? "",
  groupe: c?.groupe ?? "",
  libelle: c?.libelle ?? "",
  ordre: c?.ordre_filtre === null || c?.ordre_filtre === undefined ? "" : String(c.ordre_filtre),
});

const CHAMP = "h-11 w-full rounded-xl border border-brand-line px-3 text-sm";

function FormulaireCategorie({
  categorie,
  token,
  onFermer,
  onEnregistree,
}: {
  categorie: Categorie | null;
  token: string;
  onFermer: () => void;
  onEnregistree: (categorie: Categorie) => void;
}) {
  const [b, setB] = useState<Brouillon>(brouillonDe(categorie));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const maj = (patch: Partial<Brouillon>) => setB((courant) => ({ ...courant, ...patch }));

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!b.nom.trim()) return setErreur("Le nom est obligatoire.");

    setEnCours(true);
    setErreur(null);
    const corps = {
      nom_categorie: b.nom.trim(),
      famille: b.famille || null,
      // Le groupe n'a de sens que pour les logiciels.
      groupe: b.famille === "logiciels" ? b.groupe.trim() || null : null,
      libelle: b.libelle.trim() || null,
      ordre_filtre: b.ordre.trim() === "" ? null : Number(b.ordre),
    };

    try {
      const enregistree = categorie
        ? await apiFetch<Categorie>(`/categories/${categorie.id}`, { method: "PUT", token, body: corps })
        : await apiFetch<Categorie>("/categories", { method: "POST", token, body: corps });
      onEnregistree(enregistree);
    } catch (err) {
      setErreur(err instanceof ApiRequestError ? err.message : "Impossible d'enregistrer cette catégorie.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onFermer}>
      <form
        onSubmit={enregistrer}
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-lg flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-label={categorie ? "Modifier la catégorie" : "Nouvelle catégorie"}
      >
        <button type="button" onClick={onFermer} aria-label="Fermer" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand-line/60 text-brand-ink">
          <XIcon className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-bold text-brand-ink">{categorie ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Nom de la catégorie</label>
          <input autoFocus value={b.nom} onChange={(e) => maj({ nom: e.target.value })} className={CHAMP} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Famille (onglet du filtre)</label>
            <Listbox value={b.famille} onChange={(v) => maj({ famille: v })} options={OPTIONS_FAMILLE} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Ordre dans le filtre</label>
            <input type="number" min={0} value={b.ordre} onChange={(e) => maj({ ordre: e.target.value })} placeholder="Vide = pas de tuile" className={CHAMP} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Libellé de la tuile</label>
            <input value={b.libelle} onChange={(e) => maj({ libelle: e.target.value })} placeholder="Par défaut : le nom" className={CHAMP} />
          </div>
          {b.famille === "logiciels" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Section (logiciels)</label>
              <input value={b.groupe} onChange={(e) => maj({ groupe: e.target.value })} placeholder="Pack office, Navigateur…" className={CHAMP} />
            </div>
          ) : null}
        </div>

        <p className="rounded-xl bg-[#F4F7FF] px-3 py-2 text-xs text-brand-muted">
          Une catégorie apparaît comme choix dans « Catégorie » des livreurs quand elle a une famille <strong>et</strong> un ordre. Sans ordre, elle
          regroupe seulement ses produits.
        </p>

        {erreur ? <p className="text-sm text-rose-600">{erreur}</p> : null}

        <button type="submit" disabled={enCours} className="bg-gradient-brand-blue flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60">
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

export default function CategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Categorie[] | null>(null);
  // `undefined` = fermé ; `null` = nouvelle catégorie ; sinon la catégorie à modifier.
  const [edition, setEdition] = useState<Categorie | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    apiFetch<Categorie[]>("/categories", { token }).then(setCategories);
  }, [token]);

  function apresEnregistrement(enregistree: Categorie) {
    setCategories((liste) => {
      const base = liste ?? [];
      return base.some((c) => c.id === enregistree.id) ? base.map((c) => (c.id === enregistree.id ? enregistree : c)) : [...base, enregistree];
    });
    setEdition(undefined);
  }

  const dansLeFiltre = categories?.filter((c) => c.famille && c.ordre_filtre !== null).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Catégories"
        description="Rangez les catégories dans l'écran « Catégorie » de la Boutique des livreurs : famille, section, tuile et ordre."
        icone={OperationsIcon}
        stats={[
          { valeur: categories?.length ?? "—", label: "Catégories" },
          { valeur: dansLeFiltre ?? "—", label: "Choix du filtre" },
        ]}
        action={
          <button
            type="button"
            onClick={() => setEdition(null)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle catégorie
          </button>
        }
      />

      {categories === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F9FC] text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Catégorie</th>
                <th className="px-4 py-3 font-semibold">Famille</th>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Tuile</th>
                <th className="px-4 py-3 text-right font-semibold">Ordre</th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-brand-line">
                  <td className="px-4 py-3 font-semibold text-brand-ink">{c.nom_categorie}</td>
                  <td className="px-4 py-3 text-brand-ink">{c.famille ? LIBELLE_FAMILLE_CATEGORIE[c.famille as FamilleCategorie] : <span className="text-brand-muted">—</span>}</td>
                  <td className="px-4 py-3 text-brand-muted">{c.groupe ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-muted">{c.ordre_filtre !== null ? (c.libelle ?? c.nom_categorie) : "—"}</td>
                  <td className="px-4 py-3 text-right text-brand-muted">{c.ordre_filtre ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setEdition(c)} aria-label={`Modifier ${c.nom_categorie}`} className="flex h-8 w-8 items-center justify-center rounded-full text-brand-muted hover:bg-brand-line/60">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edition !== undefined && token ? (
        <FormulaireCategorie categorie={edition} token={token} onFermer={() => setEdition(undefined)} onEnregistree={apresEnregistrement} />
      ) : null}
    </div>
  );
}
