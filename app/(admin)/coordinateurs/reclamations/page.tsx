"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDateHeure, type Pagination, type ReclamationCoordinateurAdmin, type StatutReclamation } from "@/lib/types";
import { CoordinateursIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const ONGLETS_STATUT: { id: StatutReclamation | "tous"; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "nouvelle", label: "Non prise en charge" },
  { id: "en_cours", label: "Prise en charge" },
  { id: "resolue", label: "Résolue" },
  { id: "rejetee", label: "Rejetée" },
];

const ENTITES: { id: string | "toutes"; label: string }[] = [
  { id: "toutes", label: "Toutes les entités" },
  { id: "client", label: "Client" },
  { id: "fournisseur", label: "Fournisseur" },
  { id: "commercial", label: "Commercial" },
  { id: "livreur", label: "Livreur" },
  { id: "technicien_maintenance", label: "Technicien maintenance" },
];

/**
 * Cœur du travail du Coordinateur : les 5 entités qui peuvent déposer une
 * réclamation (Reclamation::auteur(), générique) — vit sous /coordinateurs
 * plutôt que /clients/reclamations, qui reste volontairement scopé aux
 * clients (ancien format).
 */
export default function ReclamationsCoordinateurPage() {
  const { token } = useAuth();
  const [statut, setStatut] = useState<(typeof ONGLETS_STATUT)[number]["id"]>("tous");
  const [entite, setEntite] = useState<(typeof ENTITES)[number]["id"]>("toutes");
  const [reclamations, setReclamations] = useState<ReclamationCoordinateurAdmin[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    const params = new URLSearchParams({ per_page: "100" });
    if (statut !== "tous") params.set("statut", statut);
    if (entite !== "toutes") params.set("type_auteur", entite);

    apiFetch<Pagination<ReclamationCoordinateurAdmin>>(`/reclamations?${params}`, { token }).then((page) => {
      if (!annule) setReclamations(page.data);
    });

    return () => {
      annule = true;
    };
  }, [token, statut, entite]);

  const compteurs = useMemo(() => {
    if (!reclamations) return null;
    return {
      nouvelle: reclamations.filter((r) => r.statut === "nouvelle").length,
      en_cours: reclamations.filter((r) => r.statut === "en_cours").length,
      terminee: reclamations.filter((r) => r.statut === "resolue" || r.statut === "rejetee").length,
    };
  }, [reclamations]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Réclamations"
        description="Client, Fournisseur, Commercial, Livreur, Technicien maintenance — traitées par le Coordinateur."
        icone={CoordinateursIcon}
        stats={[
          { valeur: compteurs?.nouvelle ?? "—", label: "Non prise en charge" },
          { valeur: compteurs?.en_cours ?? "—", label: "Prise en charge" },
          { valeur: compteurs?.terminee ?? "—", label: "Terminées" },
        ]}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {ONGLETS_STATUT.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setStatut(o.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                statut === o.id ? "bg-brand-ink text-white" : "border border-brand-line bg-white text-brand-muted"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <select
          value={entite}
          onChange={(e) => setEntite(e.target.value)}
          className="rounded-full border border-brand-line bg-white px-4 py-2 text-xs font-semibold text-brand-ink outline-none"
        >
          {ENTITES.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      {reclamations === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : reclamations.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-muted">Aucune réclamation dans cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {reclamations.map((r) => (
            <Link
              key={r.id}
              href={`/coordinateurs/reclamations/${r.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-brand-line bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-brand-ink">
                    {r.auteur.prenom ? `${r.auteur.prenom} ` : ""}
                    {r.auteur.nom}
                  </p>
                  <span className="shrink-0 rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
                    {ENTITES.find((e) => e.id === r.auteur.type_utilisateur)?.label ?? r.auteur.type_utilisateur}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-semibold text-[color:var(--brand-blue-end)]">{r.titre}</p>
                <p className="mt-0.5 truncate text-xs text-brand-muted">{r.description}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-brand-muted">{formaterDateHeure(r.date_reclamation)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
