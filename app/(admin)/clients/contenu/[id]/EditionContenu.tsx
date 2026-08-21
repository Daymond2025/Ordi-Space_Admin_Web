"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { Tutoriel } from "@/lib/types";
import { TutorielForm } from "../TutorielForm";

export function EditionContenu({ id }: { id: string }) {
  const { token } = useAuth();
  const [tutoriel, setTutoriel] = useState<Tutoriel | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    apiFetch<Tutoriel>(`/tutoriels/${id}`, { token })
      .then(setTutoriel)
      .catch(() => setTutoriel(null));
  }, [token, id]);

  if (tutoriel === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (tutoriel === null) return <p className="text-sm text-brand-muted">Ce contenu est introuvable.</p>;

  return <TutorielForm existant={tutoriel} />;
}
