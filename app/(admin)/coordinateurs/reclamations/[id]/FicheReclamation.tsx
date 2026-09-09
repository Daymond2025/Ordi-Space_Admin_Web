"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDateHeure, formaterPrix, type ReclamationDetailAdmin } from "@/lib/types";
import { ChevronLeftIcon, CoordinateursIcon, ImagePlaceholderIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const OPTIONS_STATUT = [
  { id: "en_cours", label: "Prise en charge" },
  { id: "resolue", label: "Terminée" },
  { id: "rejetee", label: "Rejetée" },
] as const;

export function FicheReclamation({ reclamationId }: { reclamationId: number }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<ReclamationDetailAdmin | null>(null);
  const [statut, setStatut] = useState<(typeof OPTIONS_STATUT)[number]["id"]>("en_cours");
  const [reponse, setReponse] = useState("");
  const [enCours, setEnCours] = useState(false);

  function charger() {
    if (!token) return;
    apiFetch<ReclamationDetailAdmin>(`/reclamations/${reclamationId}`, { token }).then(setDetail);
  }

  useEffect(charger, [token, reclamationId]);

  async function repondre() {
    if (!token || !reponse.trim() || enCours) return;
    setEnCours(true);
    try {
      await apiFetch(`/reclamations/${reclamationId}/repondre`, {
        method: "PATCH",
        token,
        body: { statut, reponse_admin: reponse.trim() },
      });
      setReponse("");
      charger();
    } finally {
      setEnCours(false);
    }
  }

  const telephone = detail?.auteur.telephone;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/coordinateurs/reclamations" className="flex items-center gap-1 text-sm font-semibold text-brand-muted">
        <ChevronLeftIcon className="h-4 w-4" /> Retour aux réclamations
      </Link>

      <PageHero
        titre={detail?.titre ?? "Réclamation"}
        description={detail ? `${detail.auteur.prenom ? `${detail.auteur.prenom} ` : ""}${detail.auteur.nom} · ${detail.sujet}` : undefined}
        icone={CoordinateursIcon}
      />

      {!detail ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-4">
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Description</p>
              <p className="text-sm text-brand-ink">{detail.description}</p>
              <p className="mt-3 text-xs text-brand-muted">Soumis le {formaterDateHeure(detail.date_reclamation)}</p>
            </div>

            {detail.commande?.produit ? (
              <div className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
                  {detail.commande.produit.photo ? (
                    <Image src={detail.commande.produit.photo} alt="" fill className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-brand-muted">
                      <ImagePlaceholderIcon className="h-6 w-6" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-ink">{detail.commande.produit.nom_produit}</p>
                  <p className="text-xs text-brand-muted">{formaterPrix(detail.commande.produit.prix)} CFA</p>
                  {detail.commande.fournisseur ? (
                    <p className="text-[11px] text-brand-muted">Fournisseur : {detail.commande.fournisseur.nom_entreprise}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {detail.preuves.length > 0 ? (
              <div className="rounded-2xl border border-brand-line bg-white p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">Preuves</p>
                <div className="flex flex-wrap gap-2">
                  {detail.preuves.map((preuve) => (
                    <div key={preuve.id} className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#EEF1F6]">
                      <Image src={preuve.fichier} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {detail.reponse_admin ? (
              <div className="rounded-2xl border border-brand-line bg-[#F5F7FA] p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">Réponse déjà envoyée</p>
                <p className="text-sm text-brand-ink">{detail.reponse_admin}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            {telephone ? (
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${telephone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-green-500 text-xs font-semibold text-white"
                >
                  <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href={`tel:${telephone}`}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-brand-ink text-xs font-semibold text-white"
                >
                  <PhoneIcon className="h-4 w-4" /> Appeler
                </a>
              </div>
            ) : null}

            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="mb-3 text-sm font-bold text-brand-ink">Changer le statut</p>
              <div className="mb-3 flex flex-col gap-2">
                {OPTIONS_STATUT.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setStatut(o.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      statut === o.id ? "bg-brand-ink text-white" : "border border-brand-line text-brand-muted"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <textarea
                value={reponse}
                onChange={(e) => setReponse(e.target.value)}
                placeholder="Votre réponse…"
                rows={4}
                className="mb-3 w-full rounded-2xl border border-brand-line p-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={repondre}
                disabled={!reponse.trim() || enCours}
                className="w-full rounded-full bg-brand-ink py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {enCours ? "Envoi…" : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
