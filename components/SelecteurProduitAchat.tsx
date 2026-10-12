"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formaterPrix, type Produit } from "@/lib/types";
import { ChevronDownIcon } from "@/components/icons";

function MiniatureProduit({ produit }: { produit: Produit }) {
  return (
    <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-[#EEF1F6]">
      {produit.images[0]?.url_image ? (
        <Image src={produit.images[0].url_image} alt="" fill className="object-cover" sizes="28px" />
      ) : null}
    </span>
  );
}

/**
 * Sélecteur produit avec miniature — partagé par "Nouveau client"
 * (clients/liste) et "Enregistrer un achat" (fiche client), distinct du
 * `Listbox` générique qui ne supporte pas d'image dans ses options.
 */
export function SelecteurProduitAchat({
  produits,
  valeur,
  onChange,
}: {
  produits: Produit[];
  valeur: string;
  onChange: (produitId: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const choisi = produits.find((p) => String(p.id) === valeur) ?? null;

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [ouvert]);

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex h-11 w-full items-center gap-2 rounded-xl border border-brand-line px-2.5 text-left text-xs text-brand-ink"
      >
        {choisi ? (
          <>
            <MiniatureProduit produit={choisi} />
            <span className="min-w-0 flex-1 truncate">
              {choisi.nom_produit} — {formaterPrix(choisi.prix_vente ?? choisi.prix)} CFA
            </span>
          </>
        ) : (
          <span className="flex-1 text-brand-muted">Choisir un produit…</span>
        )}
        <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-brand-muted transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>
      {ouvert ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-brand-line bg-white p-1.5 shadow-xl">
          {produits.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(String(p.id));
                setOuvert(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${
                String(p.id) === valeur ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "text-brand-ink hover:bg-[#F5F7FA]"
              }`}
            >
              <MiniatureProduit produit={p} />
              <span className="min-w-0 flex-1 truncate">
                {p.nom_produit} — {formaterPrix(p.prix_vente ?? p.prix)} CFA
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
