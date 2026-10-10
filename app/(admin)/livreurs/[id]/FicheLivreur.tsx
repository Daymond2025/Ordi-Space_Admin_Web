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
  type CommandeBoutiqueAdmin,
  type LivreurDetailAdmin,
  type MissionLivreurAdmin,
  type ReponseCommandesBoutiqueAdmin,
  type UtilisateurAdmin,
} from "@/lib/types";
import { ChevronLeftIcon, LivreursIcon, MailIcon, PencilIcon, PhoneIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";
import { PageHero } from "@/components/PageHero";

const CHAMP = "h-10 rounded-xl border border-brand-line px-3 text-sm";

const OPTIONS_VEHICULE = [
  { value: "", label: "Non renseigné" },
  { value: "moto", label: "Moto" },
  { value: "voiture", label: "Voiture" },
  { value: "tricycle", label: "Tricycle" },
  { value: "velo", label: "Vélo" },
];

const LIBELLE_STATUT_LIVRAISON: Record<string, string> = {
  en_preparation: "En préparation",
  en_attente_livreur: "En attente d'un livreur",
  assignee: "En attente d'acceptation",
  en_cours: "En cours",
  livree: "Livrée",
  echouee: "Échouée",
};

const LIBELLE_STATUT_VENTE_BOUTIQUE: Record<CommandeBoutiqueAdmin["statut"], string> = {
  en_attente: "À valider",
  en_cours: "En cours",
  livree: "Livrée",
  annulee: "Annulée",
};

export function FicheLivreur({ livreurId }: { livreurId: number }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<LivreurDetailAdmin | null>(null);
  const [missions, setMissions] = useState<MissionLivreurAdmin[] | null>(null);
  const [ventesBoutique, setVentesBoutique] = useState<ReponseCommandesBoutiqueAdmin | null>(null);
  const [erreurVentesBoutique, setErreurVentesBoutique] = useState(false);

  const [utilisateur, setUtilisateur] = useState<UtilisateurAdmin | null>(null);
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState({ nom: "", prenom: "", email: "", telephone: "", typeVehicule: "", zoneCouverture: "" });
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function charger() {
    if (!token) return;
    Promise.all([
      apiFetch<LivreurDetailAdmin>(`/coordinateur/livreurs/${livreurId}`, { token }),
      apiFetch<MissionLivreurAdmin[]>(`/coordinateur/livreurs/${livreurId}/missions`, { token }),
      apiFetch<UtilisateurAdmin>(`/admin/utilisateurs/${livreurId}`, { token }),
    ])
      .then(([d, m, u]) => {
        setDetail(d);
        setMissions(m);
        setUtilisateur(u);
        setBrouillon({
          nom: u.nom, prenom: u.prenom ?? "", email: u.email ?? "", telephone: u.telephone ?? "",
          typeVehicule: d.type_vehicule ?? "", zoneCouverture: d.zone_couverture ?? "",
        });
        setErreur(null);
      })
      .catch(() => setErreur("Impossible de charger ce livreur."));
  }

  useEffect(charger, [token, livreurId]);

  async function enregistrerIdentite() {
    if (!token) return;
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/admin/utilisateurs/${livreurId}`, {
        method: "PATCH",
        token,
        body: { nom: brouillon.nom, prenom: brouillon.prenom || null, email: brouillon.email, telephone: brouillon.telephone || null },
      });
      await apiFetch(`/coordinateur/livreurs/${livreurId}/profil`, {
        method: "PATCH",
        token,
        body: { type_vehicule: brouillon.typeVehicule || null, zone_couverture: brouillon.zoneCouverture || null },
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
    if (nouveauStatut === "desactive" && !confirm("Désactiver ce compte livreur ? Il ne pourra plus se connecter.")) return;

    setEnCours(true);
    try {
      await apiFetch(`/admin/utilisateurs/${livreurId}/statut`, { method: "PATCH", token, body: { statut_compte: nouveauStatut } });
      charger();
    } finally {
      setEnCours(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    apiFetch<ReponseCommandesBoutiqueAdmin>(`/admin/boutique/commandes?livreur_id=${livreurId}&per_page=50`, { token })
      .then((data) => {
        setVentesBoutique(data);
        setErreurVentesBoutique(false);
      })
      .catch(() => setErreurVentesBoutique(true));
  }, [token, livreurId]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/livreurs" className="flex items-center gap-1 text-sm font-semibold text-brand-muted">
        <ChevronLeftIcon className="h-4 w-4" /> Retour aux livreurs
      </Link>

      <PageHero
        titre={detail ? `${detail.prenom ? `${detail.prenom} ` : ""}${detail.nom}` : "Livreur"}
        description={detail ? (detail.disponible ? "Disponible" : "Occupé") : undefined}
        icone={LivreursIcon}
        stats={
          detail
            ? [
                { valeur: detail.statistiques.commandes_total, label: "Missions totales" },
                { valeur: detail.statistiques.commandes_livrees, label: "Livrées" },
                { valeur: detail.statistiques.commandes_retournees, label: "Retournées" },
                { valeur: `${formaterPrix(detail.statistiques.gains_total_recu)} CFA`, label: "Cash encaissé" },
                { valeur: `${formaterPrix(detail.statistiques.gains_non_deposes)} CFA`, label: "Non déposé" },
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
              {detail.email ? (
                <span className="flex items-center gap-1.5">
                  <MailIcon className="h-4 w-4" /> {detail.email}
                </span>
              ) : null}
              {detail.type_vehicule ? <span className="capitalize">{detail.type_vehicule}</span> : null}
              {detail.zone_couverture ? <span>Zone : {detail.zone_couverture}</span> : null}
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
                <Listbox
                  value={brouillon.typeVehicule}
                  onChange={(v) => setBrouillon((b) => ({ ...b, typeVehicule: v }))}
                  options={OPTIONS_VEHICULE}
                />
                <input
                  value={brouillon.zoneCouverture}
                  onChange={(e) => setBrouillon((b) => ({ ...b, zoneCouverture: e.target.value }))}
                  placeholder="Zone couverte"
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
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-brand-ink">Missions</p>
        {missions === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : missions.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune mission.</p>
        ) : (
          missions.map((mission) => (
            <div key={mission.commande_id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
              <div>
                <p className="font-bold text-brand-ink">{mission.nom_produit ?? `Commande #${mission.commande_id}`}</p>
                <p className="text-xs text-brand-muted">
                  {mission.nom_client} · {mission.zone_destination ?? "Zone non renseignée"}
                </p>
                {mission.nom_fournisseur ? <p className="text-[11px] text-brand-muted">Chez {mission.nom_fournisseur}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-brand-ink">{LIBELLE_STATUT_LIVRAISON[mission.statut_livraison] ?? mission.statut_livraison}</p>
                {mission.date_livraison_effective ? (
                  <p className="text-[11px] text-brand-muted">{formaterDate(mission.date_livraison_effective)}</p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-brand-ink">Ventes Boutique (affiliation)</p>
          {ventesBoutique ? (
            <p className="text-xs text-brand-muted">
              {formaterPrix(ventesBoutique.stats.commission_acquise)} CFA de commission acquise
            </p>
          ) : null}
        </div>
        <p className="text-xs text-brand-muted">
          Commandes apportées par ce livreur via son lien/QR affilié — distinctes des missions de livraison ci-dessus.
        </p>
        {erreurVentesBoutique ? (
          <p className="py-10 text-center text-sm text-rose-600">Impossible de charger les ventes boutique.</p>
        ) : ventesBoutique === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : ventesBoutique.commandes.data.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune vente boutique apportée par ce livreur.</p>
        ) : (
          ventesBoutique.commandes.data.map((vente) => (
            <Link
              key={vente.id}
              href={`/clients/commandes/${vente.commande_id}`}
              className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm"
            >
              <div>
                <p className="font-bold text-brand-ink">{vente.nom_produit ?? `Commande #${vente.commande_id}`}</p>
                <p className="text-xs text-brand-muted">
                  {vente.client} · {formaterDate(vente.date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-orange-500">+{formaterPrix(vente.commission)} CFA</p>
                <p className="text-[11px] text-brand-muted">{LIBELLE_STATUT_VENTE_BOUTIQUE[vente.statut]}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
