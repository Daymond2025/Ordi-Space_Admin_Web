import type { ComponentType, SVGProps } from "react";
import {
  ClientsIcon,
  CommerciauxIcon,
  CoordinateursIcon,
  DashboardIcon,
  FinanceIcon,
  FournisseursIcon,
  LivreursIcon,
  MaintenanceServiceIcon,
  OperationsIcon,
  ReportsIcon,
} from "@/components/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/operations", label: "Operations", icon: OperationsIcon },
  { href: "/clients", label: "Clients", icon: ClientsIcon },
  { href: "/commerciaux", label: "Commerciaux", icon: CommerciauxIcon },
  { href: "/fournisseurs", label: "Fournisseurs", icon: FournisseursIcon },
  { href: "/livreurs", label: "Livreurs", icon: LivreursIcon },
  { href: "/maintenance", label: "Maintenance", icon: MaintenanceServiceIcon },
  { href: "/coordinateurs", label: "Coordinateurs", icon: CoordinateursIcon },
  { href: "/finance", label: "Finance", icon: FinanceIcon },
  { href: "/reports", label: "Reports", icon: ReportsIcon },
];

export type SousElementSecondaire = {
  label: string;
  href: string;
};

export type GroupeSecondaire = {
  label: string;
  elements: SousElementSecondaire[];
};

export type SectionSecondaire = {
  titre: string;
  rechercheLabel: string;
  // Élément unique hors groupe, affiché en premier (ex. "Tableau de bord").
  racine: SousElementSecondaire;
  groupes: GroupeSecondaire[];
};

// Décision produit : tout ce qui relève de la relation Admin → Client
// (avantages, contenu, support) vit dans "Clients". Le catalogue produits
// vit dans "Operations" (décision PDG — hors du périmètre "Clients").
export const SECTIONS_SECONDAIRES: Record<string, SectionSecondaire> = {
  "/clients": {
    titre: "Centre clients",
    rechercheLabel: "Recherche centre clients",
    racine: { label: "Tableau de bord", href: "/clients" },
    groupes: [
      {
        label: "Gestion clients",
        elements: [
          { label: "Liste des clients", href: "/clients/liste" },
          { label: "Consultation", href: "/clients/consultation" },
          { label: "Fidélité", href: "/clients/fidelite" },
          { label: "Réclamations", href: "/clients/reclamations" },
        ],
      },
      {
        label: "Fonctionnalités clients",
        elements: [
          { label: "Privilèges", href: "/clients/privileges" },
          { label: "GarantiX", href: "/clients/garantix" },
          { label: "Tutos & Formations", href: "/clients/contenu" },
          { label: "Déclarations de panne", href: "/clients/declarations-panne" },
          { label: "Maintenance", href: "/clients/maintenance" },
          { label: "Assistance", href: "/clients/assistance" },
          { label: "Aide rapide (messagerie)", href: "/clients/aide-rapide" },
        ],
      },
    ],
  },
  "/operations": {
    titre: "Operations",
    rechercheLabel: "Recherche opérations",
    racine: { label: "Tableau de bord", href: "/operations" },
    groupes: [
      {
        label: "Catalogue",
        elements: [{ label: "Produits", href: "/operations/produits" }],
      },
    ],
  },
  // Miroir opérationnel de l'app Coordinateur — construit sous-espace par
  // sous-espace (catalogue, fournisseurs, livreurs, commerciaux, réclamations,
  // paiements viendront enrichir `groupes` au fil des prochains incréments).
  "/coordinateurs": {
    titre: "Espace Coordinateur",
    rechercheLabel: "Recherche espace coordinateur",
    racine: { label: "Tableau de bord", href: "/coordinateurs" },
    groupes: [],
  },
};
