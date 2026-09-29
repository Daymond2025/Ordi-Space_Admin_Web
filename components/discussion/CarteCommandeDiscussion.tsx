"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChatIcon, ChevronDownIcon, ImagePlaceholderIcon, PhoneIcon } from "@/components/icons";
import { formaterDateHeure, type CommandeCarte } from "@/lib/types";

const LIBELLE_STATUT_FIL: Record<string, string> = {
  en_attente: "En attente",
  validee: "Validée",
  en_preparation: "En attente de livraison",
  en_livraison: "Livraison en cours",
  livree: "Livrée",
  annulee: "Annulée",
  reportee: "Reportée",
  client_injoignable: "Client injoignable",
  numero_incorrect: "Numéro incorrect",
};

const STYLE_STATUT_FIL: Record<string, string> = {
  en_attente: "bg-violet-600",
  validee: "bg-[color:var(--brand-blue-end)]",
  en_preparation: "bg-[color:var(--brand-blue-end)]",
  en_livraison: "bg-[color:var(--brand-blue-end)]",
  livree: "bg-emerald-600",
  annulee: "bg-rose-600",
  reportee: "bg-orange-500",
  client_injoignable: "bg-[color:var(--brand-blue-end)]",
  numero_incorrect: "bg-[color:var(--brand-blue-end)]",
};

/**
 * Carte-commande repliable du fil de discussion produit — mêmes cartes que
 * l'onglet "Commandes uniquement" ailleurs dans l'app, condensées ici dans le
 * fil chronologique. Le badge rouge compte les messages non lus de CETTE
 * commande précise.
 */
export function CarteCommandeDiscussion({ carte }: { carte: CommandeCarte }) {
  const [ouvert, setOuvert] = useState(true);
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-900/5">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className={`flex w-full items-center justify-between px-4 py-2.5 text-white ${STYLE_STATUT_FIL[carte.statut] ?? "bg-brand-ink"}`}
      >
        <span className="flex items-center gap-2">
          <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
            <ChatIcon className="h-4 w-4" />
            {carte.nouvelles_activites > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {carte.nouvelles_activites}
              </span>
            ) : null}
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wide">{LIBELLE_STATUT_FIL[carte.statut] ?? carte.statut}</span>
        </span>

        <span className="flex h-[22px] w-[23px] shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white">
          <ChevronDownIcon className={`h-3.5 w-3.5 text-[color:var(--brand-blue-end)] transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`} />
        </span>
      </button>

      {ouvert ? (
        <div className="px-3.5 pb-3.5 pt-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/clients/commandes/${carte.commande_id}`)}
            onKeyDown={(e) => e.key === "Enter" && router.push(`/clients/commandes/${carte.commande_id}`)}
            className="flex cursor-pointer gap-2.5 rounded-xl bg-white p-2.5 shadow-sm shadow-slate-900/5 transition-colors hover:bg-[#F7F9FC]"
          >
            <div className="relative h-[72px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
              {carte.photo ? (
                <Image src={carte.photo} alt={carte.nom_produit} fill className="object-cover" sizes="68px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-muted">
                  <ImagePlaceholderIcon className="h-6 w-6" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand-ink">{carte.description ?? carte.nom_produit}</p>

              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-ink">{carte.nom_client}</span>
                {carte.zone_localite ? (
                  <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 text-xs font-semibold text-brand-muted">{carte.zone_localite}</span>
                ) : null}
              </div>

              {carte.telephone ? (
                <a
                  href={`tel:${carte.telephone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-blue-end)]"
                >
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {carte.telephone}
                </a>
              ) : null}
            </div>
          </div>

          {carte.dernier_suivi ? (
            <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-[#F5F7FA] px-3 py-2">
              <div className="min-w-0 flex-1">
                {carte.dernier_suivi.acteur ? <p className="text-xs font-bold text-brand-ink">{carte.dernier_suivi.acteur}</p> : null}
                <p className="text-xs text-brand-muted">{carte.dernier_suivi.texte}</p>
              </div>
              <span className="shrink-0 text-[11px] text-brand-muted">{formaterDateHeure(carte.dernier_suivi.date)}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
