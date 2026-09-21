"use client";

import { useState, type ReactNode } from "react";
import { XIcon } from "@/components/icons";

/**
 * Boîte de dialogue à un champ texte obligatoire — utilisée pour saisir la
 * référence d'un transfert (validation d'un retrait) ou un motif (refus). Le
 * parent gère l'appel API dans `onConfirmer` et renvoie le message d'erreur à
 * afficher (ou rien si tout s'est bien passé, la boîte se ferme alors).
 */
export function ModalSaisie({
  titre,
  resume,
  libelle,
  placeholder,
  confirmer,
  danger = false,
  onConfirmer,
  onFermer,
}: {
  titre: string;
  resume?: ReactNode;
  libelle: string;
  placeholder?: string;
  confirmer: string;
  danger?: boolean;
  onConfirmer: (valeur: string) => Promise<string | void>;
  onFermer: () => void;
}) {
  const [valeur, setValeur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider() {
    const propre = valeur.trim();
    if (!propre) return setErreur(`${libelle} obligatoire.`);
    setEnCours(true);
    setErreur(null);
    const message = await onConfirmer(propre);
    setEnCours(false);
    if (message) setErreur(message);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onFermer}>
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={titre}
      >
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand-line/60 text-brand-ink"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-extrabold text-brand-ink">{titre}</h2>
        {resume ? <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-brand-ink">{resume}</div> : null}

        <label htmlFor="modal-saisie" className="mt-4 block text-xs font-semibold text-brand-muted">
          {libelle}
        </label>
        <input
          id="modal-saisie"
          autoFocus
          value={valeur}
          onChange={(e) => {
            setValeur(e.target.value);
            setErreur(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void valider();
          }}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-xl border border-brand-line bg-white px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]"
        />
        {erreur ? <p className="mt-2 text-xs font-semibold text-red-500">{erreur}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onFermer} className="rounded-full border border-brand-line px-5 py-2.5 text-xs font-semibold text-brand-muted">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void valider()}
            disabled={enCours}
            className={`rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-60 ${danger ? "bg-red-500" : "bg-gradient-brand-blue"}`}
          >
            {enCours ? "…" : confirmer}
          </button>
        </div>
      </div>
    </div>
  );
}
