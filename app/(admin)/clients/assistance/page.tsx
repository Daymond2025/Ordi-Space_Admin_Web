"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { Pagination, QuestionFrequente } from "@/lib/types";
import { HelpCircleIcon, MicIcon, PlusIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

export default function AssistancePage() {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<QuestionFrequente[] | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<QuestionFrequente>>("/assistance/questions?per_page=100", { token }).then((page) => setQuestions(page.data));
  }, [token]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Assistance"
        description="Questions fréquentes et réponses audio publiées aux clients."
        icone={HelpCircleIcon}
        stats={[
          { valeur: questions?.length ?? "—", label: "Total" },
          { valeur: questions?.filter((q) => q.statut === "publie").length ?? "—", label: "Publiées" },
          { valeur: questions?.filter((q) => q.fichier_audio).length ?? "—", label: "Avec audio" },
        ]}
        action={
          <Link
            href="/clients/assistance/nouveau"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle question
          </Link>
        }
      />

      {questions === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : questions.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune question pour le moment.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {questions.map((question) => (
            <div key={question.id} className="flex flex-col gap-2 rounded-2xl border border-brand-line bg-white p-5">
              <div className="flex items-start justify-between">
                {question.fichier_audio ? (
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--brand-blue-end)]">
                    <MicIcon className="h-3 w-3" />
                    Audio
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    question.statut === "publie" ? "bg-emerald-100 text-emerald-600" : "bg-brand-line text-brand-muted"
                  }`}
                >
                  {question.statut === "publie" ? "Publié" : "Brouillon"}
                </span>
              </div>

              <p className="mt-1 line-clamp-3 text-sm font-bold text-brand-ink">{question.question}</p>
              {question.reponse ? <p className="line-clamp-2 text-xs text-brand-muted">{question.reponse}</p> : null}

              <Link
                href={`/clients/assistance/${question.id}`}
                className="mt-3 flex h-9 items-center justify-center rounded-full bg-brand-ink text-xs font-semibold text-white"
              >
                Voir
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
