"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterPrix, type Localite, type Pagination, type Produit, type UtilisateurAdmin } from "@/lib/types";
import {
  BagIcon,
  CalendarIcon,
  CashIcon,
  ChevronRightIcon,
  ClockIcon,
  LivreursIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserAvatarIcon,
} from "@/components/icons";
import { Listbox } from "@/components/Listbox";
import { SelecteurProduitAchat } from "@/components/SelecteurProduitAchat";

// Valeur encodée "<montant><unité>" (j = jours, m = mois) — voir
// decoderDureeGarantie(). Les durées courtes (semaines) sont envoyées en
// jours exacts au backend, les durées longues restent en mois comme avant.
const OPTIONS_GARANTIE = [
  { value: "7j", label: "1 semaine" },
  { value: "14j", label: "2 semaines" },
  { value: "21j", label: "3 semaines" },
  { value: "1m", label: "1 mois" },
  { value: "3m", label: "3 mois" },
  { value: "6m", label: "6 mois" },
  { value: "12m", label: "12 mois" },
  { value: "24m", label: "24 mois" },
];

const FORMATEUR_DATE_COURTE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function ajouterMois(date: Date, mois: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + mois);
  return d;
}

function ajouterJours(date: Date, jours: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + jours);
  return d;
}

/** Décode une valeur d'OPTIONS_GARANTIE ("7j", "3m"...) en montant + unité. */
function decoderDureeGarantie(valeur: string): { unite: "jours" | "mois"; montant: number } | null {
  const correspondance = valeur.match(/^(\d+)(j|m)$/);
  if (!correspondance) return null;
  return { unite: correspondance[2] === "j" ? "jours" : "mois", montant: Number(correspondance[1]) };
}

function Champ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-brand-muted">{label} *</label>
      {children}
    </div>
  );
}

function ChampTexte({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-11 rounded-xl border border-brand-line px-3 text-sm outline-none focus:border-[color:var(--brand-blue-end)]"
    />
  );
}

