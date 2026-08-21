"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import {
  dureeRestanteLibelle,
  formaterDate,
  formaterDateHeure,
  formaterPrix,
  LIBELLE_MODE_PAIEMENT,
  LIBELLE_STATUT_COMMANDE,
  LIBELLE_STATUT_PAIEMENT,
  STYLE_STATUT_COMMANDE,
  STYLE_STATUT_PAIEMENT,
  type CommandeDetailAdmin,
  type Pagination,
  type PersonneCommande,
  type StatutCommande,
  type UtilisateurAdmin,
} from "@/lib/types";
import {
  BagIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  FournisseursIcon,
  HomeIcon,
  ImagePlaceholderIcon,
  LivreursIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserAvatarIcon,
} from "@/components/icons";
import { Listbox } from "@/components/Listbox";

const DEGRADE_ETAPE = "linear-gradient(270deg, #00BFFF 0%, #0077FF 100%)";

const ETAPES: { statut: StatutCommande; label: string; icone: typeof BagIcon }[] = [
  { statut: "en_attente", label: "Commande passée", icone: BagIcon },
  { statut: "validee", label: "Commande validée", icone: CheckIcon },
  { statut: "en_preparation", label: "En préparation", icone: FournisseursIcon },
  { statut: "en_livraison", label: "Livraison en cours", icone: LivreursIcon },
  { statut: "livree", label: "Commande livrée", icone: HomeIcon },
];

const ORDRE_STATUT: Record<StatutCommande, number> = {
  en_attente: 0,
  validee: 1,
  en_preparation: 2,
  en_livraison: 3,
  livree: 4,
  annulee: -1,
};

const OPTIONS_STATUT = (Object.keys(LIBELLE_STATUT_COMMANDE) as StatutCommande[]).map((s) => ({
  value: s,
  label: LIBELLE_STATUT_COMMANDE[s],
}));

function dateEtape(statut: StatutCommande, commande: CommandeDetailAdmin): string | null {
  switch (statut) {
    case "en_attente":
      return commande.date_commande;
    case "validee":
      return commande.date_validation;
    case "en_livraison":
      return commande.livraison?.date_prise_en_charge ?? null;
    case "livree":
      return commande.livraison?.date_livraison_effective ?? null;
    default:
      return null;
  }
}

function nomComplet(personne: PersonneCommande): string {
  return personne.prenom ? `${personne.prenom} ${personne.nom}` : personne.nom;
}

function ActeurCarte({
  label,
  personne,
  action,
}: {
  label: string;
  personne: PersonneCommande | null;
  action?: string | null;
}) {
  return (
    <div className="flex w-52 flex-col items-center gap-2 rounded-2xl bg-[#F7F9FC] p-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-muted">
        <UserAvatarIcon className="h-7 w-7" />
      </span>
      <div>
        <p className="text-sm font-bold text-brand-ink">{personne ? nomComplet(personne) : "Non assigné"}</p>
        <p className="text-xs text-brand-muted">{label}</p>
      </div>
      {action ? (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[color:var(--brand-blue-end)]">{action}</span>
      ) : null}
    </div>
  );
}

