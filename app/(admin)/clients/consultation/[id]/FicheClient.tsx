"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import {
  clientDepuisLibelle,
  dureeRestanteLibelle,
  formaterDate,
  formaterDateHeure,
  formaterPrix,
  LIBELLE_SEGMENT_CLIENT,
  LIBELLE_STATUT_COMMANDE,
  LIBELLE_STATUT_COMPTE,
  LIBELLE_STATUT_DEMANDE_SAV,
  LIBELLE_STATUT_INTERVENTION,
  LIBELLE_TYPE_PRIVILEGE,
  LIBELLE_TYPE_TUTORIEL,
  STYLE_SEGMENT_CLIENT,
  STYLE_STATUT_COMMANDE,
  STYLE_STATUT_COMPTE,
  STYLE_STATUT_DEMANDE_SAV,
  type FicheClient as FicheClientType,
} from "@/lib/types";
import {
  BagIcon,
  BellIcon,
  CalendarIcon,
  CashIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  GraduationCapIcon,
  HomeIcon,
  ImagePlaceholderIcon,
  MailIcon,
  MaintenanceServiceIcon,
  PhoneIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserAvatarIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/icons";

const ONGLETS = ["Activités", "Commandes", "Panier", "Maintenance", "Privilèges", "Garanties", "Formation", "Profil"] as const;
type Onglet = (typeof ONGLETS)[number];

const CATEGORIES_ACTIVITE: OptionFiltre[] = [
  { value: "Tout", label: "Tout" },
  { value: "Boutique", label: "Boutique" },
  { value: "GarantiX", label: "GarantiX" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Privilèges", label: "Privilèges" },
  { value: "Formation", label: "Formation" },
  { value: "Autre", label: "Autre" },
];

const STATUTS_COMMANDE_FILTRE: OptionFiltre[] = [
  { value: "Tout", label: "Tous les statuts" },
  { value: "en_attente", label: "En attente" },
  { value: "validee", label: "Validée" },
  { value: "en_preparation", label: "En préparation" },
  { value: "en_livraison", label: "En livraison" },
  { value: "livree", label: "Livrée" },
  { value: "annulee", label: "Annulée" },
];

const GARANTIE_COMMANDE_FILTRE: OptionFiltre[] = [
  { value: "Tout", label: "Tout" },
  { value: "sous_garantie", label: "Sous garantie" },
  { value: "sans_garantie", label: "Sans garantie" },
];

const BADGE_CATEGORIE_ACTIVITE: Record<string, string> = {
  Boutique: "bg-emerald-500 text-white",
  GarantiX: "bg-[color:var(--brand-blue-end)] text-white",
  Maintenance: "bg-orange-500 text-white",
  Privilèges: "bg-rose-500 text-white",
  Formation: "bg-violet-500 text-white",
  Autre: "bg-brand-muted text-white",
};

function StatCarte({ label, valeur, icone: Icone, couleur }: { label: string; valeur: string; icone: typeof UserAvatarIcon; couleur: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-brand-line bg-white p-4 shadow-none">
      <div className="flex items-center justify-between">
        <p className="text-xs text-brand-muted">{label}</p>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${couleur}`}>
          <Icone className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="text-lg font-extrabold text-brand-ink">{valeur}</p>
    </div>
  );
}

function normaliserTelephone(telephone: string): string {
  return telephone.replace(/[^\d]/g, "");
}

type OptionFiltre = { value: string; label: string };

function FiltrePill({
  value,
  options,
  onChange,
  widthClass = "w-44",
}: {
  value: string;
  options: readonly OptionFiltre[];
  onChange: (v: string) => void;
  widthClass?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const libelleActuel = options.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [ouvert]);

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-line bg-white px-4 text-xs font-semibold text-brand-ink"
      >
        {libelleActuel}
        <ChevronDownIcon className={`h-3.5 w-3.5 text-brand-muted transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>
      {ouvert ? (
        <div className={`absolute right-0 top-[calc(100%+6px)] z-30 ${widthClass} overflow-hidden rounded-2xl border border-brand-line bg-white p-1.5 shadow-xl`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOuvert(false);
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm ${
                option.value === value ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "text-brand-ink hover:bg-[#F5F7FA]"
              }`}
            >
              {option.label}
              {option.value === value ? <CheckIcon className="h-4 w-4 shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FicheClient({ id }: { id: string }) {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const ongletInitial = ONGLETS.find((o) => o === searchParams.get("onglet")) ?? "Activités";
  const [fiche, setFiche] = useState<FicheClientType | null | undefined>(undefined);
  const [onglet, setOnglet] = useState<Onglet>(ongletInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtreActivite, setFiltreActivite] = useState<string>("Tout");

  const [notifOuverte, setNotifOuverte] = useState(false);
  const [contenuNotif, setContenuNotif] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [notifEnvoyee, setNotifEnvoyee] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<FicheClientType>(`/admin/clients/${id}`, { token })
      .then(setFiche)
      .catch(() => setFiche(null));
  }, [token, id]);

  async function envoyerNotification() {
    if (!token || !contenuNotif.trim()) return;
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      await apiFetch(`/admin/clients/${id}/notifier`, { method: "POST", token, body: { contenu: contenuNotif.trim() } });
      setContenuNotif("");
      setNotifOuverte(false);
      setNotifEnvoyee(true);
      setTimeout(() => setNotifEnvoyee(false), 2500);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'envoyer la notification.");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  function copierLien() {
    navigator.clipboard?.writeText(window.location.href);
  }

  if (fiche === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (fiche === null) return <p className="text-sm text-brand-muted">Ce client est introuvable.</p>;

  const { profil, stats, badges } = fiche;
  const nomComplet = profil.user.prenom ? `${profil.user.prenom} ${profil.user.nom}` : profil.user.nom;
  const telephone = profil.user.telephone;

  return (
    <div className="relative flex flex-col gap-5">
      <div className="rounded-3xl bg-[#EEF4FF] p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link href="/clients/liste" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
              <ChevronLeftIcon className="h-5 w-5" />
            </Link>

            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-brand-muted">
              <UserAvatarIcon className="h-7 w-7" />
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-brand-ink">{nomComplet}</h1>
                {badges.garantie_active ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">Garantie Active</span>
                ) : null}
                {badges.segment ? (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLE_SEGMENT_CLIENT[badges.segment]}`}>
                    {LIBELLE_SEGMENT_CLIENT[badges.segment]}
                  </span>
                ) : null}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-brand-muted">
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5" />
                  {telephone ?? "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Client depuis {clientDepuisLibelle(profil.date_inscription)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex w-full items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-brand-muted">Contact</span>
              <span className="h-px flex-1 bg-brand-line" />
              <SettingsIcon className="h-4 w-4 shrink-0 text-brand-muted" />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNotifOuverte((v) => !v)}
                style={{ background: "linear-gradient(289.44deg, #FFA200 7.05%, #FF3801 92.85%)" }}
                className="flex h-[33px] w-[124px] items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-white"
              >
                <BellIcon className="h-3.5 w-3.5" />
                Notification
              </button>
              <a
                href={telephone ? `https://wa.me/${normaliserTelephone(telephone)}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!telephone}
                style={{ background: "linear-gradient(93.35deg, #36CE00 0%, #00D8A4 118.39%)" }}
                className={`flex h-[33px] w-[124px] items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-white ${!telephone ? "pointer-events-none opacity-40" : ""}`}
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                WhatsApp
              </a>
              <a
                href={telephone ? `tel:${telephone}` : undefined}
                aria-disabled={!telephone}
                style={{ background: "linear-gradient(270deg, #00BFFF 0%, #0077FF 100%)" }}
                className={`flex h-[33px] w-[124px] items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-white ${!telephone ? "pointer-events-none opacity-40" : ""}`}
              >
                <PhoneIcon className="h-3.5 w-3.5" />
                Appelle
              </a>
            </div>

            {notifOuverte ? (
              <div className="mt-1 w-72 rounded-2xl border border-brand-line bg-white p-3 shadow-lg">
                <textarea
                  value={contenuNotif}
                  onChange={(e) => setContenuNotif(e.target.value)}
                  placeholder="Message à envoyer au client…"
                  rows={3}
                  className="w-full rounded-xl border border-brand-line px-2.5 py-2 text-xs outline-none focus:border-[color:var(--brand-blue-end)]"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setNotifOuverte(false)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand-muted">
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={envoyerNotification}
                    disabled={envoiEnCours || !contenuNotif.trim()}
                    className="rounded-full bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {envoiEnCours ? "Envoi…" : "Envoyer"}
                  </button>
                </div>
              </div>
            ) : null}
            {notifEnvoyee ? <p className="text-[11px] font-medium text-emerald-600">Notification envoyée ✓</p> : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-3">
          <StatCarte label="Total Dépensé" valeur={`${formaterPrix(stats.total_depense)} FCFA`} icone={CashIcon} couleur="bg-orange-50 text-orange-500" />
          <StatCarte label="Commandes" valeur={String(stats.commandes)} icone={BagIcon} couleur="bg-blue-50 text-[color:var(--brand-blue-end)]" />
          <StatCarte label="Produits Achetés" valeur={String(stats.produits_achetes)} icone={BagIcon} couleur="bg-emerald-50 text-emerald-500" />
          <StatCarte label="Garanties Actives" valeur={String(stats.garanties_actives)} icone={ShieldCheckIcon} couleur="bg-emerald-50 text-emerald-500" />
          <StatCarte label="Interventions" valeur={String(stats.interventions)} icone={MaintenanceServiceIcon} couleur="bg-rose-50 text-rose-500" />
        </div>
      </div>

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
        <div className="flex gap-2 overflow-x-auto pb-4">
          {ONGLETS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOnglet(o)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                onglet === o ? "bg-gradient-brand-blue text-white" : "bg-[#EEF1F6] text-brand-muted"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        <div className="border-t border-brand-line pt-5">
          {onglet === "Activités" ? <OngletActivites fiche={fiche} filtre={filtreActivite} onFiltreChange={setFiltreActivite} /> : null}
          {onglet === "Commandes" ? <OngletCommandes fiche={fiche} /> : null}
          {onglet === "Panier" ? <OngletPanier fiche={fiche} /> : null}
          {onglet === "Maintenance" ? <OngletMaintenance fiche={fiche} /> : null}
          {onglet === "Privilèges" ? <OngletPrivileges fiche={fiche} /> : null}
          {onglet === "Garanties" ? <OngletGaranties fiche={fiche} /> : null}
          {onglet === "Formation" ? <OngletFormation fiche={fiche} /> : null}
          {onglet === "Profil" ? <OngletProfil fiche={fiche} /> : null}
        </div>
      </div>

      <button
        type="button"
        onClick={copierLien}
        title="Copier le lien de cette fiche"
        className="fixed bottom-8 right-8 flex h-12 w-12 items-center justify-center rounded-full bg-brand-ink text-white shadow-lg"
      >
        <ExternalLinkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function VideEtat({ message }: { message: string }) {
  return <p className="py-10 text-center text-sm text-brand-muted">{message}</p>;
}

function BientotDisponible({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <XIcon className="h-5 w-5 text-brand-muted" />
      <p className="text-sm text-brand-muted">{message}</p>
    </div>
  );
}

function OngletActivites({
  fiche,
  filtre = "Tout",
  onFiltreChange,
}: {
  fiche: FicheClientType;
  filtre?: string;
  onFiltreChange: (v: string) => void;
}) {
  const activites = filtre === "Tout" ? fiche.activites : fiche.activites.filter((a) => a.categorie === filtre);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-brand-ink">Fil d&apos;activités</p>
        <div className="flex items-center gap-2">
          <FiltrePill value={filtre} options={CATEGORIES_ACTIVITE} onChange={onFiltreChange} />
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
            <SettingsIcon className="h-4 w-4" />
          </span>
        </div>
      </div>

      {fiche.activites.length === 0 ? (
        <VideEtat message="Aucune activité enregistrée pour l'instant — le suivi couvre les actions réalisées depuis la mise en service du journal (commandes, GarantiX, pannes, codes promo, formations)." />
      ) : activites.length === 0 ? (
        <VideEtat message={`Aucune activité dans la catégorie « ${filtre} ».`} />
      ) : (
      <div className="flex flex-col gap-3">
      {activites.map((activite, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6]">
            {activite.categorie === "Boutique" ? (
              <Image src="/images/icon-panier.png" alt="" width={20} height={20} />
            ) : activite.categorie === "GarantiX" ? (
              <ShieldCheckIcon className="h-5 w-5 text-[color:var(--brand-blue-end)]" />
            ) : activite.categorie === "Maintenance" ? (
              <MaintenanceServiceIcon className="h-5 w-5 text-orange-500" />
            ) : (
              <BagIcon className="h-5 w-5 text-brand-muted" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${BADGE_CATEGORIE_ACTIVITE[activite.categorie] ?? "bg-brand-muted text-white"}`}>
              {activite.categorie}
            </span>
            <p className="mt-1 text-sm text-brand-ink">{activite.description}</p>
          </div>
          <p className="shrink-0 text-right text-xs text-brand-muted">{formaterDateHeure(activite.date)}</p>
        </div>
      ))}
      </div>
      )}
    </div>
  );
}

