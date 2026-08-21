"use client";

import Link from "next/link";
import { useState } from "react";
import { BellIcon, SearchIcon } from "./icons";

export function Topbar({
  titre,
  rechercheLabel,
  onRechercheSubmit,
  rapportHref,
}: {
  titre?: string;
  rechercheLabel: string;
  onRechercheSubmit?: (valeur: string) => void;
  rapportHref?: string;
}) {
  const [recherche, setRecherche] = useState("");

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (onRechercheSubmit && recherche.trim()) onRechercheSubmit(recherche.trim());
  }

  return (
    <header className="flex h-24 shrink-0 items-center gap-6 px-8">
      {titre ? <h1 className="text-3xl font-bold text-brand-ink">{titre}</h1> : <div className="flex-1" />}

      <div className="ml-auto flex items-center gap-3">
        <form onSubmit={soumettre} className="relative">
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={rechercheLabel}
            className="h-11 w-72 rounded-full border border-brand-line bg-white pl-4 pr-11 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:border-[color:var(--brand-blue-end)]"
          />
          <button
            type="submit"
            aria-label="Rechercher"
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-brand-muted disabled:opacity-40"
            disabled={!onRechercheSubmit}
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </form>

        {rapportHref ? (
          <Link
            href={rapportHref}
            className="flex h-11 items-center rounded-full border border-brand-line bg-white px-5 text-sm font-medium text-brand-ink"
          >
            Rapport
          </Link>
        ) : (
          <button type="button" disabled className="h-11 cursor-not-allowed rounded-full border border-brand-line bg-white px-5 text-sm font-medium text-brand-muted opacity-60">
            Rapport
          </button>
        )}

        <button type="button" aria-label="Notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white">
          <BellIcon className="h-5 w-5 text-amber-500" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            2
          </span>
        </button>
      </div>
    </header>
  );
}
