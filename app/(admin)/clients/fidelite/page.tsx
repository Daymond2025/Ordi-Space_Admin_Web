"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetchAvecMeta } from "@/lib/api";
import { formaterDateHeure, formaterPrix, type ClientFidelite, type Pagination, type StatsFidelite } from "@/lib/types";
import { CashIcon, ChevronLeftIcon, GiftIconOutline, TicketIcon, UserAvatarIcon, UserPlusIcon } from "@/components/icons";

function StatCarte({ label, valeur, icone: Icone, couleur }: { label: string; valeur: string; icone: typeof CashIcon; couleur: string }) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-none">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-ink">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${couleur}`}>
          <Icone className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-brand-ink">{valeur}</p>
    </div>
  );
}

export default function FidelitePage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<ClientFidelite[] | null>(null);
  const [pagination, setPagination] = useState<Pick<Pagination<ClientFidelite>, "current_page" | "last_page" | "total"> | null>(null);
  const [stats, setStats] = useState<StatsFidelite | null>(null);
  const [recherche, setRecherche] = useState("");
  const [afficherTous, setAfficherTous] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams({ per_page: "10", page: String(page) });
    if (recherche) params.set("recherche", recherche);
    if (afficherTous) params.set("tous", "1");

    apiFetchAvecMeta<Pagination<ClientFidelite>, { stats: StatsFidelite }>(`/admin/fidelite?${params}`, { token }).then(({ data, meta }) => {
      setClients(data.data);
      setPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
      setStats(meta.stats);
    });
  }, [token, recherche, afficherTous, page]);

  return (
    <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-ink">Fidélité</h1>
          <p className="mt-0.5 text-sm text-brand-muted">Portefeuille et parrainage — récompenses réellement créditées aux clients.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCarte
          label="Solde total en circulation"
          valeur={`${formaterPrix(stats?.solde_total ?? 0)} FCFA`}
          icone={CashIcon}
          couleur="bg-amber-50 text-amber-600"
        />
        <StatCarte
          label="Total crédité (parrainage)"
          valeur={`${formaterPrix(stats?.total_credite ?? 0)} FCFA`}
          icone={GiftIconOutline}
          couleur="bg-emerald-50 text-emerald-500"
        />
        <StatCarte
          label="Clients parrains actifs"
          valeur={String(stats?.clients_avec_filleuls ?? 0)}
          icone={UserPlusIcon}
          couleur="bg-blue-50 text-[color:var(--brand-blue-end)]"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm font-bold text-brand-ink">Clients dans le programme</p>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAfficherTous((v) => !v);
              setPage(1);
            }}
            className={`h-10 rounded-full border px-4 text-xs font-semibold transition-colors ${
              afficherTous ? "border-[color:var(--brand-blue-end)] bg-blue-50 text-[color:var(--brand-blue-end)]" : "border-brand-line text-brand-muted"
            }`}
          >
            {afficherTous ? "Tous les clients" : "Actifs seulement"}
          </button>
          <input
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setPage(1);
            }}
            placeholder="Nom, email ou code parrainage…"
            className="h-10 w-64 rounded-full border border-brand-line px-4 text-sm outline-none focus:border-[color:var(--brand-blue-end)]"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {clients === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : clients.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">
            {afficherTous ? "Aucun client ne correspond à cette recherche." : "Aucun client actif dans le programme pour l'instant."}
          </p>
        ) : (
          clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/consultation/${c.id}`}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-line bg-white p-4 shadow-none transition-colors hover:border-[color:var(--brand-blue-end)]/40"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
                <UserAvatarIcon className="h-6 w-6" />
              </span>

              <div className="min-w-[160px] flex-1">
                <p className="text-sm font-bold text-brand-ink">{c.prenom ? `${c.prenom} ${c.nom}` : c.nom}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-muted">
                  <TicketIcon className="h-3.5 w-3.5" />
                  {c.code_parrainage}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
                  <p className="text-sm font-extrabold text-amber-600">{formaterPrix(c.solde_portefeuille)} FCFA</p>
                  <p className="text-[10px] font-medium text-amber-600">Solde portefeuille</p>
                </div>
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                  <p className="text-sm font-extrabold text-[color:var(--brand-blue-end)]">{c.nombre_filleuls}</p>
                  <p className="text-[10px] font-medium text-[color:var(--brand-blue-end)]">Filleul{c.nombre_filleuls > 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-xl bg-[#EEF1F6] px-3 py-2 text-center">
                  <p className="text-sm font-extrabold text-brand-ink">Dernier crédit</p>
                  <p className="text-[10px] font-medium text-brand-muted">
                    {c.derniere_transaction ? formaterDateHeure(c.derniere_transaction) : "—"}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {pagination && pagination.last_page > 1 ? (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-brand-muted">
            Page {pagination.current_page} sur {pagination.last_page} — {pagination.total} clients
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
