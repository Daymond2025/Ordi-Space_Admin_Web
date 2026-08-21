"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { Privilege } from "@/lib/types";
import { PrivilegeForm } from "../PrivilegeForm";

export default function EditionPrivilegePage(props: PageProps<"/clients/privileges/[id]">) {
  const { id } = use(props.params);
  const { token } = useAuth();
  const [privilege, setPrivilege] = useState<Privilege | null | undefined>(undefined);

  useEffect(() => {
    // Pas de GET /privileges/{id} côté API : on récupère la liste et on
    // isole l'élément recherché.
    if (!token) return;
    apiFetch<Privilege[]>("/privileges", { token }).then((liste) => {
      setPrivilege(liste.find((p) => p.id === Number(id)) ?? null);
    });
  }, [token, id]);

  if (privilege === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (privilege === null) return <p className="text-sm text-brand-muted">Ce privilège est introuvable.</p>;

  return <PrivilegeForm existant={privilege} />;
}
