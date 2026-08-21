"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import {
  formaterDateHeure,
  LIBELLE_STATUT_RECLAMATION,
  STYLE_STATUT_RECLAMATION,
  type Pagination,
  type ReclamationAdmin,
  type StatutReclamation,
} from "@/lib/types";
import { ChevronDownIcon, ChevronLeftIcon, HelpCircleIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";

const OPTIONS_STATUT_FILTRE = [
  { value: "", label: "Tous les statuts" },
  { value: "nouvelle", label: "Nouvelle" },
  { value: "en_cours", label: "En cours" },
  { value: "resolue", label: "Résolue" },
  { value: "rejetee", label: "Rejetée" },
];

const OPTIONS_STATUT_REPONSE = [
  { value: "en_cours", label: "En cours" },
  { value: "resolue", label: "Résolue" },
  { value: "rejetee", label: "Rejetée" },
];

function LigneReclamation({
  reclamation,
  token,
  onMiseAJour,
}: {
  reclamation: ReclamationAdmin;
  token: string;
  onMiseAJour: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [statutChoisi, setStatutChoisi] = useState<StatutReclamation>(
    reclamation.statut === "nouvelle" ? "en_cours" : reclamation.statut
  );
  const [reponse, setReponse] = useState(reclamation.reponse_admin ?? "");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    setEnCours(true);
    setErreur(null);
    try {
      await apiFetch(`/reclamations/${reclamation.id}/repondre`, {
        method: "PATCH",
        token,
        body: { statut: statutChoisi, reponse_admin: reponse },
      });
      setOuvert(false);
      onMiseAJour();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer la réponse.");
    } finally {
      setEnCours(false);
    }
  }

  const nomClient = reclamation.client.user.prenom
    ? `${reclamation.client.user.prenom} ${reclamation.client.user.nom}`
    : reclamation.client.user.nom;

  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-none">
      <button type="button" onClick={() => setOuvert((v) => !v)} className="flex w-full items-start gap-3 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <HelpCircleIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-brand-ink">{reclamation.sujet}</p>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLE_STATUT_RECLAMATION[reclamation.statut]}`}>
              {LIBELLE_STATUT_RECLAMATION[reclamation.statut]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-brand-muted">
            {nomClient} · {reclamation.client.user.email} — {formaterDateHeure(reclamation.date_reclamation)}
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm text-brand-ink">{reclamation.description}</p>
        </div>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-brand-muted transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>

      {ouvert ? (
        <div className="ml-14 mt-3 flex flex-col gap-3 border-t border-brand-line pt-3">
          <p className="whitespace-pre-line text-sm text-brand-ink">{reclamation.description}</p>

          {reclamation.reponse_admin ? (
            <div className="rounded-xl bg-[#EEF1F6] p-3 text-xs text-brand-ink">
              <p className="font-semibold text-brand-muted">Réponse actuelle</p>
              <p className="mt-1">{reclamation.reponse_admin}</p>
            </div>
          ) : null}

          {erreur ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{erreur}</p> : null}

          <Listbox value={statutChoisi} onChange={(v) => setStatutChoisi(v as StatutReclamation)} options={OPTIONS_STATUT_REPONSE} />
          <textarea
            value={reponse}
            onChange={(e) => setReponse(e.target.value)}
            rows={3}
            placeholder="Réponse à envoyer au client…"
            className="rounded-xl border border-brand-line px-3 py-2 text-sm outline-none focus:border-[color:var(--brand-blue-end)]"
          />
          <button
            type="button"
            onClick={envoyer}
            disabled={enCours || !reponse.trim()}
            className="self-end rounded-full bg-brand-ink px-5 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            {enCours ? "Envoi…" : "Enregistrer la réponse"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function ReclamationsPage() {
  const { token } = useAuth();
  const [reclamations, setReclamations] = useState<ReclamationAdmin[] | null>(null);
  const [pagination, setPagination] = useState<Pick<Pagination<ReclamationAdmin>, "current_page" | "last_page" | "total"> | null>(null);
  const [statutFiltre, setStatutFiltre] = useState("");
  const [page, setPage] = useState(1);

  function recharger() {
    if (!token) return;
    const params = new URLSearchParams({ per_page: "10", page: String(page) });
    if (statutFiltre) params.set("statut", statutFiltre);

    apiFetch<Pagination<ReclamationAdmin>>(`/reclamations?${params}`, { token }).then((p) => {
      setReclamations(p.data);
      setPagination({ current_page: p.current_page, last_page: p.last_page, total: p.total });
    });
  }

  useEffect(recharger, [token, statutFiltre, page]);

  return (
    <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-ink">Réclamations</h1>
          <p className="mt-0.5 text-sm text-brand-muted">Litiges déposés par les clients (commande, livraison, facturation…).</p>
        </div>
        <Listbox
          value={statutFiltre}
          onChange={(v) => {
            setStatutFiltre(v);
            setPage(1);
          }}
          options={OPTIONS_STATUT_FILTRE}
          wrapperClassName="w-48"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {reclamations === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : reclamations.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune réclamation pour l&apos;instant.</p>
        ) : (
          reclamations.map((r) => <LigneReclamation key={r.id} reclamation={r} token={token!} onMiseAJour={recharger} />)
        )}
      </div>

      {pagination && pagination.last_page > 1 ? (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-brand-muted">
            Page {pagination.current_page} sur {pagination.last_page} — {pagination.total} réclamations
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-line text-brand-muted disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page >= pagination.last_page}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-line text-brand-muted disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
