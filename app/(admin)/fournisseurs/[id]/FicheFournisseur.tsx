"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError, apiFetch } from "@/lib/api";
import {
  formaterDate,
  formaterDateHeure,
  formaterPrix,
  LIBELLE_STATUT_COMPTE,
  STYLE_STATUT_COMPTE,
  type FournisseurDetailAdmin,
  type Pagination,
  type PaiementsGlobalFournisseurAdmin,
  type PortefeuilleFournisseurAdmin,
  type StatistiquesFournisseurAdmin,
  type UtilisateurAdmin,
} from "@/lib/types";
import { ChevronLeftIcon, FournisseursIcon, MailIcon, PencilIcon, PhoneIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

const CHAMP = "h-10 rounded-xl border border-brand-line px-3 text-sm";

type CommandeFournisseur = {
  commande_id: number;
  nom_produit: string | null;
  nom_client: string;
  statut: string;
  derniere_action: string;
};

const ONGLETS = [
  { id: "apercu", label: "Aperçu" },
  { id: "commandes", label: "Commandes" },
  { id: "portefeuille", label: "Portefeuille" },
  { id: "paiements", label: "Paiements" },
] as const;

const LIBELLE_TYPE_PAIEMENT: Record<"achat_externe" | "transaction", string> = {
  achat_externe: "Achat externe (commission due)",
  transaction: "Vente in-app (crédit)",
};

export function FicheFournisseur({ fournisseurId }: { fournisseurId: number }) {
  const { token } = useAuth();
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("apercu");

  const [detail, setDetail] = useState<FournisseurDetailAdmin | null>(null);
  const [ventes, setVentes] = useState<StatistiquesFournisseurAdmin | null>(null);
  const [commandes, setCommandes] = useState<CommandeFournisseur[] | null>(null);
  const [portefeuille, setPortefeuille] = useState<PortefeuilleFournisseurAdmin | null>(null);
  const [paiements, setPaiements] = useState<PaiementsGlobalFournisseurAdmin | null>(null);
  const [referencePaiement, setReferencePaiement] = useState("");
  const [enCours, setEnCours] = useState(false);

  const [utilisateur, setUtilisateur] = useState<UtilisateurAdmin | null>(null);
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState({
    nom: "", prenom: "", email: "", telephone: "",
    nomEntreprise: "", adresseEntreprise: "", contactPro: "", nomGerant: "", telephoneGerant: "", horairesOuverture: "", zoneCouverte: "",
  });
  const [erreurEdition, setErreurEdition] = useState<string | null>(null);

  function charger() {
    if (!token) return;
    Promise.all([
      apiFetch<FournisseurDetailAdmin>(`/fournisseurs/${fournisseurId}`, { token }),
      apiFetch<StatistiquesFournisseurAdmin>(`/fournisseurs/${fournisseurId}/statistiques?periode=tout`, { token }),
      apiFetch<UtilisateurAdmin>(`/admin/utilisateurs/${fournisseurId}`, { token }),
    ]).then(([d, s, u]) => {
      setDetail(d);
      setVentes(s);
      setUtilisateur(u);
      setBrouillon({
        nom: u.nom, prenom: u.prenom ?? "", email: u.email ?? "", telephone: u.telephone ?? "",
        nomEntreprise: d.fournisseur.nom_entreprise, adresseEntreprise: d.fournisseur.adresse_entreprise ?? "",
        contactPro: d.fournisseur.contact_pro ?? "", nomGerant: d.fournisseur.nom_gerant ?? "",
        telephoneGerant: d.fournisseur.telephone_gerant ?? "", horairesOuverture: d.fournisseur.horaires_ouverture ?? "",
        zoneCouverte: d.fournisseur.zone_couverte ?? "",
      });
    });
  }

  useEffect(charger, [token, fournisseurId]);

  async function enregistrerIdentite() {
    if (!token) return;
    setErreurEdition(null);
    setEnCours(true);
    try {
      await apiFetch(`/admin/utilisateurs/${fournisseurId}`, {
        method: "PATCH",
        token,
        body: { nom: brouillon.nom, prenom: brouillon.prenom || null, email: brouillon.email, telephone: brouillon.telephone || null },
      });
      await apiFetch(`/fournisseurs/${fournisseurId}/profil`, {
        method: "PATCH",
        token,
        body: {
          nom_entreprise: brouillon.nomEntreprise,
          adresse_entreprise: brouillon.adresseEntreprise || null,
          contact_pro: brouillon.contactPro || null,
          nom_gerant: brouillon.nomGerant || null,
          telephone_gerant: brouillon.telephoneGerant || null,
          horaires_ouverture: brouillon.horairesOuverture || null,
          zone_couverte: brouillon.zoneCouverte || null,
        },
      });
      setEdition(false);
      charger();
    } catch (e) {
      setErreurEdition(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer ces modifications.");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerStatut() {
    if (!token || !utilisateur) return;
    const nouveauStatut = utilisateur.statut_compte === "actif" ? "desactive" : "actif";
    if (nouveauStatut === "desactive" && !confirm("Désactiver ce compte fournisseur ? Il ne pourra plus se connecter.")) return;

    setEnCours(true);
    try {
      await apiFetch(`/admin/utilisateurs/${fournisseurId}/statut`, { method: "PATCH", token, body: { statut_compte: nouveauStatut } });
      charger();
    } finally {
      setEnCours(false);
    }
  }

  useEffect(() => {
    if (!token || onglet !== "commandes" || commandes !== null) return;
    apiFetch<{ commandes: Pagination<CommandeFournisseur> }>(`/fournisseurs/${fournisseurId}/commandes?per_page=50`, { token }).then(
      (r) => setCommandes(r.commandes.data)
    );
  }, [token, onglet, commandes, fournisseurId]);

  useEffect(() => {
    if (!token || onglet !== "portefeuille" || portefeuille !== null) return;
    apiFetch<PortefeuilleFournisseurAdmin>(`/fournisseurs/${fournisseurId}/portefeuille?periode=tout`, { token }).then(setPortefeuille);
  }, [token, onglet, portefeuille, fournisseurId]);

  useEffect(() => {
    if (!token || onglet !== "paiements" || paiements !== null) return;
    apiFetch<PaiementsGlobalFournisseurAdmin>(`/fournisseurs/${fournisseurId}/paiements?periode=tout`, { token }).then(setPaiements);
  }, [token, onglet, paiements, fournisseurId]);

  async function payerTout() {
    if (!token || !referencePaiement.trim() || enCours) return;
    setEnCours(true);
    try {
      await apiFetch(`/fournisseurs/${fournisseurId}/portefeuille/payer-tout`, {
        method: "POST",
        token,
        body: { reference_paiement: referencePaiement.trim() },
      });
      setReferencePaiement("");
      setPortefeuille(null);
      apiFetch<PortefeuilleFournisseurAdmin>(`/fournisseurs/${fournisseurId}/portefeuille?periode=tout`, { token }).then(setPortefeuille);
    } finally {
      setEnCours(false);
    }
  }

  const fournisseur = detail?.fournisseur;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/fournisseurs" className="flex items-center gap-1 text-sm font-semibold text-brand-muted">
        <ChevronLeftIcon className="h-4 w-4" /> Retour aux fournisseurs
      </Link>

      <PageHero
        titre={fournisseur?.nom_entreprise ?? "Fournisseur"}
        description={fournisseur?.zone_couverte ?? undefined}
        icone={FournisseursIcon}
        stats={
          detail
            ? [
                { valeur: detail.statistiques.produits_total, label: "Produits" },
                { valeur: detail.statistiques.commandes_recues, label: "Commandes reçues" },
                { valeur: detail.statistiques.commandes_livrees, label: "Livrées" },
                { valeur: detail.statistiques.commandes_annulees, label: "Annulées" },
              ]
            : []
        }
      />

      {erreurEdition ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreurEdition}</p> : null}

      {fournisseur && utilisateur ? (
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
              {fournisseur.contact_pro ? (
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="h-4 w-4" /> {fournisseur.contact_pro}
                </span>
              ) : null}
              {fournisseur.user.email ? (
                <span className="flex items-center gap-1.5">
                  <MailIcon className="h-4 w-4" /> {fournisseur.user.email}
                </span>
              ) : null}
              {fournisseur.nom_gerant ? <span>Gérant : {fournisseur.nom_gerant}</span> : null}
              {fournisseur.adresse_entreprise ? <span>{fournisseur.adresse_entreprise}</span> : null}
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
                value={brouillon.nomEntreprise}
                onChange={(e) => setBrouillon((b) => ({ ...b, nomEntreprise: e.target.value }))}
                placeholder="Nom de l'entreprise"
                className={CHAMP}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={brouillon.contactPro}
                  onChange={(e) => setBrouillon((b) => ({ ...b, contactPro: e.target.value }))}
                  placeholder="Contact pro"
                  className={CHAMP}
                />
                <input
                  value={brouillon.zoneCouverte}
                  onChange={(e) => setBrouillon((b) => ({ ...b, zoneCouverte: e.target.value }))}
                  placeholder="Zone couverte"
                  className={CHAMP}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={brouillon.nomGerant}
                  onChange={(e) => setBrouillon((b) => ({ ...b, nomGerant: e.target.value }))}
                  placeholder="Nom du gérant"
                  className={CHAMP}
                />
                <input
                  value={brouillon.telephoneGerant}
                  onChange={(e) => setBrouillon((b) => ({ ...b, telephoneGerant: e.target.value }))}
                  placeholder="Téléphone du gérant"
                  className={CHAMP}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={brouillon.adresseEntreprise}
                  onChange={(e) => setBrouillon((b) => ({ ...b, adresseEntreprise: e.target.value }))}
                  placeholder="Adresse"
                  className={CHAMP}
                />
                <input
                  value={brouillon.horairesOuverture}
                  onChange={(e) => setBrouillon((b) => ({ ...b, horairesOuverture: e.target.value }))}
                  placeholder="Horaires d'ouverture"
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

      <div className="flex gap-2">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              onglet === o.id ? "bg-brand-ink text-white" : "border border-brand-line bg-white text-brand-muted"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "apercu" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{ventes ? `${formaterPrix(ventes.chiffre_affaires)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Chiffre d&apos;affaires</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{ventes ? `${formaterPrix(ventes.commission_ordispace)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Commission OrdiSpace</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{ventes?.produits_vendus ?? "—"}</p>
              <p className="text-xs text-brand-muted">Produits vendus</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{ventes?.produits_distincts_vendus ?? "—"}</p>
              <p className="text-xs text-brand-muted">Références distinctes</p>
            </div>
          </div>

          {ventes && ventes.produits_plus_vendus.length > 0 ? (
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="mb-3 text-sm font-bold text-brand-ink">Produits les plus vendus</p>
              <div className="flex flex-col gap-2">
                {ventes.produits_plus_vendus.map((p) => (
                  <div key={p.produit_id} className="flex items-center justify-between text-sm">
                    <span className="text-brand-ink">{p.nom_produit ?? `Produit #${p.produit_id}`}</span>
                    <span className="text-brand-muted">
                      {p.quantite_vendue} vendus · {formaterPrix(p.montant)} CFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {onglet === "commandes" ? (
        <div className="flex flex-col gap-2">
          {commandes === null ? (
            <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
          ) : commandes.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">Aucune commande.</p>
          ) : (
            commandes.map((c) => (
              <div key={c.commande_id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
                <div>
                  <p className="font-bold text-brand-ink">{c.nom_produit ?? `Commande #${c.commande_id}`}</p>
                  <p className="text-xs text-brand-muted">{c.nom_client}</p>
                </div>
                <span className="text-xs text-brand-muted">{c.statut}</span>
              </div>
            ))
          )}
        </div>
      ) : null}

      {onglet === "portefeuille" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{portefeuille ? `${formaterPrix(portefeuille.solde)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Solde</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">
                {portefeuille ? `${formaterPrix(portefeuille.total_en_attente)} CFA` : "—"}
              </p>
              <p className="text-xs text-brand-muted">En attente de paiement</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{portefeuille ? `${portefeuille.taux_commission}%` : "—"}</p>
              <p className="text-xs text-brand-muted">Taux de commission</p>
            </div>
          </div>

          {portefeuille && portefeuille.total_en_attente > 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4">
              <input
                value={referencePaiement}
                onChange={(e) => setReferencePaiement(e.target.value)}
                placeholder="Référence du paiement"
                className="flex-1 rounded-full border border-brand-line px-4 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={payerTout}
                disabled={!referencePaiement.trim() || enCours}
                className="rounded-full bg-brand-ink px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {enCours ? "Paiement…" : "Payer tout"}
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {portefeuille === null ? (
              <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
            ) : portefeuille.transactions.data.length === 0 ? (
              <p className="py-10 text-center text-sm text-brand-muted">Aucune transaction.</p>
            ) : (
              portefeuille.transactions.data.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
                  <div>
                    <p className="font-bold text-brand-ink">{t.nom_produit ?? "Vente"}</p>
                    <p className="text-xs text-brand-muted">{formaterDate(t.date_transaction)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand-ink">{formaterPrix(t.montant)} CFA</p>
                    <p className={`text-xs ${t.statut === "paye" ? "text-green-600" : "text-orange-600"}`}>
                      {t.statut === "paye" ? "Payé" : "En attente"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {onglet === "paiements" ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-brand-muted">
            Vue fusionnée, tous produits confondus : les achats externes déclarés par le fournisseur (commission qu&apos;il doit à
            Ordi&apos;Space) et les crédits de portefeuille (ventes in-app qu&apos;Ordi&apos;Space lui doit) — identique à ce que le
            fournisseur voit dans son propre onglet « Paiement ».
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{paiements ? `${formaterPrix(paiements.total_a_payer)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">À payer (achats externes)</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{paiements ? `${formaterPrix(paiements.total_a_recevoir)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">À recevoir (ventes in-app)</p>
            </div>
            <div className="rounded-2xl border border-brand-line bg-white p-4">
              <p className="text-xl font-extrabold text-brand-ink">{paiements ? `${formaterPrix(paiements.total_paye)} CFA` : "—"}</p>
              <p className="text-xs text-brand-muted">Déjà payé (les deux flux)</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {paiements === null ? (
              <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
            ) : paiements.items.length === 0 ? (
              <p className="py-10 text-center text-sm text-brand-muted">Aucun paiement.</p>
            ) : (
              paiements.items.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-ink">{item.nom_produit ?? (item.type === "achat_externe" ? `Achat #${item.id}` : `Vente #${item.id}`)}</p>
                      <span className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
                        {LIBELLE_TYPE_PAIEMENT[item.type]}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted">{formaterDateHeure(item.date_heure)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand-ink">{formaterPrix(item.montant)} CFA</p>
                    <p className={`text-xs ${item.statut === "paye" ? "text-green-600" : "text-orange-600"}`}>
                      {item.statut === "paye" ? "Payé" : "En attente"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
