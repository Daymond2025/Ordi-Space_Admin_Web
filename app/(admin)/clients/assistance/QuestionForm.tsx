"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import type { QuestionFrequente, StatutQuestion } from "@/lib/types";
import { ChevronLeftIcon, MicIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";

const OPTIONS_STATUT = [
  { value: "brouillon", label: "Brouillon" },
  { value: "publie", label: "Publié" },
];

export function QuestionForm({ existant }: { existant?: QuestionFrequente }) {
  const router = useRouter();
  const { token } = useAuth();

  const [question, setQuestion] = useState(existant?.question ?? "");
  const [reponse, setReponse] = useState(existant?.reponse ?? "");
  const [statut, setStatut] = useState<StatutQuestion>(existant?.statut ?? "brouillon");
  const [ordreAffichage, setOrdreAffichage] = useState(existant?.ordre_affichage?.toString() ?? "0");
  const [audio, setAudio] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [suppression, setSuppression] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setErreur(null);
    setChargement(true);

    const donnees = new FormData();
    donnees.append("question", question);
    if (reponse) donnees.append("reponse", reponse);
    donnees.append("statut", statut);
    donnees.append("ordre_affichage", ordreAffichage || "0");
    if (audio) donnees.append("audio", audio);

    try {
      if (existant) {
        await apiFetch(`/assistance/questions/${existant.id}`, { method: "PUT", token, body: donnees });
      } else {
        await apiFetch("/assistance/questions", { method: "POST", token, body: donnees });
      }
      router.push("/clients/assistance");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer cette question.");
    } finally {
      setChargement(false);
    }
  }

  async function supprimer() {
    if (!token || !existant) return;
    if (!confirm(`Supprimer cette question ?`)) return;

    setErreur(null);
    setSuppression(true);

    try {
      await apiFetch(`/assistance/questions/${existant.id}`, { method: "DELETE", token });
      router.push("/clients/assistance");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de supprimer cette question.");
      setSuppression(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-brand-ink">{existant ? "Modifier la question" : "Nouvelle question"}</h1>
      </div>

      <form onSubmit={soumettre} className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Question</label>
          <input required value={question} onChange={(e) => setQuestion(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Réponse (optionnel)</label>
          <textarea value={reponse} onChange={(e) => setReponse(e.target.value)} rows={5} className="rounded-xl border border-brand-line px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-brand-muted">
            <MicIcon className="h-3.5 w-3.5" />
            Audio (optionnel)
          </label>
          {existant?.fichier_audio && !audio ? (
            <audio controls src={existant.fichier_audio} className="h-10 w-full max-w-sm" />
          ) : null}
          <input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Statut</label>
            <Listbox value={statut} onChange={(v) => setStatut(v as StatutQuestion)} options={OPTIONS_STATUT} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Ordre d&apos;affichage</label>
            <input type="number" min="0" value={ordreAffichage} onChange={(e) => setOrdreAffichage(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
          </div>
        </div>

        {erreur ? <p className="text-sm text-rose-600">{erreur}</p> : null}

        <div className="mt-2 flex gap-3">
          <button type="submit" disabled={chargement || suppression} className="bg-gradient-brand-blue flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60">
            {chargement ? "Enregistrement…" : existant ? "Enregistrer" : "Créer la question"}
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
