export type Pagination<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export function formaterPrix(prix: string | number): string {
  const nombre = typeof prix === "string" ? parseFloat(prix) : prix;
  return new Intl.NumberFormat("fr-FR").format(nombre);
}

export function formaterDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

export function formaterDateHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// --- Produits ---------------------------------------------------------

export type Categorie = {
  id: number;
  nom_categorie: string;
  description: string | null;
};

export type ImageProduit = {
  id: number;
  url_image: string;
  ordre_affichage: number;
};

export type StatutProduit = "en_attente" | "valide" | "rejete" | "corrige";

export type Produit = {
  id: number;
  nom_produit: string;
  description: string | null;
  prix: string;
  quantite_stock: number;
  type_livraison: "physique" | "numerique";
  duree_garantie_mois: number | null;
  statut_produit: StatutProduit;
  categorie: Categorie;
  images: ImageProduit[];
  fournisseur?: { id: number; nom_entreprise: string } | null;
};

export const LIBELLE_STATUT_PRODUIT: Record<StatutProduit, string> = {
  en_attente: "En attente",
  valide: "Validé",
  rejete: "Rejeté",
  corrige: "Corrigé",
};

export const STYLE_STATUT_PRODUIT: Record<StatutProduit, string> = {
  en_attente: "bg-amber-100 text-amber-600",
  valide: "bg-emerald-100 text-emerald-600",
  rejete: "bg-rose-100 text-rose-600",
  corrige: "bg-sky-100 text-sky-600",
};

// --- GarantiX -----------------------------------------------------------

export type PrestationGarantix = {
  id: number;
  libelle: string;
  ordre_affichage: number;
};

export type FormuleGarantix = {
  id: number;
  nom: string;
  libelle_complet: string;
  libelle_badge: string | null;
  prix_annuel: string;
  frequence_interventions: number;
  description: string | null;
  ordre_affichage: number;
  actif: boolean;
  prestations: PrestationGarantix[];
};

export type ExclusionGarantix = {
  id: number;
  libelle: string;
};

// --- Tutoriels / Formations ----------------------------------------------

export type TypeTutoriel = "tutoriel_rapide" | "formation";
export type StatutTutoriel = "brouillon" | "publie";

export type Tutoriel = {
  id: number;
  titre: string;
  type: TypeTutoriel;
  url_video: string | null;
  id_video_youtube: string | null;
  contenu: string | null;
  image_couverture: string | null;
  statut: StatutTutoriel;
  date_publication: string | null;
};

export const LIBELLE_TYPE_TUTORIEL: Record<TypeTutoriel, string> = {
  tutoriel_rapide: "Tuto rapide",
  formation: "Formation",
};

// Aperçu client-side pendant la saisie (avant enregistrement, donc avant que
// l'API ne renvoie id_video_youtube) : même règle que le backend.
export function extraireIdYoutube(url: string): string | null {
  const correspondance = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return correspondance?.[1] ?? null;
}

// --- Privilèges -----------------------------------------------------------

export type TypePrivilege = "remise_pourcentage" | "remise_montant" | "livraison_gratuite" | "parrainage";

export type Privilege = {
  id: number;
  titre: string;
  sous_titre: string | null;
  description: string | null;
  type_privilege: TypePrivilege;
  valeur: string | null;
  code_promo: string | null;
  limite_utilisation_par_client: number | null;
  date_debut: string | null;
  date_fin: string | null;
  actif: boolean;
  ordre_affichage: number | null;
  couleur_debut: string;
  couleur_fin: string;
};

export const LIBELLE_TYPE_PRIVILEGE: Record<TypePrivilege, string> = {
  remise_pourcentage: "Remise en %",
  remise_montant: "Remise en montant fixe (Cashback)",
  livraison_gratuite: "Livraison gratuite",
  parrainage: "Parrainage",
};

// --- Utilisateurs (admin/utilisateurs) -----------------------------------

export type StatutCompte = "actif" | "suspendu" | "desactive";

export const LIBELLE_STATUT_COMPTE: Record<StatutCompte, string> = {
  actif: "Actif",
  suspendu: "Suspendu",
  desactive: "Désactivé",
};

export const STYLE_STATUT_COMPTE: Record<StatutCompte, string> = {
  actif: "bg-emerald-100 text-emerald-600",
  suspendu: "bg-amber-100 text-amber-600",
  desactive: "bg-rose-100 text-rose-600",
};

export type UtilisateurAdmin = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  type_utilisateur: string;
  statut_compte: StatutCompte;
  created_at: string;
};

// --- Gestion clients (admin/clients) -------------------------------------

