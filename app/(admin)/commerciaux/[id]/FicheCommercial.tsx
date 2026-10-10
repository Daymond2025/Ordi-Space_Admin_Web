"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError, apiFetch } from "@/lib/api";
import {
  formaterDate,
  formaterPrix,
  LIBELLE_STATUT_COMPTE,
  STYLE_STATUT_COMPTE,
  type CommandeCommercialAdmin,
  type CommercialDetailAdmin,
  type Pagination,
  type UtilisateurAdmin,
} from "@/lib/types";
import { ChevronLeftIcon, CommerciauxIcon, MailIcon, PencilIcon, PhoneIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const CHAMP = "h-10 rounded-xl border border-brand-line px-3 text-sm";

const LIBELLE_STATUT_COMMANDE: Record<string, string> = {
  en_attente: "En attente",
  validee: "Validée",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
  reportee: "Reportée",
  client_injoignable: "Client injoignable",
  numero_incorrect: "Numéro incorrect",
};

export function FicheCommercial({ commercialId }: { commercialId: number }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<CommercialDetailAdmin | null>(null);
  const [commandes, setCommandes] = useState<CommandeCommercialAdmin[] | null>(null);
  const [erreurCommandes, setErreurCommandes] = useState(false);

  const [utilisateur, setUtilisateur] = useState<UtilisateurAdmin | null>(null);
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState({ nom: "", prenom: "", email: "", telephone: "", nomEntreprise: "", localisation: "" });
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function charger() {
    if (!token) return;
    Promise.all([
      apiFetch<CommercialDetailAdmin>(`/coordinateur/commerciaux/${commercialId}`, { token }),
      apiFetch<UtilisateurAdmin>(`/admin/utilisateurs/${commercialId}`, { token }),
    ])
      .then(([d, u]) => {
        setDetail(d);
        setUtilisateur(u);
        setBrouillon({
          nom: u.nom, prenom: u.prenom ?? "", email: u.email ?? "", telephone: u.telephone ?? "",
          nomEntreprise: d.nom_entreprise ?? "", localisation: d.localisation ?? "",
        });
        setErreur(null);
      })
      .catch(() => setErreur("Impossible de charger ce commercial."));
  }

  useEffect(charger, [token, commercialId]);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<CommandeCommercialAdmin>>(`/coordinateur/commerciaux/${commercialId}/commandes?per_page=50`, { token })
      .then((page) => {
        setCommandes(page.data);
        setErreurCommandes(false);
      })
      .catch(() => setErreurCommandes(true));
  }, [token, commercialId]);

  async function enregistrerIdentite() {
    if (!token) return;
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/admin/utilisateurs/${commercialId}`, {
        method: "PATCH",
        token,
        body: { nom: brouillon.nom, prenom: brouillon.prenom || null, email: brouillon.email, telephone: brouillon.telephone || null },
      });
      await apiFetch(`/coordinateur/commerciaux/${commercialId}/profil`, {
        method: "PATCH",
        token,
        body: { nom_entreprise: brouillon.nomEntreprise || null, localisation: brouillon.localisation || null },
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
    if (!token || !utilisateur) return;
    const nouveauStatut = utilisateur.statut_compte === "actif" ? "desactive" : "actif";
    if (nouveauStatut === "desactive" && !confirm("Désactiver ce compte commercial ? Il ne pourra plus se connecter.")) return;

    setEnCours(true);
    try {
      await apiFetch(`/admin/utilisateurs/${commercialId}/statut`, { method: "PATCH", token, body: { statut_compte: nouveauStatut } });
      charger();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/commerciaux" className="flex items-center gap-1 text-sm font-semibold text-brand-muted">
        <ChevronLeftIcon className="h-4 w-4" /> Retour aux commerciaux
      </Link>

      <PageHero
        titre={detail ? `${detail.prenom ? `${detail.prenom} ` : ""}${detail.nom}` : "Commercial"}
        description={detail?.nom_entreprise ?? undefined}
        icone={CommerciauxIcon}
        stats={
          detail
            ? [
                { valeur: detail.statistiques.commandes_total, label: "Commandes" },
                { valeur: detail.statistiques.commandes_validees, label: "Validées" },
                { valeur: detail.statistiques.commandes_annulees, label: "Annulées" },
                { valeur: `${formaterPrix(detail.statistiques.commission_totale)} CFA`, label: "Commission" },
              ]
            : []
        }
      />

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      {detail && utilisateur ? (
        <div className="rounded-2xl border border-brand-line bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-brand-ink">Informations</p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLE_STATUT_COMPTE[utilisateur.statut_compte]}`}>
                {LIBELLE_STATUT_COMPTE[utilisateur.statut_compte]}
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
                  utilisateur.statut_compte === "actif" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {utilisateur.statut_compte === "actif" ? "Désactiver" : "Réactiver"}
              </button>
            </div>
          </div>

          {!edition ? (
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-brand-muted">
              {detail.telephone ? (
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="h-4 w-4" /> {detail.telephone}
                </span>
              ) : null}
              {utilisateur.email ? (
                <span className="flex items-center gap-1.5">
                  <MailIcon className="h-4 w-4" /> {utilisateur.email}
                </span>
              ) : null}
              {detail.nom_entreprise ? <span>{detail.nom_entreprise}</span> : null}
              {detail.localisation ? <span>Localisation : {detail.localisation}</span> : null}
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
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={brouillon.nomEntreprise}
                  onChange={(e) => setBrouillon((b) => ({ ...b, nomEntreprise: e.target.value }))}
                  placeholder="Nom de l'entreprise"
                  className={CHAMP}
                />
                <input
                  value={brouillon.localisation}
                  onChange={(e) => setBrouillon((b) => ({ ...b, localisation: e.target.value }))}
                  placeholder="Localisation"
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
                  onClick={enregistrerIdentite}
                  disabled={enCours}
                  className="bg-gradient-brand-blue h-10 flex-1 rounded-full text-xs font-semibold text-white disabled:opacity-60"
                >
                  {enCours ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-brand-ink">Commandes saisies</p>
        {erreurCommandes ? (
          <p className="py-10 text-center text-sm text-rose-600">Impossible de charger les commandes.</p>
        ) : commandes === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : commandes.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune commande.</p>
        ) : (
          commandes.map((c) => (
            <Link
              key={c.commande_id}
              href={`/clients/commandes/${c.commande_id}`}
              className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm"
            >
              <div>
                <p className="font-bold text-brand-ink">{c.nom_produit ?? `Commande #${c.commande_id}`}</p>
                <p className="text-xs text-brand-muted">
                  {c.nom_client} · {formaterDate(c.date_commande)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-brand-ink">{formaterPrix(c.montant_total)} CFA</p>
                <p className="text-xs text-brand-muted">{LIBELLE_STATUT_COMMANDE[c.statut] ?? c.statut}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
