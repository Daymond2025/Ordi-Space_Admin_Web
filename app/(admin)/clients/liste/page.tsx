"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiFetchAvecMeta, ApiRequestError } from "@/lib/api";
import {
  clientDepuisLibelle,
  formaterPrix,
  LIBELLE_SEGMENT_CLIENT,
  STYLE_SEGMENT_CLIENT,
  type ClientAdmin,
  type Pagination,
  type StatsClients,
  type StatutCompte,
} from "@/lib/types";
import {
  ChevronLeftIcon,
  ClientsIcon,
  DownloadIcon,
  PhoneIcon,
  PlusIcon,
  SettingsIcon,
  UserAvatarIcon,
  UserPlusIcon,
  XIcon,
} from "@/components/icons";
import { Listbox } from "@/components/Listbox";

const COULEUR_EN_LIGNE = "rgb(54,206,0)";

const OPTIONS_STATUT = [
  { value: "", label: "Tous les statuts" },
  { value: "actif", label: "Actif" },
  { value: "suspendu", label: "Suspendu" },
  { value: "desactive", label: "Désactivé" },
];

const OPTIONS_TRI = [
  { value: "recent", label: "Plus récents" },
  { value: "ancien", label: "Plus anciens" },
  { value: "depense", label: "Dépenses les plus hautes" },
];

