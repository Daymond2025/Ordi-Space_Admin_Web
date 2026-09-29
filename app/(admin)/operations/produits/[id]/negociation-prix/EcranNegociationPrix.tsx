"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterPrix, type MessageConversation, type Produit } from "@/lib/types";
import { BulleMessage } from "@/components/discussion/BulleMessage";
import { BarreDeSaisie } from "@/components/discussion/BarreDeSaisie";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * Fil séparé de la discussion générale (Message.est_negociation_prix, voir
 * MessageController côté backend) — même écran que Fournisseur/Coordinateur,
 * avec en plus le formulaire de démarrage (réservé Coordinateur/Admin, voir
 * MessageController::demarrerNegociationPrix()).
 */
export function EcranNegociationPrix({ produitId }: { produitId: number }) {
  const { user, token } = useAuth();
  const [produit, setProduit] = useState<Produit | null>(null);
  const [messages, setMessages] = useState<MessageConversation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [prixPropose, setPrixPropose] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<Produit>(`/produits/${produitId}`, { token }).then(setProduit);
  }, [token, produitId]);

  async function charger() {
    if (!token) return;
    const pagination = await apiFetch<{ data: MessageConversation[] }>(`/produits/${produitId}/negociation-prix`, { token });
    setMessages(pagination.data);
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;
    setChargement(true);

    apiFetch<{ data: MessageConversation[] }>(`/produits/${produitId}/negociation-prix`, { token })
      .then((pagination) => {
        if (!annule) setMessages(pagination.data);
      })
      .catch(() => {
        if (!annule) setMessages([]);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token, produitId]);

  async function demarrer() {
    if (!token) return;
    const prix = Number(prixPropose);
    if (!prixPropose.trim() || Number.isNaN(prix) || prix < 0) {
      setErreur("Indiquez un prix valide.");
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/produits/${produitId}/negociation-prix`, { method: "POST", token, body: { prix_propose: prix } });
      setPrixPropose("");
      await charger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de démarrer cette négociation.");
    } finally {
      setEnCours(false);
    }
  }

  async function envoyerMessage(texte: string) {
    if (!token) return;
    await apiFetch(`/produits/${produitId}/negociation-prix/messages`, { method: "POST", token, body: { contenu: texte } });
    await charger();
  }

  async function envoyerAudio(blob: Blob) {
    if (!token) return;
    const formData = new FormData();
    formData.append("fichier", blob, "message-vocal.webm");
    formData.append("type", "note_vocale");
    await apiFetch(`/produits/${produitId}/negociation-prix/messages`, { method: "POST", token, body: formData });
    await charger();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href={`/operations/produits/${produitId}/conversation`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Négociation de prix</h1>
          <p className="text-sm text-brand-muted">{produit?.nom_produit ?? `Produit #${produitId}`}</p>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-3xl border border-brand-line bg-white">
        <div className="h-[58vh] overflow-y-auto bg-[#F7F9FC] px-4 py-5">
          <div className="space-y-3">
            {chargement ? (
              <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
            ) : messages.length === 0 ? (
              <div className="mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-brand-line bg-white p-5">
                <p className="text-sm font-bold text-brand-ink">Démarrer une négociation</p>
                <p className="text-xs text-brand-muted">
                  Prix partenaire actuel : {produit ? formaterPrix(produit.prix) : "—"} CFA. Proposez une contre-offre au fournisseur.
                </p>
                <input
                  type="number"
                  min={0}
                  value={prixPropose}
                  onChange={(e) => setPrixPropose(e.target.value)}
                  placeholder="Prix proposé (CFA)"
                  className="h-11 rounded-xl border border-brand-line px-3 text-sm"
                />
                {erreur ? <p className="text-xs text-rose-600">{erreur}</p> : null}
                <button
                  type="button"
                  onClick={demarrer}
                  disabled={enCours}
                  className="bg-gradient-brand-blue h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                >
                  {enCours ? "Envoi…" : "Proposer ce prix"}
                </button>
              </div>
            ) : (
              messages.map((message) => <BulleMessage key={message.id} message={message} estMoi={message.auteur_id === user?.id} />)
            )}
          </div>
        </div>

        <BarreDeSaisie onEnvoyer={envoyerMessage} onEnvoyerAudio={envoyerAudio} />
      </div>
    </div>
  );
}
