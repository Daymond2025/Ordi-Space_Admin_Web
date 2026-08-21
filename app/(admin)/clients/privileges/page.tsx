"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, LIBELLE_TYPE_PRIVILEGE, type Privilege } from "@/lib/types";
import { GiftIconOutline, PlusIcon, TicketIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

export default function PrivilegesPage() {
  const { token } = useAuth();
  const [privileges, setPrivileges] = useState<Privilege[] | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<Privilege[]>("/privileges", { token }).then(setPrivileges);
  }, [token]);

  const stats = useMemo(() => {
    if (!privileges) return null;
    return {
      total: privileges.length,
      actifs: privileges.filter((p) => p.actif).length,
      inactifs: privileges.filter((p) => !p.actif).length,
    };
  }, [privileges]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Privilèges"
        description="Avantages, remises et codes promo publiés aux clients."
        icone={TicketIcon}
        stats={[
          { valeur: stats?.total ?? "—", label: "Total" },
          { valeur: stats?.actifs ?? "—", label: "Actifs" },
          { valeur: stats?.inactifs ?? "—", label: "Inactifs" },
        ]}
        action={
          <Link
            href="/clients/privileges/nouveau"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[color:var(--brand-blue-end)] shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau privilège
          </Link>
        }
      />

      {privileges === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : privileges.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucun privilège pour le moment.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {privileges.map((privilege) => (
            <div
              key={privilege.id}
              className="relative flex flex-col gap-1.5 overflow-hidden rounded-[28px] p-5 text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${privilege.couleur_debut} 0%, ${privilege.couleur_fin} 100%)` }}
            >
              <GiftIconOutline className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-white/15" />

              <div className="relative flex items-start justify-between">
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold">{LIBELLE_TYPE_PRIVILEGE[privilege.type_privilege]}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${privilege.actif ? "bg-white/90 text-emerald-600" : "bg-black/20 text-white/80"}`}>
                  {privilege.actif ? "Actif" : "Inactif"}
                </span>
              </div>

              <p className="relative mt-1 text-sm font-semibold">{privilege.titre}</p>
              {privilege.sous_titre ? <p className="relative text-xs text-white/85">{privilege.sous_titre}</p> : null}

              <p className="relative mt-1 text-2xl font-extrabold">
                {privilege.valeur
                  ? privilege.type_privilege === "remise_pourcentage"
                    ? `${privilege.valeur}%`
                    : `${formaterPrix(privilege.valeur)} CFA`
                  : "—"}
              </p>
              {privilege.code_promo ? <p className="relative text-xs text-white/85">Code : {privilege.code_promo}</p> : null}

              <Link
                href={`/clients/privileges/${privilege.id}`}
                className="relative mt-3 flex h-9 items-center justify-center rounded-full bg-white/95 text-xs font-semibold text-brand-ink"
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