export type SegmentClient = "nouveau" | "gros_acheteur" | "vip";

export const LIBELLE_SEGMENT_CLIENT: Record<SegmentClient, string> = {
  nouveau: "Nouveau Client",
  gros_acheteur: "Gros Acheteur",
  vip: "VIP",
};

export const STYLE_SEGMENT_CLIENT: Record<SegmentClient, string> = {
  nouveau: "bg-blue-100 text-[color:var(--brand-blue-end)]",
  gros_acheteur: "bg-orange-100 text-orange-600",
  vip: "bg-violet-100 text-violet-600",
};

export type ClientAdmin = {
  id: number;
  date_inscription: string;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  statut_compte: StatutCompte;
  derniere_connexion: string | null;
  created_at: string;
  produits_achetes: number;
  total_depense: number;
  nombre_interventions: number;
  nombre_commandes: number;
  segment: SegmentClient | null;
  en_ligne: boolean;
};

// --- Fidélité (admin/fidelite) — vue sur le portefeuille + parrainage réels --

export type ClientFidelite = {
  id: number;
  code_parrainage: string;
  solde_portefeuille: number;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  nombre_filleuls: number;
  derniere_transaction: string | null;
};

export type StatsFidelite = {
  solde_total: number;
  total_credite: number;
  clients_avec_filleuls: number;
};

// --- Réclamations (reclamations) ------------------------------------------

export type StatutReclamation = "nouvelle" | "en_cours" | "resolue" | "rejetee";

export const LIBELLE_STATUT_RECLAMATION: Record<StatutReclamation, string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  resolue: "Résolue",
  rejetee: "Rejetée",
};

export const STYLE_STATUT_RECLAMATION: Record<StatutReclamation, string> = {
  nouvelle: "bg-rose-100 text-rose-600",
  en_cours: "bg-amber-100 text-amber-600",
  resolue: "bg-emerald-100 text-emerald-600",
  rejetee: "bg-brand-line text-brand-muted",
};

export type ReclamationAdmin = {
  id: number;
  client_id: number;
  commande_id: number | null;
  sujet: string;
  description: string;
  statut: StatutReclamation;
  reponse_admin: string | null;
  date_reclamation: string;
  date_traitement: string | null;
  client: { user_id: number; user: PersonneCommande & { email: string; telephone: string | null } };
  commande: { id: number } | null;
};

// --- Tableau de bord Gestion Clients (admin/clients/tableau-de-bord) -----

export type TableauDeBordClients = {
  clients: {
    total: number;
    actifs: number;
    suspendus: number;
    desactives: number;
    en_ligne: number;
    nouveaux_7j: number;
    nouveaux_30j: number;
  };
  segments: { nouveau: number; gros_acheteur: number; vip: number; aucun: number };
  inscriptions_par_semaine: { semaine: string; total: number }[];
  commandes: {
    total: number;
    chiffre_affaires: number;
    par_statut: Partial<Record<StatutCommande, number>>;
  };
  fidelite: { solde_total: number; total_credite: number; clients_avec_filleuls: number };
  reclamations: { total: number; par_statut: Partial<Record<StatutReclamation, number>> };
  garanties_actives: number;
};

export type StatsClients = {
  total: number;
  nouveaux_semaine: number;
  en_ligne: number;
};

export function clientDepuisLibelle(dateInscriptionIso: string): string {
  const debut = new Date(dateInscriptionIso).getTime();
  const joursEcoules = Math.floor((Date.now() - debut) / (1000 * 60 * 60 * 24));

  if (joursEcoules < 30) return joursEcoules <= 1 ? "1 jour" : `${joursEcoules} jours`;
  if (joursEcoules < 365) {
    const mois = Math.floor(joursEcoules / 30);
    return mois <= 1 ? "1 mois" : `${mois} mois`;
  }
  const ans = Math.floor(joursEcoules / 365);
  return ans <= 1 ? "1 an" : `${ans} ans`;
}