function Section({
  numero,
  titre,
  icone: Icone,
  children,
}: {
  numero: number;
  titre: string;
  icone: typeof BagIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-line bg-white p-6">
      <div className="flex items-center gap-2.5 rounded-xl bg-orange-50 px-4 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">{numero}</span>
        <Icone className="h-4 w-4 text-orange-500" />
        <p className="text-sm font-bold text-brand-ink">{titre}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

/**
 * Remplace l'ancienne modale "Nouveau client" — cet écran crée toujours une
 * commande complète (produit, livraison planifiée, livreur assigné, durée de
 * garantie négociée), pas seulement un client. La commande reste "en
 * livraison" une fois créée (pas marquée "livrée" immédiatement) : la
 * garantie réelle ne sera générée qu'à la confirmation de livraison, comme
 * pour toute commande physique — voir Garantie::genererPourCommande() côté
 * backend. La période affichée ici ("Du X au Y") est une prévisualisation
 * indicative basée sur la date d'achat (aujourd'hui), pas un engagement.
 */
export default function NouvelleCommandePage() {
  const { token } = useAuth();
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [localites, setLocalites] = useState<Localite[] | null>(null);
  const [localiteId, setLocaliteId] = useState("");

  const [produits, setProduits] = useState<Produit[] | null>(null);
  const [produitId, setProduitId] = useState("");
  const [produitDetail, setProduitDetail] = useState<Produit | null>(null);
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [fraisLivraison, setFraisLivraison] = useState("");

  const [dateLivraison, setDateLivraison] = useState("");
  const [heureLivraison, setHeureLivraison] = useState("");
  const [livreurs, setLivreurs] = useState<UtilisateurAdmin[] | null>(null);
  const [livreurId, setLivreurId] = useState("");
  const [dureeGarantie, setDureeGarantie] = useState("");

  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<Pagination<Produit>>("/produits?statut=valide&per_page=100", { token })
      .then((page) => setProduits(page.data.filter((p) => p.statut_produit === "valide" && p.type_livraison === "physique")))
      .catch(() => setProduits([]));
    apiFetch<Localite[]>("/localites", { token }).then(setLocalites).catch(() => setLocalites([]));
    apiFetch<Pagination<UtilisateurAdmin>>("/admin/utilisateurs?type_utilisateur=livreur&per_page=100", { token })
      .then((page) => setLivreurs(page.data))
      .catch(() => setLivreurs([]));
  }, [token]);

  function choisirProduit(id: string) {
    if (!token) return;
    setProduitId(id);
    setProduitDetail(null);
    apiFetch<Produit>(`/produits/${id}`, { token }).then((p) => {
      setProduitDetail(p);
      setPrixUnitaire(String(p.prix_vente ?? p.prix));
    });
  }

  // Préremplit les frais à partir du vrai barème dès que produit + localité
  // sont connus — l'admin peut ensuite l'ajuster (vente négociée par
  // téléphone, même logique que le prix). Si aucun tarif n'est configuré
  // pour ce couple, on laisse le champ vide plutôt que de bloquer l'écran.
  useEffect(() => {
    if (!token || !produitId || !localiteId) return;
    let annule = false;
    apiFetch<{ frais_livraison: number }>(`/produits/${produitId}/frais-livraison?localite_id=${localiteId}`, { token })
      .then((r) => {
        if (!annule) setFraisLivraison(String(r.frais_livraison));
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [token, produitId, localiteId]);

  const montantTotal = (Number(prixUnitaire) || 0) * (Number(quantite) || 0) + (Number(fraisLivraison) || 0);

  const pretAEnvoyer = Boolean(
    nom.trim() &&
      prenom.trim() &&
      telephone.trim() &&
      localiteId &&
      produitId &&
      prixUnitaire &&
      quantite &&
      fraisLivraison !== "" &&
      dateLivraison &&
      heureLivraison &&
      livreurId &&
      dureeGarantie
  );

  async function enregistrer() {
    if (!token || !pretAEnvoyer) return;
    setErreur(null);
    setEnCours(true);

    try {
      const client = await apiFetch<{ id: number }>("/clients/creation-rapide", {
        method: "POST",
        token,
        body: { nom, prenom, telephone },
      });

      const adresse = await apiFetch<{ id: number }>(`/clients/${client.id}/adresses`, {
        method: "POST",
        token,
        body: { localite_id: Number(localiteId) },
      });

      const commande = await apiFetch<{ id: number }>("/commandes", {
        method: "POST",
        token,
        body: {
          client_id: client.id,
          adresse_id: adresse.id,
          lignes: [
            {
              produit_id: Number(produitId),
              quantite: Number(quantite),
              prix_unitaire: Number(prixUnitaire),
              ...(decoderDureeGarantie(dureeGarantie)?.unite === "jours"
                ? { duree_garantie_jours: decoderDureeGarantie(dureeGarantie)?.montant }
                : { duree_garantie_mois: decoderDureeGarantie(dureeGarantie)?.montant }),
            },
          ],
          frais_livraison: Number(fraisLivraison),
          date_livraison_prevue: `${dateLivraison} ${heureLivraison}:00`,
        },
      });

      await apiFetch(`/commandes/${commande.id}/assigner-livreur`, {
        method: "POST",
        token,
        body: { livreur_id: Number(livreurId) },
      });

      router.push(`/clients/consultation/${client.id}?commande_creee=${commande.id}`);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer cette commande.");
      setEnCours(false);
    }
  }

  const livreurChoisi = livreurs?.find((l) => String(l.id) === livreurId) ?? null;
  const dateAchatFormatee = FORMATEUR_DATE_COURTE.format(new Date());
  const dureeGarantieDecodee = dureeGarantie ? decoderDureeGarantie(dureeGarantie) : null;
  const dateFinGarantieFormatee = dureeGarantieDecodee
    ? FORMATEUR_DATE_COURTE.format(
        dureeGarantieDecodee.unite === "jours"
          ? ajouterJours(new Date(), dureeGarantieDecodee.montant)
          : ajouterMois(new Date(), dureeGarantieDecodee.montant)
      )
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/clients/liste" className="font-medium text-brand-muted hover:text-brand-ink">
            Clients
          </Link>
          <ChevronRightIcon className="h-3.5 w-3.5 text-brand-muted" />
          <span className="font-bold text-brand-ink">Nouvelle commande</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/clients/liste")}
            className="flex h-10 items-center rounded-full border border-brand-line px-5 text-sm font-semibold text-brand-ink"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={enregistrer}
            disabled={enCours || !pretAEnvoyer}
            className="flex h-10 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)" }}
          >
            {enCours ? "Enregistrement…" : "Enregistrer la commande"}
          </button>
        </div>
      </div>

      {erreur ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{erreur}</p> : null}

      <div className="grid grid-cols-[1fr_420px] items-start gap-5">
        <div className="flex flex-col gap-5">
          <Section numero={1} titre="Identité du client" icone={UserAvatarIcon}>
            <Champ label="Nom">
              <ChampTexte value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
            </Champ>
            <Champ label="Prénom">
              <ChampTexte value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" />
            </Champ>
            <Champ label="Numéro de téléphone">
              <ChampTexte value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="07 05 12 34 56" />
            </Champ>
            <Champ label="Lieu de livraison">
              {localites === null ? (
                <p className="flex h-11 items-center text-xs text-brand-muted">Chargement…</p>
              ) : (
                <Listbox
                  value={localiteId}
                  onChange={setLocaliteId}
                  placeholder="Choisir la localité"
                  options={localites.map((l) => ({
                    value: String(l.id),
                    label: l.type === "commune_abidjan" ? `Abidjan, ${l.nom}` : l.nom,
                  }))}
                />
              )}
            </Champ>
          </Section>

          <Section numero={2} titre="Produit et prix" icone={BagIcon}>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Produit acheté *</label>
              {produits === null ? (
                <p className="flex h-11 items-center text-xs text-brand-muted">Chargement des produits…</p>
              ) : produits.length === 0 ? (
                <p className="flex h-11 items-center text-xs text-brand-muted">Aucun ordinateur disponible à la vente pour l&apos;instant.</p>
              ) : (
                <SelecteurProduitAchat produits={produits} valeur={produitId} onChange={choisirProduit} />
              )}
              {produitDetail ? (
                <p className="text-[11px] text-brand-muted">Vendu par {produitDetail.fournisseur?.nom_entreprise ?? "Ordi'Space (direct)"}</p>
              ) : null}
            </div>

            <Champ label="Prix d'achat unitaire">
              <div className="relative">
                <ChampTexte
                  aria-label="Prix d'achat unitaire"
                  type="number"
                  min="0"
                  value={prixUnitaire}
                  onChange={(e) => setPrixUnitaire(e.target.value)}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-brand-line pl-3 pr-14 text-sm outline-none focus:border-[color:var(--brand-blue-end)]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted">FCFA</span>
              </div>
            </Champ>

            <Champ label="Quantité">
              <div className="flex h-11 items-center justify-between rounded-xl border border-brand-line px-2.5">
                <button
                  type="button"
                  aria-label="Diminuer la quantité"
                  onClick={() => setQuantite((q) => String(Math.max(1, (Number(q) || 1) - 1)))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF1F6] text-sm font-bold text-brand-ink"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-brand-ink">{quantite || 0}</span>
                <button
                  type="button"
                  aria-label="Augmenter la quantité"
                  onClick={() => setQuantite((q) => String((Number(q) || 0) + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF1F6] text-brand-ink"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </Champ>

            <Champ label="Frais de livraison">
              <div className="relative">
                <ChampTexte
                  aria-label="Frais de livraison"
                  type="number"
                  min="0"
                  value={fraisLivraison}
                  onChange={(e) => setFraisLivraison(e.target.value)}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-brand-line pl-3 pr-14 text-sm outline-none focus:border-[color:var(--brand-blue-end)]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted">FCFA</span>
              </div>
            </Champ>

            <div className="col-span-2 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-bold text-orange-600">
                <CashIcon className="h-4 w-4" /> Montant total payé (calcul automatique)
              </span>
              <span className="text-lg font-extrabold text-orange-600">{formaterPrix(montantTotal)} FCFA</span>
            </div>
          </Section>

          <Section numero={3} titre="Autres informations" icone={CalendarIcon}>
            <Champ label="Date de livraison">
              <ChampTexte type="date" value={dateLivraison} onChange={(e) => setDateLivraison(e.target.value)} />
            </Champ>
            <Champ label="Heure de livraison">
              <ChampTexte type="time" value={heureLivraison} onChange={(e) => setHeureLivraison(e.target.value)} />
            </Champ>
            <Champ label="Livreur responsable">
              {livreurs === null ? (
                <p className="flex h-11 items-center text-xs text-brand-muted">Chargement…</p>
              ) : (
                <Listbox
                  value={livreurId}
                  onChange={setLivreurId}
                  placeholder="Choisir un livreur"
                  options={livreurs.map((l) => ({
                    value: String(l.id),
                    label: l.prenom ? `${l.prenom} ${l.nom}` : l.nom,
                    icon: UserAvatarIcon,
                  }))}
                />
              )}
            </Champ>
            <Champ label="Durée de garantie">
              <Listbox value={dureeGarantie} onChange={setDureeGarantie} placeholder="Choisir une durée" options={OPTIONS_GARANTIE} />
            </Champ>
            <p className="col-span-2 flex items-start gap-1.5 text-[11px] text-brand-muted">
              <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0 translate-y-0.5" />
              La garantie est valable à compter de la date d&apos;achat (aujourd&apos;hui), pas de la date de livraison.
            </p>
          </Section>
        </div>

        <div className="sticky top-6 flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-brand-ink">Aperçu de la commande</p>
            {pretAEnvoyer ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">Prêt à enregistrer</span>
            ) : null}
          </div>

          <div className="rounded-xl bg-[#F7F8FF] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-ink">
              <UserAvatarIcon className="h-3.5 w-3.5" /> Client
            </p>
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-brand-muted">
                Nom complet : <span className="font-semibold text-brand-ink">{nom || prenom ? `${nom} ${prenom}`.trim() : "—"}</span>
              </p>
              <p className="text-brand-muted">
                Téléphone : <span className="font-semibold text-brand-ink">{telephone || "—"}</span>
              </p>
              <p className="text-brand-muted">
                Lieu de livraison :{" "}
                <span className="font-semibold text-brand-ink">
                  {localites?.find((l) => String(l.id) === localiteId)?.nom ?? "—"}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#F7F8FF] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-ink">
              <BagIcon className="h-3.5 w-3.5" /> Produit et prix
            </p>
            {produitDetail ? (
              <div className="mt-2 flex items-center gap-2.5">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                  {produitDetail.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- miniature d'aperçu, pas besoin de next/image ici
                    <img src={produitDetail.images[0].url_image} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-brand-ink">{produitDetail.nom_produit}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-brand-muted">Aucun produit choisi.</p>
            )}
            <div className="mt-2 space-y-1 text-xs text-brand-muted">
              <p>
                Prix unitaire : <span className="font-semibold text-brand-ink">{prixUnitaire ? `${formaterPrix(prixUnitaire)} FCFA` : "—"}</span>
              </p>
              <p>
                Quantité : <span className="font-semibold text-brand-ink">{quantite || "—"}</span>
              </p>
              <p>
                Frais de livraison :{" "}
                <span className="font-semibold text-brand-ink">{fraisLivraison !== "" ? `${formaterPrix(fraisLivraison)} FCFA` : "—"}</span>
              </p>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2">
              <span className="text-xs font-bold text-orange-600">Montant total payé :</span>
              <span className="text-sm font-extrabold text-orange-600">{formaterPrix(montantTotal)} FCFA</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#F7F8FF] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-brand-ink">
              <ClockIcon className="h-3.5 w-3.5" /> Autres informations
            </p>
            <div className="mt-2 space-y-1.5 text-xs text-brand-muted">
              <p className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                Date et heure de livraison :{" "}
                <span className="font-semibold text-brand-ink">
                  {dateLivraison ? `${FORMATEUR_DATE_COURTE.format(new Date(dateLivraison))}${heureLivraison ? ` à ${heureLivraison}` : ""}` : "—"}
                </span>
              </p>
              <p className="flex items-center gap-1.5">
                <LivreursIcon className="h-3.5 w-3.5 shrink-0" />
                Livreur responsable :{" "}
                <span className="font-semibold text-brand-ink">
                  {livreurChoisi ? (livreurChoisi.prenom ? `${livreurChoisi.prenom} ${livreurChoisi.nom}` : livreurChoisi.nom) : "—"}
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0 translate-y-0.5" />
                <span>
                  Durée de garantie :{" "}
                  <span className="font-semibold text-brand-ink">
                    {OPTIONS_GARANTIE.find((o) => o.value === dureeGarantie)?.label ?? "—"}
                  </span>
                  {dureeGarantie && dateFinGarantieFormatee ? (
                    <span className="block text-[11px] text-brand-muted">
                      Du {dateAchatFormatee} au {dateFinGarantieFormatee}
                    </span>
                  ) : null}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
