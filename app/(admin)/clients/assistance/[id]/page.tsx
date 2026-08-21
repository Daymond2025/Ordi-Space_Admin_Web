"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { QuestionFrequente } from "@/lib/types";
import { QuestionForm } from "../QuestionForm";

export default function EditionQuestionPage(props: PageProps<"/clients/assistance/[id]">) {
  const { id } = use(props.params);
  const { token } = useAuth();
  const [question, setQuestion] = useState<QuestionFrequente | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    apiFetch<QuestionFrequente>(`/assistance/questions/${id}`, { token })
      .then(setQuestion)
      .catch(() => setQuestion(null));
  }, [token, id]);

  if (question === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (question === null) return <p className="text-sm text-brand-muted">Cette question est introuvable.</p>;

  return <QuestionForm existant={question} />;
}
