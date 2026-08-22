"use client";

import { useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type { Categorie } from "@/lib/types";
import { PlusIcon } from "@/components/icons";

export function AjoutCategorieRapide({
  token,
  onCreee,
}: {
  token: string | null;
  onCreee: (categorie: Categorie) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creer() {
    if (!token || !nom.trim()) return;
    setChargement(true);
    setErreur(null);

    try {
      const categorie = await apiFetch<Categorie>("/categories", {
        method: "POST",
        token,
        body: { nom_categorie: nom.trim() },
      });
      onCreee(categorie);
      setNom("");
      setOuvert(false);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de créer cette catégorie.");
    } finally {
      setChargement(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex items-center gap-1 text-[11px] font-semibold text-[color:var(--brand-blue-end)]"
      >
        <PlusIcon className="h-3 w-3" />
        Nouvelle catégorie
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <input
          autoFocus
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              creer();
            }
          }}
          placeholder="Nom de la catégorie"
          className="h-9 flex-1 rounded-lg border border-brand-line px-2 text-xs"
        />
        <button
          type="button"
          onClick={creer}
          disabled={chargement || !nom.trim()}
          className="h-9 shrink-0 rounded-lg bg-brand-ink px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {chargement ? "…" : "Ajouter"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOuvert(false);
            setErreur(null);
          }}
          className="h-9 shrink-0 rounded-lg px-2 text-xs text-brand-muted"
        >
          Annuler
        </button>
      </div>
      {erreur ? <p className="text-[11px] text-rose-600">{erreur}</p> : null}
    </div>
  );
}