export function CommandeDetail({ id }: { id: string }) {
  const { token } = useAuth();
  const [commande, setCommande] = useState<CommandeDetailAdmin | null | undefined>(undefined);
  const [livreurs, setLivreurs] = useState<UtilisateurAdmin[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const [changementOuvert, setChangementOuvert] = useState(false);
  const [statutChoisi, setStatutChoisi] = useState<StatutCommande | "">("");
  const [livreurChoisi, setLivreurChoisi] = useState("");
  const [paiementOuvert, setPaiementOuvert] = useState(false);

  function recharger() {
    if (!token) return;
    apiFetch<CommandeDetailAdmin>(`/admin/commandes/${id}`, { token })
      .then(setCommande)
      .catch(() => setCommande(null));
  }

  useEffect(recharger, [token, id]);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<UtilisateurAdmin>>("/admin/utilisateurs?type_utilisateur=livreur&per_page=100", { token }).then((p) =>
      setLivreurs(p.data)
    );
  }, [token]);

  async function appliquerStatut() {
    if (!token || !statutChoisi) return;
    if (statutChoisi === "en_livraison" && !livreurChoisi) return;

    setEnCours(true);
    setErreur(null);
    try {
      await apiFetch(`/admin/commandes/${id}/statut`, {
        method: "PATCH",
        token,
        body: {
          statut_commande: statutChoisi,
          ...(statutChoisi === "en_livraison" ? { livreur_id: Number(livreurChoisi) } : {}),
        },
      });
      setChangementOuvert(false);
      setStatutChoisi("");
      setLivreurChoisi("");
      recharger();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de changer le statut.");
    } finally {
      setEnCours(false);
    }
  }

  if (commande === undefined) return <p className="text-sm text-brand-muted">Chargement…</p>;
  if (commande === null) return <p className="text-sm text-brand-muted">Cette commande est introuvable.</p>;

  const ordreActuel = ORDRE_STATUT[commande.statut_commande];

  const fournisseurs = Array.from(
    new Map(commande.lignes.filter((l) => l.produit.fournisseur).map((l) => [l.produit.fournisseur!.user_id, l.produit.fournisseur!])).values()
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 rounded-3xl bg-gradient-brand-blue px-6 py-5">
        <Link
          href={`/clients/consultation/${commande.client_id}?onglet=Commandes`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-extrabold text-white">Détails commande</h1>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
          <SettingsIcon className="h-4 w-4" />
        </span>
      </div>

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <p className="text-sm font-bold text-brand-ink">Commande n°{commande.id}</p>
            <p className="text-xs text-brand-muted">{formaterDateHeure(commande.date_commande)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STYLE_STATUT_COMMANDE[commande.statut_commande]}`}>
            {LIBELLE_STATUT_COMMANDE[commande.statut_commande]}
          </span>
        </div>

        <div className="flex flex-col gap-3 border-t border-brand-line pt-4">
          {commande.lignes.map((ligne) => {
            const dureeRestante = ligne.garantie ? dureeRestanteLibelle(ligne.garantie.date_fin) : null;

            return (
              <div key={ligne.id} className="flex flex-wrap items-center gap-4">
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
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-brand-ink">Suivi de la commande</p>

          <div className="relative">
            <button
              type="button"
              onClick={() => setChangementOuvert((v) => !v)}
              className="flex h-10 items-center gap-1.5 rounded-full border border-brand-line bg-white px-4 text-xs font-semibold text-brand-ink"
            >
              Changer de Statuts
              <ChevronDownIcon className={`h-3.5 w-3.5 text-brand-muted transition-transform ${changementOuvert ? "rotate-180" : ""}`} />
            </button>

            {changementOuvert ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-2xl border border-brand-line bg-white p-4 shadow-xl">
                <label className="text-xs font-medium text-brand-muted">Nouveau statut</label>
                <Listbox
                  value={statutChoisi}
                  onChange={(v) => setStatutChoisi(v as StatutCommande)}
                  options={OPTIONS_STATUT}
                  wrapperClassName="mt-1.5"
                />

                {statutChoisi === "en_livraison" ? (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-brand-muted">Livreur</label>
                    <Listbox
                      value={livreurChoisi}
                      onChange={setLivreurChoisi}
                      options={livreurs.map((l) => ({ value: String(l.id), label: l.prenom ? `${l.prenom} ${l.nom}` : l.nom, icon: UserAvatarIcon }))}
                      placeholder="Choisir un livreur"
                      wrapperClassName="mt-1.5"
                    />
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={appliquerStatut}
                  disabled={enCours || !statutChoisi || (statutChoisi === "en_livraison" && !livreurChoisi)}
                  className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-brand-ink text-xs font-semibold text-white disabled:opacity-40"
                >
                  {enCours ? "Enregistrement…" : "Confirmer"}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {commande.statut_commande === "annulee" ? (
          <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">Cette commande a été annulée.</div>
        ) : (
          <div className="mt-10 flex items-start overflow-x-auto pb-2">
            {ETAPES.map((etape, i) => {
              const atteint = ordreActuel >= i;
              const date = dateEtape(etape.statut, commande);
              const labelEnHaut = i % 2 === 0;
              const Icone = etape.icone;

              return (
                <div key={etape.statut} className="flex min-w-[8.5rem] flex-1 flex-col items-center">
                  <div className="flex h-9 items-end justify-center">
                    {labelEnHaut ? (
                      <p className={`text-center text-[11px] font-semibold ${atteint ? "text-brand-ink" : "text-brand-muted"}`}>{etape.label}</p>
                    ) : null}
                  </div>

                  <div className="flex w-full items-center">
                    <span
                      className="h-1.5 flex-1"
                      style={i === 0 ? undefined : { background: atteint ? DEGRADE_ETAPE : "var(--color-brand-line)" }}
                    />
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2"
                      style={
                        atteint
                          ? { background: DEGRADE_ETAPE, borderColor: "transparent" }
                          : { background: "white", borderColor: "var(--color-brand-line)" }
                      }
                    >
                      <Icone className={`h-4 w-4 ${atteint ? "text-white" : "text-brand-muted"}`} />
                    </span>
                    <span
                      className="h-1.5 flex-1"
                      style={
                        i === ETAPES.length - 1
                          ? undefined
                          : { background: ordreActuel > i ? DEGRADE_ETAPE : "var(--color-brand-line)" }
                      }
                    />
                  </div>

                  <div className="mt-2 flex flex-col items-center gap-1 text-center">
                    {!labelEnHaut ? (
                      <p className={`text-[11px] font-semibold ${atteint ? "text-brand-ink" : "text-brand-muted"}`}>{etape.label}</p>
                    ) : null}
                    <p className="text-[10px] text-brand-muted">{date ? formaterDateHeure(date) : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
        <button type="button" onClick={() => setPaiementOuvert((v) => !v)} className="flex w-full items-center justify-between">
          <p className="text-sm font-bold text-brand-ink">Détails sur les paiements</p>
          <ChevronDownIcon className={`h-4 w-4 text-brand-muted transition-transform ${paiementOuvert ? "rotate-180" : ""}`} />
        </button>

        {paiementOuvert ? (
          commande.paiement ? (
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-brand-line pt-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-brand-muted">Montant</p>
                <p className="mt-0.5 font-semibold text-brand-ink">{formaterPrix(commande.paiement.montant)} CFA</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Mode de paiement</p>
                <p className="mt-0.5 font-semibold text-brand-ink">{LIBELLE_MODE_PAIEMENT[commande.paiement.mode_paiement] ?? commande.paiement.mode_paiement}</p>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Statut</p>
                <span className={`mt-0.5 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLE_STATUT_PAIEMENT[commande.paiement.statut_paiement]}`}>
                  {LIBELLE_STATUT_PAIEMENT[commande.paiement.statut_paiement] ?? commande.paiement.statut_paiement}
                </span>
              </div>
              <div>
                <p className="text-xs text-brand-muted">Date</p>
                <p className="mt-0.5 font-semibold text-brand-ink">
                  {commande.paiement.date_paiement ? formaterDateHeure(commande.paiement.date_paiement) : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 border-t border-brand-line pt-4 text-sm text-brand-muted">Aucun paiement enregistré pour cette commande.</p>
          )
        ) : null}
      </div>

      <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
        <p className="mb-4 text-sm font-bold text-brand-ink">Les acteurs</p>
        <div className="flex flex-wrap gap-4">
          <ActeurCarte
            label={commande.commercial?.type_commercial === "ia" ? "Agent IA" : "Commercial"}
            personne={commande.commercial?.user ?? null}
            action={`A enregistré la commande le ${formaterDate(commande.date_commande)}`}
          />

          {fournisseurs.length === 0 ? (
            <ActeurCarte label="Fournisseur" personne={null} action="Produit(s) publié(s) directement par Ordi'Space" />
          ) : (
            fournisseurs.map((f) => (
              <ActeurCarte
                key={f.user_id}
                label="Fournisseur"
                personne={f.user}
                action={ordreActuel >= ORDRE_STATUT.en_preparation ? "A préparé la commande" : "En attente de préparation"}
              />
            ))
          )}

          <ActeurCarte
            label="Livreur"
            personne={commande.livraison?.livreur?.user ?? null}
            action={
              !commande.livraison
                ? null
                : commande.livraison.date_livraison_effective
                  ? `A livré le produit le ${formaterDate(commande.livraison.date_livraison_effective)}`
                  : commande.livraison.livreur
                    ? "Livraison en cours"
                    : "En attente d'un livreur"
            }
          />
        </div>
      </div>
    </div>
  );
}
