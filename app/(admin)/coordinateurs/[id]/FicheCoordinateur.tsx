"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError, apiFetch } from "@/lib/api";
import {
  clientDepuisLibelle,
  formaterDateHeure,
  LIBELLE_STATUT_COMPTE,
  STYLE_STATUT_COMPTE,
  type ActiviteCoordinateur,
  type CoordinateurDetailAdmin,
  type Pagination,
} from "@/lib/types";
import { ChevronLeftIcon, CoordinateursIcon, MailIcon, PencilIcon, PhoneIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const CHAMP = "h-10 rounded-xl border border-brand-line px-3 text-sm";

export function FicheCoordinateur({ coordinateurId }: { coordinateurId: number }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<CoordinateurDetailAdmin | null>(null);
  const [activites, setActivites] = useState<ActiviteCoordinateur[] | null>(null);
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState({ nom: "", prenom: "", email: "", telephone: "", adresse: "", horaires: "", zoneCouverte: "" });
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function charger() {
    if (!token) return;
    apiFetch<CoordinateurDetailAdmin>(`/admin/coordinateurs/${coordinateurId}`, { token }).then((d) => {
      setDetail(d);
      setBrouillon({
        nom: d.nom,
        prenom: d.prenom ?? "",
        email: d.email ?? "",
        telephone: d.telephone ?? "",
        adresse: d.adresse ?? "",
        horaires: d.horaires ?? "",
        zoneCouverte: d.zone_couverte ?? "",
      });
    });
  }

  useEffect(charger, [token, coordinateurId]);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<ActiviteCoordinateur>>(`/admin/coordinateurs/${coordinateurId}/activites?periode=tout&per_page=20`, { token }).then((page) =>
      setActivites(page.data)
    );
  }, [token, coordinateurId]);

  async function enregistrer() {
    if (!token) return;
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/admin/utilisateurs/${coordinateurId}`, {
        method: "PATCH",
        token,
        body: { nom: brouillon.nom, prenom: brouillon.prenom || null, email: brouillon.email, telephone: brouillon.telephone || null },
      });
      await apiFetch(`/admin/coordinateurs/${coordinateurId}/profil`, {
        method: "PATCH",
        token,
        body: { adresse: brouillon.adresse || null, horaires: brouillon.horaires || null, zone_couverte: brouillon.zoneCouverte || null },
      });
      setEdition(false);
      charger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer ces modifications.");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerStatut() {
    if (!token || !detail) return;
    const nouveauStatut = detail.statut_compte === "actif" ? "desactive" : "actif";
    if (nouveauStatut === "desactive" && !confirm("Désactiver ce compte coordinateur ? Il ne pourra plus se connecter.")) return;

    setEnCours(true);
    try {
      await apiFetch(`/admin/utilisateurs/${coordinateurId}/statut`, { method: "PATCH", token, body: { statut_compte: nouveauStatut } });
      charger();
    } finally {
      setEnCours(false);
    }
  }

  if (!detail) {
    return <p className="text-sm text-brand-muted">Chargement…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/coordinateurs/liste" className="flex items-center gap-1 text-sm font-semibold text-brand-muted">
        <ChevronLeftIcon className="h-4 w-4" /> Retour aux coordinateurs
      </Link>

      <PageHero
        titre={detail.prenom ? `${detail.prenom} ${detail.nom}` : detail.nom}
        description={`Coordinateur depuis ${clientDepuisLibelle(detail.membre_depuis)}`}
        icone={CoordinateursIcon}
        stats={[
          { valeur: detail.statistiques.commandes_validees, label: "Commandes validées" },
          { valeur: detail.statistiques.produits_valides, label: "Produits validés" },
          { valeur: detail.statistiques.activites, label: "Activités" },
        ]}
      />

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      <div className="rounded-2xl border border-brand-line bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-brand-ink">Informations</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLE_STATUT_COMPTE[detail.statut_compte]}`}>
              {LIBELLE_STATUT_COMPTE[detail.statut_compte]}
            </span>
          </div>
          <div className="flex gap-2">
            {!edition ? (
              <button
                type="button"
                onClick={() => setEdition(true)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-brand-line px-3.5 text-xs font-semibold text-brand-ink"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Modifier
              </button>
            ) : null}
            <button
              type="button"
              onClick={basculerStatut}
              disabled={enCours}
              className={`h-9 rounded-full px-3.5 text-xs font-semibold disabled:opacity-50 ${
                detail.statut_compte === "actif" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {detail.statut_compte === "actif" ? "Désactiver" : "Réactiver"}
            </button>
          </div>
        </div>

        {!edition ? (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand-muted">
            {detail.email ? (
              <span className="flex items-center gap-1.5">
                <MailIcon className="h-4 w-4" /> {detail.email}
              </span>
            ) : null}
            {detail.telephone ? (
              <span className="flex items-center gap-1.5">
                <PhoneIcon className="h-4 w-4" /> {detail.telephone}
              </span>
            ) : null}
            {detail.zone_couverte ? <span>Zone : {detail.zone_couverte}</span> : null}
            {detail.adresse ? <span>{detail.adresse}</span> : null}
            {detail.horaires ? <span>{detail.horaires}</span> : null}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={brouillon.nom} onChange={(e) => setBrouillon((b) => ({ ...b, nom: e.target.value }))} placeholder="Nom" className={CHAMP} />
              <input
                value={brouillon.prenom}
                onChange={(e) => setBrouillon((b) => ({ ...b, prenom: e.target.value }))}
                placeholder="Prénom"
                className={CHAMP}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                value={brouillon.email}
                onChange={(e) => setBrouillon((b) => ({ ...b, email: e.target.value }))}
                placeholder="E-mail"
                className={CHAMP}
              />
              <input
                value={brouillon.telephone}
                onChange={(e) => setBrouillon((b) => ({ ...b, telephone: e.target.value }))}
                placeholder="Téléphone"
                className={CHAMP}
              />
            </div>
            <input
              value={brouillon.zoneCouverte}
              onChange={(e) => setBrouillon((b) => ({ ...b, zoneCouverte: e.target.value }))}
              placeholder="Zone couverte"
              className={CHAMP}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={brouillon.adresse}
                onChange={(e) => setBrouillon((b) => ({ ...b, adresse: e.target.value }))}
                placeholder="Adresse"
                className={CHAMP}
              />
              <input
                value={brouillon.horaires}
                onChange={(e) => setBrouillon((b) => ({ ...b, horaires: e.target.value }))}
                placeholder="Horaires"
                className={CHAMP}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEdition(false);
                  charger();
                }}
                className="h-10 flex-1 rounded-full border border-brand-line text-xs font-semibold text-brand-muted"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={enregistrer}
                disabled={enCours}
                className="bg-gradient-brand-blue h-10 flex-1 rounded-full text-xs font-semibold text-white disabled:opacity-60"
              >
                {enCours ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-brand-ink">Activité récente</p>
        {activites === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : activites.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune activité enregistrée.</p>
        ) : (
          activites.map((activite) => (
            <div key={activite.id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
              <div>
                <p className="font-semibold text-brand-ink">{activite.details ?? activite.action}</p>
                {activite.entite_concernee ? <p className="text-xs text-brand-muted">{activite.entite_concernee}</p> : null}
              </div>
              <span className="shrink-0 text-xs text-brand-muted">{formaterDateHeure(activite.date_heure)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