function OngletCommandes({ fiche }: { fiche: FicheClientType }) {
  const [filtreStatut, setFiltreStatut] = useState("Tout");
  const [filtreGarantie, setFiltreGarantie] = useState("Tout");

  const lignes = fiche.commandes.flatMap((commande) => commande.lignes.map((ligne) => ({ commande, ligne })));

  const lignesFiltrees = lignes.filter(({ commande, ligne }) => {
    if (filtreStatut !== "Tout" && commande.statut_commande !== filtreStatut) return false;
    if (filtreGarantie === "sous_garantie" && (!ligne.garantie || !dureeRestanteLibelle(ligne.garantie.date_fin))) return false;
    if (filtreGarantie === "sans_garantie" && ligne.garantie && dureeRestanteLibelle(ligne.garantie.date_fin)) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-brand-ink">Liste des commandes</p>
        <div className="flex items-center gap-2">
          <FiltrePill value={filtreStatut} options={STATUTS_COMMANDE_FILTRE} onChange={setFiltreStatut} widthClass="w-52" />
          <FiltrePill value={filtreGarantie} options={GARANTIE_COMMANDE_FILTRE} onChange={setFiltreGarantie} />
        </div>
      </div>

      {fiche.commandes.length === 0 ? (
        <VideEtat message="Aucune commande pour ce client." />
      ) : lignesFiltrees.length === 0 ? (
        <VideEtat message="Aucune commande ne correspond à ces filtres." />
      ) : (
        <div className="flex flex-col gap-3">
          {lignesFiltrees.map(({ commande, ligne }) => {
            const dureeRestante = ligne.garantie ? dureeRestanteLibelle(ligne.garantie.date_fin) : null;

            return (
              <Link
                key={ligne.id}
                href={`/clients/commandes/${commande.id}`}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-line bg-white p-4 transition-colors hover:border-[color:var(--brand-blue-end)]/40"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
                  {ligne.produit.images[0] ? (
                    <Image src={ligne.produit.images[0].url_image} alt="" fill className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-brand-muted">
                      <ImagePlaceholderIcon className="h-6 w-6" />
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm font-bold text-brand-ink">{ligne.produit.nom_produit}</p>
                  <p className="mt-0.5 text-xs text-brand-muted">Quantité : {ligne.quantite}</p>
                </div>

                <div className="shrink-0">
                  <p className="mb-1 text-[11px] text-brand-muted">Prix d&apos;achat</p>
                  <span className="inline-block rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600">
                    {formaterPrix(ligne.prix_unitaire)} CFA
                  </span>
                </div>

                <div className="shrink-0">
                  <p className="mb-1 text-[11px] text-brand-muted">Date</p>
                  <p className="text-xs font-semibold text-brand-ink">{formaterDate(commande.date_commande)}</p>
                </div>

                <div className="shrink-0">
                  <p className="mb-1 text-[11px] text-brand-muted">Statut</p>
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLE_STATUT_COMMANDE[commande.statut_commande]}`}>
                    {LIBELLE_STATUT_COMMANDE[commande.statut_commande]}
                  </span>
                </div>

                <div className="shrink-0">
                  <p className="mb-1 text-[11px] text-brand-muted">Garantie</p>
                  {dureeRestante ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheckIcon className="h-3 w-3" />
                      {dureeRestante}
                    </span>
                  ) : (
                    <span className="text-xs text-brand-muted">—</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OngletPanier({ fiche }: { fiche: FicheClientType }) {
  const lignes = fiche.profil.panier?.lignes ?? [];

  if (lignes.length === 0) {
    return <VideEtat message="Le panier de ce client est vide pour le moment." />;
  }

  const total = lignes.reduce((somme, l) => somme + parseFloat(l.produit.prix) * l.quantite, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {lignes.map((ligne) => (
          <div key={ligne.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-line bg-white p-4">
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
              {ligne.produit.images[0] ? (
                <Image src={ligne.produit.images[0].url_image} alt="" fill className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-brand-muted">
                  <ImagePlaceholderIcon className="h-6 w-6" />
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-orange-500">
                <BagIcon className="h-3 w-3 text-white" />
              </span>
            </span>

            <div className="min-w-0 flex-1 basis-40">
              <p className="truncate text-sm font-bold text-brand-ink">{ligne.produit.nom_produit}</p>
              <p className="mt-0.5 text-xs text-brand-muted">Quantité : {ligne.quantite}</p>
            </div>

            <div className="shrink-0">
              <p className="mb-1 text-[11px] text-brand-muted">Prix d&apos;achat</p>
              <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[color:var(--brand-blue-end)]">
                {formaterPrix(parseFloat(ligne.produit.prix) * ligne.quantite)} CFA
              </span>
            </div>

            <div className="shrink-0">
              <p className="mb-1 text-[11px] text-brand-muted">Ajouté le</p>
              <span className="inline-block rounded-lg bg-[#EEF1F6] px-2.5 py-1 text-xs font-semibold text-brand-ink">
                {formaterDateHeure(ligne.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-brand-line bg-white p-4">
        <span className="text-sm font-bold text-brand-ink">Total</span>
        <span className="text-sm font-bold text-brand-ink">{formaterPrix(total)} CFA</span>
      </div>
    </div>
  );
}

function OngletMaintenance({ fiche }: { fiche: FicheClientType }) {
  const demandes = fiche.maintenance.demandes;
  if (demandes.length === 0) return <VideEtat message="Aucune déclaration de panne ni maintenance pour ce client." />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold text-brand-ink">Historique de maintenance ({demandes.length})</p>

      <div className="flex flex-col gap-3">
        {demandes.map((demande) => (
          <div key={demande.id} className="rounded-2xl border border-brand-line bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <MaintenanceServiceIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-brand-ink">{demande.description_probleme}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLE_STATUT_DEMANDE_SAV[demande.statut_demande]}`}>
                    {LIBELLE_STATUT_DEMANDE_SAV[demande.statut_demande]}
                  </span>
                </div>
                {demande.garantie?.ligne_commande?.produit ? (
                  <p className="mt-0.5 text-xs text-brand-muted">Appareil : {demande.garantie.ligne_commande.produit.nom_produit}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-brand-muted">{formaterDateHeure(demande.date_demande)}</p>
              </div>
            </div>

            {demande.rendez_vous.map((rdv) => (
              <div key={rdv.id} className="ml-14 mt-3 rounded-xl bg-[#EEF1F6] p-3 text-xs text-brand-ink">
                <p>
                  Rendez-vous : {formaterDateHeure(rdv.date_rdv)}
                  {rdv.lieu ? ` — ${rdv.lieu}` : ""}
                </p>
                <p className="mt-1 text-brand-muted">
                  Technicien : {rdv.technicien ? `${rdv.technicien.user.prenom ?? ""} ${rdv.technicien.user.nom}` : "Non assigné"}
                </p>
                {rdv.intervention ? (
                  <p className="mt-1 text-brand-muted">Intervention : {LIBELLE_STATUT_INTERVENTION[rdv.intervention.statut_intervention]}</p>
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OngletPrivileges({ fiche }: { fiche: FicheClientType }) {
  const utilisations = fiche.privileges.utilisations;
  if (utilisations.length === 0) return <VideEtat message="Ce client n'a utilisé aucun privilège pour le moment." />;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold text-brand-ink">Privilèges utilisés ({utilisations.length})</p>

      <div className="flex flex-col gap-3">
        {utilisations.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <TicketIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brand-ink">{u.privilege.titre}</p>
              <p className="mt-0.5 text-xs text-brand-muted">
                {LIBELLE_TYPE_PRIVILEGE[u.privilege.type_privilege]} — {formaterDateHeure(u.date_utilisation)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-emerald-600">-{formaterPrix(u.montant_remise)} CFA</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageProduitMini({ images }: { images?: { url_image: string }[] }) {
  return (
    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
      {images?.[0] ? (
        <Image src={images[0].url_image} alt="" fill className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-brand-muted">
          <ImagePlaceholderIcon className="h-5 w-5" />
        </span>
      )}
    </span>
  );
}

function OngletGaranties({ fiche }: { fiche: FicheClientType }) {
  const { garanties, abonnements_garantix } = fiche.garanties;
  if (garanties.length === 0 && abonnements_garantix.length === 0) {
    return <VideEtat message="Aucune garantie ni abonnement GarantiX pour ce client." />;
  }

  return (
    <div className="flex flex-col gap-5">
      {garanties.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-bold text-brand-ink">Garantie de base ({garanties.length})</p>
          <div className="flex flex-col gap-3">
            {garanties.map((g) => {
              const dureeRestante = dureeRestanteLibelle(g.date_fin);

              return (
                <div key={g.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-line bg-white p-4">
                  {g.ligne_commande ? <ImageProduitMini images={g.ligne_commande.produit.images} /> : null}
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-bold text-brand-ink">{g.ligne_commande?.produit.nom_produit ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-brand-muted">
                      Du {formaterDate(g.date_debut)} au {formaterDate(g.date_fin)}
                    </p>
                  </div>
                  {dureeRestante ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheckIcon className="h-3 w-3" />
                      {dureeRestante} restants
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-brand-line px-2.5 py-1 text-[11px] font-semibold text-brand-muted">Expirée</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {abonnements_garantix.length > 0 ? (
        <div>
          <p className="mb-3 text-sm font-bold text-brand-ink">Abonnements GarantiX ({abonnements_garantix.length})</p>
          <div className="flex flex-col gap-3">
            {abonnements_garantix.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-line bg-white p-4">
                {a.ligne_commande ? <ImageProduitMini images={a.ligne_commande.produit.images} /> : null}
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate text-sm font-bold text-brand-ink">{a.formule.libelle_complet}</p>
                  <p className="mt-0.5 text-xs text-brand-muted">
                    {a.ligne_commande?.produit.nom_produit ?? "—"} · {a.interventions_utilisees}/{a.formule.frequence_interventions} interventions utilisées
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    a.statut === "actif" ? "bg-emerald-100 text-emerald-600" : "bg-brand-line text-brand-muted"
                  }`}
                >
                  {a.statut === "actif" ? "Actif" : a.statut}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OngletFormation({ fiche }: { fiche: FicheClientType }) {
  const progressions = fiche.formations.progressions;

  if (progressions.length === 0) {
    return <BientotDisponible message="Ce client n'a consulté aucun tuto ou formation pour le moment." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-bold text-brand-ink">Formations suivies ({progressions.length})</p>

      <div className="flex flex-col gap-3">
        {progressions.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-violet-50 text-violet-500">
              {p.tutoriel.image_couverture ? (
                <Image src={p.tutoriel.image_couverture} alt="" fill className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <GraduationCapIcon className="h-6 w-6" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-brand-ink">{p.tutoriel.titre}</p>
              <p className="mt-0.5 text-xs text-brand-muted">
                {LIBELLE_TYPE_TUTORIEL[p.tutoriel.type]} — consulté le {formaterDateHeure(p.date_vue)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                p.statut === "termine" ? "bg-emerald-100 text-emerald-600" : "bg-blue-50 text-[color:var(--brand-blue-end)]"
              }`}
            >
              {p.statut === "termine" ? "Terminé" : "Vu"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChampProfil({
  label,
  valeur,
  icone: Icone,
  couleur = "bg-[#EEF1F6] text-brand-muted",
}: {
  label: string;
  valeur: string;
  icone: typeof CashIcon;
  couleur?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-none">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${couleur}`}>
        <Icone className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-brand-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-brand-ink">{valeur}</p>
      </div>
    </div>
  );
}

function OngletProfil({ fiche }: { fiche: FicheClientType }) {
  const { profil } = fiche;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-brand-muted">Informations personnelles</p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLE_STATUT_COMPTE[profil.user.statut_compte]}`}>
            {LIBELLE_STATUT_COMPTE[profil.user.statut_compte]}
          </span>
        </div>
        <ChampProfil
          label="Nom complet"
          valeur={profil.user.prenom ? `${profil.user.prenom} ${profil.user.nom}` : profil.user.nom}
          icone={UserAvatarIcon}
          couleur="bg-blue-50 text-[color:var(--brand-blue-end)]"
        />
        <ChampProfil label="Email" valeur={profil.user.email} icone={MailIcon} couleur="bg-violet-50 text-violet-500" />
        <ChampProfil label="Téléphone" valeur={profil.user.telephone ?? "—"} icone={PhoneIcon} couleur="bg-emerald-50 text-emerald-500" />
        <ChampProfil label="Membre depuis" valeur={formaterDate(profil.date_inscription)} icone={CalendarIcon} couleur="bg-orange-50 text-orange-500" />
        <ChampProfil label="Code de parrainage" valeur={profil.code_parrainage} icone={TicketIcon} couleur="bg-rose-50 text-rose-500" />
        <ChampProfil label="Solde portefeuille" valeur={`${formaterPrix(profil.solde_portefeuille)} CFA`} icone={CashIcon} couleur="bg-amber-50 text-amber-600" />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase text-brand-muted">Adresses ({profil.adresses.length})</p>
        {profil.adresses.length === 0 ? (
          <VideEtat message="Aucune adresse enregistrée." />
        ) : (
          profil.adresses.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-none">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-500">
                <HomeIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                {a.libelle ? <p className="text-xs font-semibold text-brand-ink">{a.libelle}</p> : null}
                <p className="truncate text-sm text-brand-muted">
                  {a.rue}, {a.ville}, {a.pays}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
