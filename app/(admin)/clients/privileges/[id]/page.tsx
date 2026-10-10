"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { Privilege } from "@/lib/types";
import { PrivilegeForm } from "../PrivilegeForm";

export default function EditionPrivilegePage(props: PageProps<"/clients/privileges/[id]">) {
  const { id } = use(props.params);
  const { token } = useAuth();
  const [privilege, setPrivilege] = useState<Privilege | null | undefined>(undefined);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    // Pas de GET /privileges/{id} côté API : on récupère la liste et on
    // isole l'élément recherché.
    if (!token) return;
    apiFetch<Privilege[]>("/privileges", { token })
      .then((liste) => {
        setPrivilege(liste.find((p) => p.id === Number(id)) ?? null);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, [token, id]);

  useEffect(charger, [charger]);

  if (erreur) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-rose-600">Impossible de charger ce privilège.</p>
        <button type="button" onClick={charger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
          Réessayer
        </button>
      </div>
    );
  }

  if (privilege === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (privilege === null) return <p className="text-sm text-brand-muted">Ce privilège est introuvable.</p>;

  return <PrivilegeForm existant={privilege} />;
}
