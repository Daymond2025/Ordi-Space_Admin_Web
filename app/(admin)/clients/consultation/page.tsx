"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, LIBELLE_SEGMENT_CLIENT, STYLE_SEGMENT_CLIENT, type ClientAdmin, type Pagination } from "@/lib/types";
import { PhoneIcon, SearchIcon, UserAvatarIcon } from "@/components/icons";

function ConsultationContenu() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [recherche, setRecherche] = useState(searchParams.get("recherche") ?? "");
  const [rechercheDebattue, setRechercheDebattue] = useState(searchParams.get("recherche") ?? "");
  const [resultats, setResultats] = useState<ClientAdmin[] | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setRechercheDebattue(recherche), 300);
    return () => clearTimeout(id);
  }, [recherche]);

  useEffect(() => {
    if (!token || !rechercheDebattue.trim()) {
      setResultats(null);
      return;
    }
    setChargement(true);
    apiFetch<Pagination<ClientAdmin>>(`/admin/clients?recherche=${encodeURIComponent(rechercheDebattue)}&per_page=8`, { token })
      .then((p) => setResultats(p.data))
      .finally(() => setChargement(false));
  }, [token, rechercheDebattue]);

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
        <h1 className="text-xl font-bold text-brand-ink">Consultation rapide</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Recherchez un client par nom, email ou téléphone pour ouvrir directement sa fiche — pratique pendant un appel.
        </p>

        <div className="relative mt-5">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom, email ou numéro de téléphone…"
            className="h-14 w-full rounded-2xl border border-brand-line pl-11 pr-4 text-base outline-none focus:border-[color:var(--brand-blue-end)]"
          />
        </div>
      </div>

      {rechercheDebattue.trim() ? (
        <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
          {chargement ? (
            <p className="py-10 text-center text-sm text-brand-muted">Recherche…</p>
          ) : !resultats || resultats.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">Aucun client ne correspond à « {rechercheDebattue} ».</p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase text-brand-muted">
                {resultats.length} résultat{resultats.length > 1 ? "s" : ""}
              </p>
              {resultats.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/consultation/${c.id}`}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-line p-4 transition-colors hover:border-[color:var(--brand-blue-end)]/40"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
                    <UserAvatarIcon className="h-6 w-6" />
                  </span>
                  <div className="min-w-[160px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-brand-ink">{c.prenom ? `${c.prenom} ${c.nom}` : c.nom}</p>
                      {c.segment ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STYLE_SEGMENT_CLIENT[c.segment]}`}>
                          {LIBELLE_SEGMENT_CLIENT[c.segment]}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-brand-muted">{c.email}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs text-brand-muted">
                    <PhoneIcon className="h-3.5 w-3.5" />
                    {c.telephone ?? "—"}
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-brand-ink">{formaterPrix(c.total_depense)} FCFA dépensés</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-3xl border border-brand-line bg-white text-sm text-brand-muted">
          Commencez à taper pour rechercher un client.
        </div>
      )}
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={<p className="text-sm text-brand-muted">Chargement…</p>}>
      <ConsultationContenu />
    </Suspense>
  );
}
