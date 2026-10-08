"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { ReponseRapide } from "@/lib/types";
import { ReponseRapideForm } from "../ReponseRapideForm";

export function EditionReponseRapide({ id }: { id: string }) {
  const { token } = useAuth();
  const [reponse, setReponse] = useState<ReponseRapide | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    apiFetch<ReponseRapide>(`/reponses-rapides/${id}`, { token })
      .then(setReponse)
      .catch(() => setReponse(null));
  }, [token, id]);

  if (reponse === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (reponse === null) return <p className="text-sm text-brand-muted">Cette réponse rapide est introuvable.</p>;

  return <ReponseRapideForm existant={reponse} />;
}
