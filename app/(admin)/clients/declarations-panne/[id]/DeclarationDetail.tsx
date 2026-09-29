"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import {
  formaterDateHeure,
  LIBELLE_STATUT_DEMANDE_SAV,
  LIBELLE_STATUT_INTERVENTION,
  STYLE_STATUT_DEMANDE_SAV,
  type DemandeSav,
  type Pagination,
  type StatutDemandeSav,
  type UtilisateurAdmin,
} from "@/lib/types";
import { ChevronLeftIcon, UserAvatarIcon } from "@/components/icons";
import { Listbox } from "@/components/Listbox";

function versInputDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const decalage = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - decalage).toISOString().slice(0, 16);
}

const STATUTS: StatutDemandeSav[] = ["en_attente", "planifiee", "en_cours", "resolue", "cloturee"];

export function DeclarationDetail({ id }: { id: string }) {
  const { token } = useAuth();
  const [demande, setDemande] = useState<DemandeSav | null | undefined>(undefined);
  const [techniciens, setTechniciens] = useState<UtilisateurAdmin[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const [statutChoisi, setStatutChoisi] = useState<StatutDemandeSav>("en_attente");
  const [technicienId, setTechnicienId] = useState("");
  const [dateRdv, setDateRdv] = useState("");
  const [lieu, setLieu] = useState("");
  // Par défaut, le formulaire modifie le 1er rendez-vous (comportement
  // historique) ; ce mode force une création, pour planifier une visite
  // supplémentaire (ex. le 1er rendez-vous n'a pas suffi à résoudre la panne).
  const [modeNouveauRdv, setModeNouveauRdv] = useState(false);

  function recharger() {
    if (!token) return;
    apiFetch<DemandeSav>(`/sav/demandes/${id}`, { token })
      .then((d) => {
        setDemande(d);
        setStatutChoisi(d.statut_demande);
        const rdv = d.rendez_vous[0];
        if (rdv) {
          setTechnicienId(rdv.technicien_id ? String(rdv.technicien_id) : "");
          setDateRdv(versInputDatetimeLocal(rdv.date_rdv));
          setLieu(rdv.lieu ?? "");
        }
      })
      .catch(() => setDemande(null));
  }

  useEffect(recharger, [token, id]);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<UtilisateurAdmin>>("/admin/utilisateurs?type_utilisateur=technicien_maintenance&per_page=100", { token }).then(
      (page) => setTechniciens(page.data)
    );
  }, [token]);

  async function enregistrerStatut() {
    if (!token) return;
    setErreur(null);
    setChargement(true);
    try {
      await apiFetch(`/sav/demandes/${id}/statut`, { method: "PATCH", token, body: { statut_demande: statutChoisi } });
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de changer le statut.");
    } finally {
      setChargement(false);
    }
  }

  function planifierNouveauRdv() {
    setModeNouveauRdv(true);
    setTechnicienId("");
    setDateRdv("");
    setLieu("");
  }

  async function enregistrerRendezVous() {
    if (!token || !demande) return;
    setErreur(null);
    setChargement(true);

    const rdvExistant = !modeNouveauRdv ? demande.rendez_vous[0] : undefined;
    const corps = {
      technicien_id: technicienId ? Number(technicienId) : null,
      date_rdv: dateRdv,
      lieu: lieu || null,
    };

    try {
      if (rdvExistant) {
        await apiFetch(`/sav/rendez-vous/${rdvExistant.id}`, { method: "PATCH", token, body: corps });
      } else {
        await apiFetch(`/sav/demandes/${id}/rendez-vous`, { method: "POST", token, body: corps });
      }
      setModeNouveauRdv(false);
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer le rendez-vous.");
    } finally {
      setChargement(false);
    }
  }

  if (demande === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (demande === null) return <p className="text-sm text-brand-muted">Cette déclaration est introuvable.</p>;

  const rdv = demande.rendez_vous[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/clients/declarations-panne" className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-brand-ink">Déclaration de panne</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STYLE_STATUT_DEMANDE_SAV[demande.statut_demande]}`}>
          {LIBELLE_STATUT_DEMANDE_SAV[demande.statut_demande]}
        </span>
      </div>

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
          <div>
            <p className="text-xs font-medium text-brand-muted">Client</p>
            <p className="text-sm font-semibold text-brand-ink">
              {demande.client.user.prenom ? `${demande.client.user.prenom} ` : ""}
              {demande.client.user.nom}
            </p>
            <p className="text-xs text-brand-muted">{demande.client.user.email}</p>
            {demande.client.user.telephone ? <p className="text-xs text-brand-muted">{demande.client.user.telephone}</p> : null}
          </div>

          {demande.garantie?.ligne_commande?.produit ? (
            <div>
              <p className="text-xs font-medium text-brand-muted">Appareil concerné</p>
              <p className="text-sm text-brand-ink">{demande.garantie.ligne_commande.produit.nom_produit}</p>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium text-brand-muted">Description du problème</p>
            <p className="mt-1 whitespace-pre-line text-sm text-brand-ink">{demande.description_probleme}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-brand-muted">Date de la déclaration</p>
            <p className="text-sm text-brand-ink">{formaterDateHeure(demande.date_demande)}</p>
          </div>

          <div className="mt-2 flex flex-col gap-1.5 border-t border-brand-line pt-4">
            <label className="text-xs font-medium text-brand-muted">Changer le statut</label>
            <div className="flex gap-2">
              <Listbox
                value={statutChoisi}
                onChange={(v) => setStatutChoisi(v as StatutDemandeSav)}
                options={STATUTS.map((s) => ({ value: s, label: LIBELLE_STATUT_DEMANDE_SAV[s] }))}
                wrapperClassName="flex-1"
              />
              <button
                type="button"
                onClick={enregistrerStatut}
                disabled={chargement || statutChoisi === demande.statut_demande}
                className="rounded-xl bg-brand-ink px-4 text-xs font-semibold text-white disabled:opacity-40"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-brand-ink">
              {modeNouveauRdv ? "Nouveau rendez-vous" : rdv ? "1er rendez-vous planifié" : "Assigner un technicien"}
            </p>
            {rdv && !modeNouveauRdv ? (
              <button type="button" onClick={planifierNouveauRdv} className="text-xs font-semibold text-[color:var(--brand-blue-end)] underline underline-offset-2">
                + Planifier un nouveau rendez-vous
              </button>
            ) : null}
            {modeNouveauRdv ? (
              <button
                type="button"
                onClick={() => {
                  setModeNouveauRdv(false);
                  recharger();
                }}
                className="text-xs font-semibold text-brand-muted underline underline-offset-2"
              >
                Annuler
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Technicien</label>
            <Listbox
              value={technicienId}
              onChange={setTechnicienId}
              options={[
                { value: "", label: "Non assigné" },
                ...techniciens.map((t) => ({
                  value: String(t.id),
                  label: `${t.prenom ? `${t.prenom} ` : ""}${t.nom}`,
                  icon: UserAvatarIcon,
                })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Date et heure du rendez-vous</label>
            <input
              type="datetime-local"
              value={dateRdv}
              onChange={(e) => setDateRdv(e.target.value)}
              className="h-11 rounded-xl border border-brand-line px-3 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Lieu (optionnel)</label>
            <input value={lieu} onChange={(e) => setLieu(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
          </div>

          <button
            type="button"
            onClick={enregistrerRendezVous}
            disabled={chargement || !dateRdv}
            className="bg-gradient-brand-blue mt-1 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          >
            {rdv && !modeNouveauRdv ? "Mettre à jour le rendez-vous" : "Planifier le rendez-vous"}
          </button>

          {rdv?.intervention ? (
            <div className="mt-2 rounded-xl bg-[#EEF1F6] px-4 py-3 text-xs text-brand-ink">
              <p className="font-semibold">Intervention : {LIBELLE_STATUT_INTERVENTION[rdv.intervention.statut_intervention]}</p>
              <p className="mt-1 text-brand-muted">Détails et suivi disponibles dans l&apos;onglet Maintenance.</p>
            </div>
          ) : null}
        </div>
      </div>

      {demande.rendez_vous.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-brand-ink">
            Historique des rendez-vous ({demande.rendez_vous.length})
          </p>
          {demande.rendez_vous.map((r) => (
            <Link
              key={r.id}
              href={`/clients/maintenance/${r.id}`}
              className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm"
            >
              <div>
                <p className="font-semibold text-brand-ink">{formaterDateHeure(r.date_rdv)}</p>
                <p className="text-xs text-brand-muted">
                  {r.technicien ? `${r.technicien.user.prenom ? r.technicien.user.prenom + " " : ""}${r.technicien.user.nom}` : "Technicien non assigné"}
                  {r.lieu ? ` · ${r.lieu}` : ""}
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-muted">
                {r.intervention ? LIBELLE_STATUT_INTERVENTION[r.intervention.statut_intervention] : "Sans intervention"}
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