// Retourne null si la garantie est déjà expirée (aucun badge à afficher).
export function dureeRestanteLibelle(dateFinIso: string): string | null {
  const joursRestants = Math.ceil((new Date(dateFinIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (joursRestants <= 0) return null;
  if (joursRestants < 14) return joursRestants <= 1 ? "1 jour" : `${joursRestants} jours`;
  if (joursRestants < 60) {
    const semaines = Math.round(joursRestants / 7);
    return semaines <= 1 ? "1 semaine" : `${semaines} semaines`;
  }
  const mois = Math.round(joursRestants / 30);
  return mois <= 1 ? "1 mois" : `${mois} mois`;
}

// --- SAV : déclarations de panne / rendez-vous / interventions -----------

export type StatutDemandeSav = "en_attente" | "planifiee" | "en_cours" | "resolue" | "cloturee";
export type StatutIntervention = "planifiee" | "en_cours" | "terminee" | "annulee";

export const LIBELLE_STATUT_DEMANDE_SAV: Record<StatutDemandeSav, string> = {
  en_attente: "En attente",
  planifiee: "Planifiée",
  en_cours: "En cours",
  resolue: "Résolue",
  cloturee: "Clôturée",
};

export const STYLE_STATUT_DEMANDE_SAV: Record<StatutDemandeSav, string> = {
  en_attente: "bg-amber-100 text-amber-600",
  planifiee: "bg-sky-100 text-sky-600",
  en_cours: "bg-blue-100 text-blue-600",
  resolue: "bg-emerald-100 text-emerald-600",
  cloturee: "bg-brand-line text-brand-muted",
};

export const LIBELLE_STATUT_INTERVENTION: Record<StatutIntervention, string> = {
  planifiee: "Planifiée",
  en_cours: "En cours",
  terminee: "Terminée",
  annulee: "Annulée",
};

export type ClientResume = {
  user_id: number;
  user: { id: number; nom: string; prenom: string | null; email: string; telephone: string | null };
};

export type TechnicienResume = {
  user_id: number;
  specialite: string | null;
  user: { id: number; nom: string; prenom: string | null; email: string; telephone: string | null };
};

export type ProduitResume = { id: number; nom_produit: string };

export type GarantieAvecProduit = {
  id: number;
  date_debut: string;
  date_fin: string;
  type_garantie: string;
  ligne_commande?: { produit?: ProduitResume | null } | null;
};

export type Intervention = {
  id: number;
  rendez_vous_id: number;
  technicien_id: number;
  diagnostic: string | null;
  reparation_effectuee: string | null;
  statut_intervention: StatutIntervention;
  cout: string | null;
  date_intervention: string | null;
};

export type RendezVous = {
  id: number;
  demande_sav_id: number;
  technicien_id: number | null;
  date_rdv: string;
  lieu: string | null;
  technicien: TechnicienResume | null;
  demande_sav?: DemandeSav;
  intervention: Intervention | null;
};

export type DemandeSav = {
  id: number;
  client_id: number;
  garantie_id: number | null;
  description_probleme: string;
  statut_demande: StatutDemandeSav;
  date_demande: string;
  client: ClientResume;
  garantie: GarantieAvecProduit | null;
  rendez_vous: RendezVous[];
};

// --- Assistance : FAQ + audio --------------------------------------------

export type StatutQuestion = "brouillon" | "publie";

export type QuestionFrequente = {
  id: number;
  question: string;
  reponse: string | null;
  fichier_audio: string | null;
  statut: StatutQuestion;
  ordre_affichage: number;
};

// --- Fiche client (admin/clients/{id}) -----------------------------------

export type AdresseClient = { id: number; libelle: string | null; rue: string; ville: string; pays: string };

export type LignePanierAdmin = { id: number; quantite: number; produit: Produit; created_at: string };

export type ProfilClientDetail = {
  user_id: number;
  date_inscription: string;
  code_parrainage: string;
  solde_portefeuille: string;
  user: {
    id: number;
    nom: string;
    prenom: string | null;
    email: string;
    telephone: string | null;
    statut_compte: StatutCompte;
    derniere_connexion: string | null;
  };
  adresses: AdresseClient[];
  panier: { id: number; lignes: LignePanierAdmin[] } | null;
};

export type StatsClientDetail = {
  total_depense: number;
  commandes: number;
  produits_achetes: number;
  garanties_actives: number;
  interventions: number;
};

export type BadgesClientDetail = { garantie_active: boolean; segment: SegmentClient | null; en_ligne: boolean };

export type ActiviteClient = { categorie: string; description: string; date: string };

export type StatutCommande = "en_attente" | "validee" | "en_preparation" | "en_livraison" | "livree" | "annulee";

export const LIBELLE_STATUT_COMMANDE: Record<StatutCommande, string> = {
  en_attente: "En attente",
  validee: "Validée",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

export const STYLE_STATUT_COMMANDE: Record<StatutCommande, string> = {
  en_attente: "bg-orange-500 text-white",
  validee: "bg-[color:var(--brand-blue-end)] text-white",
  en_preparation: "bg-[color:var(--brand-blue-end)] text-white",
  en_livraison: "bg-[color:var(--brand-blue-end)] text-white",
  livree: "bg-emerald-500 text-white",
  annulee: "bg-rose-500 text-white",
};

export type LigneCommandeAdmin = {
  id: number;
  quantite: number;
  prix_unitaire: string;
  produit: Produit;
  garantie: { id: number; date_fin: string } | null;
};

export type CommandeClientDetail = {
  id: number;
  statut_commande: StatutCommande;
  montant_total: string;
  montant_remise: string;
  date_commande: string;
  lignes: LigneCommandeAdmin[];
};

// --- Détail commande (admin/commandes/{id}) ------------------------------

export type PersonneCommande = { id: number; nom: string; prenom: string | null };

export type LigneCommandeDetail = {
  id: number;
  quantite: number;
  prix_unitaire: string;
  produit: Omit<Produit, "fournisseur"> & {
    fournisseur: { user_id: number; nom_entreprise: string; user: PersonneCommande } | null;
  };
  garantie: { id: number; date_fin: string } | null;
};

export type LivraisonDetail = {
  id: number;
  statut_livraison: string;
  date_prise_en_charge: string | null;
  date_livraison_effective: string | null;
  livreur: { user_id: number; user: PersonneCommande } | null;
  adresse: { libelle: string | null; rue: string; ville: string; pays: string } | null;
};

export type PaiementDetail = {
  id: number;
  montant: string;
  mode_paiement: string;
  statut_paiement: string;
  reference_transaction: string | null;
  date_paiement: string | null;
};

export type CommandeDetailAdmin = {
  id: number;
  client_id: number;
  statut_commande: StatutCommande;
  montant_total: string;
  montant_remise: string;
  date_commande: string;
  date_validation: string | null;
  commercial: { user_id: number; type_commercial: string; user: PersonneCommande } | null;
  coordinateur: { user_id: number; user: PersonneCommande } | null;
  lignes: LigneCommandeDetail[];
  livraison: LivraisonDetail | null;
  paiement: PaiementDetail | null;
  privilege: { id: number; titre: string; type_privilege: string; code_promo: string | null } | null;
  parrain: { user_id: number; user: PersonneCommande } | null;
};

export const LIBELLE_STATUT_LIVRAISON: Record<string, string> = {
  en_preparation: "En préparation",
  en_attente_livreur: "En attente d'un livreur",
  en_cours: "En cours de livraison",
  livree: "Livrée",
  echouee: "Échouée",
};

export const LIBELLE_MODE_PAIEMENT: Record<string, string> = {
  mobile_money: "Mobile Money",
  especes: "Espèces",
};

export const LIBELLE_STATUT_PAIEMENT: Record<string, string> = {
  en_attente: "En attente",
  confirme: "Confirmé",
  echoue: "Échoué",
};

export const STYLE_STATUT_PAIEMENT: Record<string, string> = {
  en_attente: "bg-amber-100 text-amber-600",
  confirme: "bg-emerald-100 text-emerald-600",
  echoue: "bg-rose-100 text-rose-600",
};

export type UtilisationPrivilegeDetail = {
  id: number;
  montant_remise: string;
  date_utilisation: string;
  privilege: Privilege;
  commande: { id: number } | null;
};

export type GarantieDetail = {
  id: number;
  date_debut: string;
  date_fin: string;
  type_garantie: string;
  ligne_commande: { produit: Produit } | null;
};

export type AbonnementGarantixDetail = {
  id: number;
  date_debut: string;
  date_fin: string;
  statut: string;
  statut_paiement: "en_attente" | "confirme" | "echoue";
  mode_paiement: "mobile_money" | "especes";
  interventions_utilisees: number;
  formule: FormuleGarantix;
  ligne_commande: { produit: Produit } | null;
};

export type ProgressionTutorielDetail = { id: number; statut: string; date_vue: string; tutoriel: Tutoriel };

export type FicheClient = {
  profil: ProfilClientDetail;
  stats: StatsClientDetail;
  badges: BadgesClientDetail;
  activites: ActiviteClient[];
  commandes: CommandeClientDetail[];
  maintenance: { demandes: DemandeSav[] };
  privileges: { utilisations: UtilisationPrivilegeDetail[] };
  garanties: { garanties: GarantieDetail[]; abonnements_garantix: AbonnementGarantixDetail[] };
  formations: { progressions: ProgressionTutorielDetail[] };
};

// --- Conversations agent IA "Ellah" (admin/clients/aide-rapide) ----------

export type ClientConversationIa = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  nombre_messages: number;
  dernier_message_date: string;
  dernier_message_contenu: string;
};

export type RoleMessageIa = "client" | "assistant";

export type MessageAssistantIaAdmin = {
  id: number;
  role: RoleMessageIa;
  contenu: string;
  date_envoi: string;
};
