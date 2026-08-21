"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { extraireIdYoutube, LIBELLE_TYPE_TUTORIEL, type StatutTutoriel, type Tutoriel, type TypeTutoriel } from "@/lib/types";
import { ChevronLeftIcon, GraduationCapIcon, ImagePlaceholderIcon, PlayIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";

const OPTIONS_TYPE = Object.entries(LIBELLE_TYPE_TUTORIEL).map(([valeur, libelle]) => ({
  value: valeur,
  label: libelle,
  icon: valeur === "tutoriel_rapide" ? PlayIcon : GraduationCapIcon,
}));

const OPTIONS_STATUT = [
  { value: "brouillon", label: "Brouillon" },
  { value: "publie", label: "Publié" },
];

export function TutorielForm({ existant }: { existant?: Tutoriel }) {
  const router = useRouter();
  const { token } = useAuth();

  const [titre, setTitre] = useState(existant?.titre ?? "");
  const [type, setType] = useState<TypeTutoriel>(existant?.type ?? "tutoriel_rapide");
  const [statut, setStatut] = useState<StatutTutoriel>(existant?.statut ?? "brouillon");
  const [urlVideo, setUrlVideo] = useState(existant?.url_video ?? "");
  const [contenu, setContenu] = useState(existant?.contenu ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [suppression, setSuppression] = useState(false);

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setErreur(null);
    setChargement(true);

    const donnees = new FormData();
    donnees.append("titre", titre);
    donnees.append("type", type);
    if (urlVideo) donnees.append("url_video", urlVideo);
    if (contenu) donnees.append("contenu", contenu);
    donnees.append("statut", statut);
    if (image) donnees.append("image", image);

    try {
      if (existant) {
        await apiFetch(`/tutoriels/${existant.id}`, { method: "PUT", token, body: donnees });
      } else {
        await apiFetch("/tutoriels", { method: "POST", token, body: donnees });
      }
      router.push("/clients/contenu");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer ce contenu.");
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
      await apiFetch(`/tutoriels/${existant.id}`, { method: "DELETE", token });
      router.push("/clients/contenu");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de supprimer ce contenu.");
      setSuppression(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-brand-ink">{existant ? "Modifier le contenu" : "Nouveau contenu"}</h1>
      </div>

      <form onSubmit={soumettre} className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Type</label>
            <Listbox value={type} onChange={(v) => setType(v as TypeTutoriel)} options={OPTIONS_TYPE} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Statut</label>
            <Listbox value={statut} onChange={(v) => setStatut(v as StatutTutoriel)} options={OPTIONS_STATUT} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Titre</label>
          <input required value={titre} onChange={(e) => setTitre(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Lien vidéo YouTube</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={urlVideo}
            onChange={(e) => setUrlVideo(e.target.value)}
            className="h-11 rounded-xl border border-brand-line px-3 text-sm"
          />
          {extraireIdYoutube(urlVideo) ? (
            <div className="relative mt-1 aspect-video w-64 overflow-hidden rounded-xl bg-[#EEF1F6]">
              <Image src={`https://i.ytimg.com/vi/${extraireIdYoutube(urlVideo)}/hqdefault.jpg`} alt="" fill sizes="256px" className="object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <PlayIcon className="h-9 w-9 text-white" />
              </span>
            </div>
          ) : urlVideo ? (
            <p className="text-xs text-rose-600">Lien YouTube non reconnu.</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Contenu {urlVideo ? "(description, optionnel)" : ""}</label>
          <textarea
            required={!urlVideo}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            rows={urlVideo ? 4 : 8}
            className="rounded-xl border border-brand-line px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-brand-muted">Image de couverture</label>
          {existant?.image_couverture && !image ? (
            <div className="relative h-32 w-32 overflow-hidden rounded-xl bg-[#EEF1F6]">
              <Image src={existant.image_couverture} alt="" fill sizes="128px" className="object-cover" />
            </div>
          ) : !image ? (
            <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-[#EEF1F6] text-brand-muted">
              <ImagePlaceholderIcon className="h-8 w-8" />
            </div>
          ) : null}
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>

        {erreur ? <p className="text-sm text-rose-600">{erreur}</p> : null}

        <div className="mt-2 flex gap-3">
          <button type="submit" disabled={chargement || suppression} className="bg-gradient-brand-blue flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60">
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
