"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { ConversationProduit, ItemFil, Produit } from "@/lib/types";
import { BulleMessage } from "@/components/discussion/BulleMessage";
import { CarteCommandeDiscussion } from "@/components/discussion/CarteCommandeDiscussion";
import { BarreDeSaisie } from "@/components/discussion/BarreDeSaisie";
import { ChevronDownIcon, ChevronLeftIcon, ImagePlaceholderIcon, TicketIcon } from "@/components/icons";

const OPTIONS_FILTRE: { value: string; label: string }[] = [
  { value: "tous", label: "Toutes les commandes" },
  { value: "en_attente", label: "En attente" },
  { value: "validee", label: "Validées" },
  { value: "en_preparation", label: "En attente de livraison" },
  { value: "en_livraison", label: "Livraison en cours" },
  { value: "livree", label: "Livrées" },
  { value: "annulee", label: "Annulées" },
];

function StatPastille({ valeur, label, couleur }: { valeur: number; label: string; couleur: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-[#F5F7FA] px-3 py-1.5 text-xs font-semibold">
      <span className={`font-extrabold ${couleur}`}>{valeur}</span>
      <span className="text-brand-muted">{label}</span>
    </span>
  );
}

export function EcranConversationProduit({ produitId }: { produitId: number }) {
  const { user, token } = useAuth();
  const [produit, setProduit] = useState<Produit | null>(null);
  const [conversation, setConversation] = useState<ConversationProduit | null>(null);
  const [chargement, setChargement] = useState(true);
  const [filtre, setFiltre] = useState("tous");
  const [filtreOuvert, setFiltreOuvert] = useState(false);
  const filtreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<Produit>(`/produits/${produitId}`, { token }).then(setProduit);
  }, [token, produitId]);

  async function recharger() {
    if (!token) return;
    const data = await apiFetch<ConversationProduit>(`/produits/${produitId}/conversation?statut=${filtre}`, { token });
    setConversation(data);
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;
    setChargement(true);

    apiFetch<ConversationProduit>(`/produits/${produitId}/conversation?statut=${filtre}`, { token })
      .then((data) => {
        if (!annule) setConversation(data);
      })
      .catch(() => {
        if (!annule) setConversation(null);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token, produitId, filtre]);

  useEffect(() => {
    if (!filtreOuvert) return;
    function surClicExterieur(e: MouseEvent) {
      if (filtreRef.current && !filtreRef.current.contains(e.target as Node)) setFiltreOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [filtreOuvert]);

  async function envoyerMessage(texte: string) {
    if (!token) return;
    await apiFetch(`/produits/${produitId}/messages`, { method: "POST", token, body: { contenu: texte } });
    await recharger();
  }

  async function envoyerAudio(blob: Blob) {
    if (!token) return;
    const formData = new FormData();
    formData.append("fichier", blob, "message-vocal.webm");
    formData.append("type", "note_vocale");
    await apiFetch(`/produits/${produitId}/messages`, { method: "POST", token, body: formData });
    await recharger();
  }

  const items: ItemFil[] = conversation?.items ?? [];
  const nomProduit = produit?.nom_produit ?? `Produit #${produitId}`;
  const photo = produit?.images[0]?.url_image ?? null;
  const stats = conversation?.en_tete ?? { recues: 0, livrees: 0, annulees: 0, en_cours: 0 };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href={`/operations/produits/${produitId}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Conversation</h1>
          <p className="text-sm text-brand-muted">Fil des commandes et messages sur ce produit</p>
        </div>
      </div>

      <div className="rounded-3xl border border-brand-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
              {photo ? (
                <Image src={photo} alt={nomProduit} fill className="object-cover" sizes="48px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-brand-muted">
                  <ImagePlaceholderIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-brand-ink">{nomProduit}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <StatPastille valeur={stats.recues} label="reçues" couleur="text-brand-ink" />
                <StatPastille valeur={stats.livrees} label="livrées" couleur="text-emerald-600" />
                <StatPastille valeur={stats.en_cours} label="en cours" couleur="text-[color:var(--brand-blue-end)]" />
                <StatPastille valeur={stats.annulees} label="annulées" couleur="text-rose-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/operations/produits/${produitId}/negociation-prix`}
              className="flex h-10 items-center gap-1.5 rounded-full border border-brand-line px-4 text-xs font-semibold text-brand-ink"
            >
              <TicketIcon className="h-4 w-4" />
              Négocier le prix
            </Link>

            <div ref={filtreRef} className="relative">
              <button
                type="button"
                onClick={() => setFiltreOuvert((v) => !v)}
                className="flex h-10 items-center gap-1.5 rounded-full border border-brand-line px-4 text-xs font-semibold text-brand-ink"
              >
                {OPTIONS_FILTRE.find((o) => o.value === filtre)?.label ?? "Filtrer"}
                <ChevronDownIcon className={`h-3.5 w-3.5 text-brand-muted transition-transform ${filtreOuvert ? "rotate-180" : ""}`} />
              </button>

              {filtreOuvert ? (
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-56 overflow-hidden rounded-2xl border border-brand-line bg-white p-1.5 shadow-xl">
                  {OPTIONS_FILTRE.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFiltre(option.value);
                        setFiltreOuvert(false);
                      }}
                      className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                        option.value === filtre ? "bg-blue-50 font-semibold text-[color:var(--brand-blue-end)]" : "text-brand-ink hover:bg-[#F5F7FA]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-3xl border border-brand-line bg-white">
        <div className="h-[58vh] overflow-y-auto bg-[#F7F9FC] px-4 py-5">
          <div className="space-y-3">
            {chargement ? (
              <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-sm text-brand-muted">Aucune activité pour l&apos;instant.</p>
            ) : (
              items.map((item) =>
                item.type === "commande" ? (
                  <CarteCommandeDiscussion key={`commande-${item.donnee.commande_id}`} carte={item.donnee} />
                ) : (
                  <BulleMessage key={`message-${item.donnee.id}`} message={item.donnee} estMoi={item.donnee.auteur_id === user?.id} />
                )
              )
            )}
          </div>
        </div>

        <BarreDeSaisie onEnvoyer={envoyerMessage} onEnvoyerAudio={envoyerAudio} />
      </div>
    </div>
  );
}
