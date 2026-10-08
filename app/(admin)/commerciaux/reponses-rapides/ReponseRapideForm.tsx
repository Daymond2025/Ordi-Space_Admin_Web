"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type { ReponseRapide } from "@/lib/types";
import { ChevronLeftIcon } from "@/components/icons";

export function ReponseRapideForm({ existant }: { existant?: ReponseRapide }) {
  const router = useRouter();
  const { token } = useAuth();

  const [titre, setTitre] = useState(existant?.titre ?? "");
  const [contenu, setContenu] = useState(existant?.contenu ?? "");
  const [estFavori, setEstFavori] = useState(existant?.est_favori ?? false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [suppression, setSuppression] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setErreur(null);
    setChargement(true);

    const donnees = { titre, contenu, est_favori: estFavori };

    try {
      if (existant) {
        await apiFetch(`/reponses-rapides/${existant.id}`, { method: "PUT", token, body: donnees });
      } else {
        await apiFetch("/reponses-rapides", { method: "POST", token, body: donnees });
      }
      router.push("/commerciaux/reponses-rapides");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer cette réponse.");
    } finally {
      setChargement(false);
    }
  }

  async function supprimer() {
    if (!token || !existant) return;
    if (!confirm(`Supprimer "${existant.titre}" ?`)) return;

    setErreur(null);
    setSuppression(true);

    try {
      await apiFetch(`/reponses-rapides/${existant.id}`, { method: "DELETE", token });
      router.push("/commerciaux/reponses-rapides");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de supprimer cette réponse.");
      setSuppression(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-line bg-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-brand-ink">{existant ? "Modifier la réponse rapide" : "Nouvelle réponse rapide"}</h1>
      </div>

      <form onSubmit={soumettre} className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Titre</label>
          <input
            required
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex. Objection à une demande de réduction"
            className="h-11 rounded-xl border border-brand-line px-3 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Contenu</label>
          <textarea
            required
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            rows={8}
            placeholder="Le texte que le commercial copiera tel quel vers son client…"
            className="rounded-xl border border-brand-line px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-brand-ink">
          <input type="checkbox" checked={estFavori} onChange={(e) => setEstFavori(e.target.checked)} className="h-4 w-4 rounded" />
          Mettre en avant dans l&apos;onglet &quot;Favoris&quot;
        </label>

        {erreur ? <p className="text-sm text-rose-600">{erreur}</p> : null}

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={chargement || suppression}
            className="bg-gradient-brand-blue flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          >
            {chargement ? "Enregistrement…" : existant ? "Enregistrer" : "Créer"}
          </button>

          {existant ? (
            <button
              type="button"
              onClick={supprimer}
              disabled={chargement || suppression}
              className="flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-600 disabled:opacity-60"
            >
              {suppression ? "Suppression…" : "Supprimer"}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