function StatCarte({
  label,
  sousLabel,
  valeur,
  icone: Icone,
  couleurIcone,
  pointClignotant,
}: {
  label: string;
  sousLabel: string;
  valeur: number | string;
  icone?: typeof UserAvatarIcon;
  couleurIcone?: string;
  pointClignotant?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-none">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-ink">{label}</p>
          <p className="text-[11px] text-brand-muted">{sousLabel}</p>
        </div>
        {pointClignotant ? (
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            <span className="absolute h-3.5 w-3.5 animate-ping rounded-full" style={{ backgroundColor: COULEUR_EN_LIGNE }} />
            <span className="relative h-3.5 w-3.5 rounded-full" style={{ backgroundColor: COULEUR_EN_LIGNE }} />
          </span>
        ) : Icone ? (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${couleurIcone}`}>
            <Icone className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-extrabold text-brand-ink">{valeur}</p>
    </div>
  );
}

function ChampFormulaire({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-11 rounded-xl border border-brand-line px-3 text-sm outline-none focus:border-[color:var(--brand-blue-end)]"
    />
  );
}

/**
 * Le Client s'authentifie désormais par téléphone (WhatsApp + OTP) — plus
 * d'e-mail/mot de passe (voir Api\Auth\TelephoneAuthController côté
 * backend). Cette modale ne fait donc que créer l'identité minimale
 * (nom + téléphone) via /clients/creation-rapide, exactement comme un
 * commercial enregistrant une vente pour un nouveau client — l'admin est
 * ensuite redirigé vers la fiche du client pour y enregistrer son achat.
 */
function ModaleNouveauClient({ token, onClose, onCree }: { token: string; onClose: () => void; onCree: (clientId: number) => void }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creer() {
    setErreur(null);
    setEnCours(true);
    try {
      const client = await apiFetch<{ id: number }>("/clients/creation-rapide", {
        method: "POST",
        token,
        body: { nom, prenom: prenom || null, telephone },
      });
      onCree(client.id);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de créer ce client.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-ink">Nouveau client</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-xs text-brand-muted">
          Le client active son espace lui-même via son numéro WhatsApp (code de vérification) — aucun mot de passe à définir ici.
        </p>

        {erreur ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{erreur}</p> : null}

        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <ChampFormulaire value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
            <ChampFormulaire value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom (optionnel)" />
          </div>
          <ChampFormulaire value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Numéro WhatsApp (ex: 07 79 36 38 09)" />
        </div>

        <button
          type="button"
          onClick={creer}
          disabled={enCours || !nom.trim() || !telephone.trim()}
          className="bg-gradient-brand-blue mt-5 flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white disabled:opacity-50"
        >
          {enCours ? "Création…" : "Créer le client"}
        </button>
      </div>
    </div>
  );
}

function PanneauParametres({ onClose }: { onClose: () => void }) {
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [onClose]);

  return (
    <div ref={conteneurRef} className="absolute right-0 top-[calc(100%+8px)] z-30 w-80 rounded-2xl border border-brand-line bg-white p-4 shadow-xl">
      <p className="text-sm font-bold text-brand-ink">Paramètres clients</p>
      <p className="mt-1 text-xs text-brand-muted">Segmentation automatique selon le nombre de commandes valides (hors annulées).</p>

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2">
          <span className="text-xs font-semibold text-[color:var(--brand-blue-end)]">{LIBELLE_SEGMENT_CLIENT.nouveau}</span>
          <span className="text-xs text-brand-muted">1 à 2 commandes</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2">
          <span className="text-xs font-semibold text-orange-600">{LIBELLE_SEGMENT_CLIENT.gros_acheteur}</span>
          <span className="text-xs text-brand-muted">3 à 5 commandes</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-violet-50 px-3 py-2">
          <span className="text-xs font-semibold text-violet-600">{LIBELLE_SEGMENT_CLIENT.vip}</span>
          <span className="text-xs text-brand-muted">6 commandes et plus</span>
        </div>
      </div>

      <p className="mt-3 border-t border-brand-line pt-3 text-[11px] text-brand-muted">
        Le badge « En ligne » s&apos;affiche si le client s&apos;est connecté il y a moins de 15 minutes.
      </p>
    </div>
  );
}

export default function ListeClientsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<ClientAdmin[] | null>(null);
  const [pagination, setPagination] = useState<Pick<Pagination<ClientAdmin>, "current_page" | "last_page" | "total"> | null>(null);
  const [stats, setStats] = useState<StatsClients | null>(null);

  const [rechercheSaisie, setRechercheSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("");
  const [tri, setTri] = useState("recent");
  const [page, setPage] = useState(1);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modaleNouveauClientOuverte, setModaleNouveauClientOuverte] = useState(false);
  const [parametresOuverts, setParametresOuverts] = useState(false);

  // Débounce de la recherche pour ne pas requêter à chaque frappe.
  useEffect(() => {
    const id = setTimeout(() => {
      setRecherche(rechercheSaisie);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [rechercheSaisie]);

  function rechargerClients() {
    if (!token) return;
    const params = new URLSearchParams({ per_page: "10", page: String(page), tri });
    if (recherche) params.set("recherche", recherche);
    if (statut) params.set("statut_compte", statut);

    apiFetchAvecMeta<Pagination<ClientAdmin>, { stats: StatsClients }>(`/admin/clients?${params}`, { token }).then(({ data, meta }) => {
      setClients(data.data);
      setPagination({ current_page: data.current_page, last_page: data.last_page, total: data.total });
      setStats(meta.stats);
    });
  }

  useEffect(rechargerClients, [token, recherche, statut, tri, page]);

  async function exporter() {
    if (!token) return;
    setErreur(null);
    setExportEnCours(true);

    try {
      const params = new URLSearchParams({ per_page: "100", tri });
      if (recherche) params.set("recherche", recherche);
      if (statut) params.set("statut_compte", statut);

      const { data } = await apiFetchAvecMeta<Pagination<ClientAdmin>>(`/admin/clients?${params}`, { token });

      const entetes = ["Nom", "Prénom", "Email", "Téléphone", "Statut", "Segment", "Commandes", "Produits achetés", "Total dépensé (CFA)", "Interventions", "Client depuis"];
      const lignes = data.data.map((c) => [
        c.nom,
        c.prenom ?? "",
        c.email ?? "",
        c.telephone ?? "",
        c.statut_compte,
        c.segment ? LIBELLE_SEGMENT_CLIENT[c.segment] : "",
        String(c.nombre_commandes),
        String(c.produits_achetes),
        String(c.total_depense),
        String(c.nombre_interventions),
        clientDepuisLibelle(c.date_inscription),
      ]);
      const csv = [entetes, ...lignes].map((ligne) => ligne.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");

      const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `clients-ordispace-${new Date().toISOString().slice(0, 10)}.csv`;
      lien.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'exporter la liste.");
    } finally {
      setExportEnCours(false);
    }
  }

  return (
    <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-ink">Les utilisateurs (clients)</h1>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModaleNouveauClientOuverte(true)}
            className="flex h-10 items-center gap-1.5 rounded-full border border-[color:var(--brand-blue-end)]/40 px-4 text-sm font-semibold text-[color:var(--brand-blue-end)]"
          >
            <PlusIcon className="h-4 w-4" />
            New Client
          </button>
          <button
            type="button"
            onClick={exporter}
            disabled={exportEnCours || !clients?.length}
            className="flex h-10 items-center gap-1.5 rounded-full border border-brand-line px-4 text-sm font-semibold text-brand-ink disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4" />
            {exportEnCours ? "Export…" : "Exporter"}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setParametresOuverts((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-line text-brand-muted"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
            {parametresOuverts ? <PanneauParametres onClose={() => setParametresOuverts(false)} /> : null}
          </div>
        </div>
      </div>

      {modaleNouveauClientOuverte && token ? (
        <ModaleNouveauClient
          token={token}
          onClose={() => setModaleNouveauClientOuverte(false)}
          onCree={(clientId) => {
            setModaleNouveauClientOuverte(false);
            // Direction la fiche du nouveau client : c'est là que l'admin
            // enregistre son premier achat (bouton déjà existant), ce qui
            // active garantie/avantages — inchangé. Le panneau s'ouvre
            // directement pour enchaîner sans clic supplémentaire.
            router.push(`/clients/consultation/${clientId}?ouvrir_achat=1`);
          }}
        />
      ) : null}

      {erreur ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      <div className="mt-5 grid grid-cols-4 gap-4">
        <StatCarte label="Total user" sousLabel="Depuis le début" valeur={stats?.total ?? "—"} icone={ClientsIcon} couleurIcone="bg-blue-50 text-[color:var(--brand-blue-end)]" />
        <StatCarte label="Nouveau user" sousLabel="Cette semaine" valeur={stats?.nouveaux_semaine ?? "—"} icone={UserPlusIcon} couleurIcone="bg-blue-50 text-[color:var(--brand-blue-end)]" />
        <StatCarte label="Total reçu" sousLabel="Clients enregistrés" valeur={stats?.total ?? "—"} icone={ClientsIcon} couleurIcone="bg-orange-50 text-orange-500" />
        <StatCarte label="User en ligne" sousLabel="En ce moment" valeur={stats?.en_ligne ?? "—"} pointClignotant />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <p className="text-sm font-bold text-brand-ink">Liste des utilisateurs</p>
        <div className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-3">
          <input
            value={rechercheSaisie}
            onChange={(e) => setRechercheSaisie(e.target.value)}
            placeholder="Rechercher un client…"
            className="h-10 w-64 rounded-full border border-brand-line px-4 text-sm outline-none focus:border-[color:var(--brand-blue-end)]"
          />
          <Listbox value={statut} onChange={(v) => { setStatut(v); setPage(1); }} options={OPTIONS_STATUT} wrapperClassName="w-44" />
          <Listbox value={tri} onChange={(v) => { setTri(v); setPage(1); }} options={OPTIONS_TRI} wrapperClassName="w-52" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {clients === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : clients.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucun client ne correspond à cette recherche.</p>
        ) : (
          clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/consultation/${client.id}`}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-line bg-white p-4 shadow-none transition-colors hover:border-[color:var(--brand-blue-end)]/40"
            >
              <div className="relative shrink-0">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
                  <UserAvatarIcon className="h-6 w-6" />
                </span>
                {client.en_ligne ? (
                  <span
                    className="absolute left-1/2 top-full flex h-[13px] w-[38px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[6.5px] border-2 border-white text-[6px] font-semibold leading-none text-white"
                    style={{ backgroundColor: COULEUR_EN_LIGNE }}
                  >
                    En ligne
                  </span>
                ) : null}
              </div>

              <div className="min-w-[160px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-brand-ink">
                    {client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
                  </p>
                  {client.segment ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STYLE_SEGMENT_CLIENT[client.segment]}`}>
                      {LIBELLE_SEGMENT_CLIENT[client.segment]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-muted">
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {client.telephone ?? "—"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                  <p className="text-sm font-extrabold text-emerald-600">{client.produits_achetes}</p>
                  <p className="text-[10px] font-medium text-emerald-600">Produits Achetés</p>
                </div>
                <div className="rounded-xl bg-rose-50 px-3 py-2 text-center">
                  <p className="text-sm font-extrabold text-rose-500">{client.nombre_interventions}</p>
                  <p className="text-[10px] font-medium text-rose-500">Intervention</p>
                </div>
                <div className="rounded-xl bg-orange-50 px-3 py-2 text-center">
                  <p className="text-sm font-extrabold text-orange-500">{formaterPrix(client.total_depense)} FCFA</p>
                  <p className="text-[10px] font-medium text-orange-500">Total Dépensé</p>
                </div>
                <div className="rounded-xl bg-[#EEF1F6] px-3 py-2 text-center">
                  <p className="text-sm font-extrabold text-brand-ink">Client depuis</p>
                  <p className="text-[10px] font-medium text-brand-muted">{clientDepuisLibelle(client.date_inscription)}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {pagination && pagination.last_page > 1 ? (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-brand-muted">
            Page {pagination.current_page} sur {pagination.last_page} — {pagination.total} clients
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-line text-brand-muted disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
              disabled={pagination.current_page >= pagination.last_page}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-line text-brand-muted disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
