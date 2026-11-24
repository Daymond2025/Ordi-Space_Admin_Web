// Thème des écrans de connexion/inscription de cette app (kit
// d'authentification : CadreAuth, MascotteVivante, DecorAuth…). Chaque app a
// le sien : couleurs, décor animé, accessoire de la mascotte et répliques.

export type ThemeAuth = {
  espace: string;
  slogan: string;
  degrade: string;
  halos: [string, string, string];
  accent: string;
  accentFin: string;
  accentHalo: string;
  accentOmbre: string;
  decor: "constellation" | "etincelles" | "colis" | "route" | "etiquettes" | "engrenages" | "bulles" | "radar";
  posture: "flotte" | "roule";
  accessoire: "aucun" | "engrenage" | "logo" | "radar" | "etoile" | "coeur" | "colis" | "casque";
  logo?: string;
  confettis: string[];
  badge: string;
  repliques: {
    salut: string;
    repos: string;
    telephone: string;
    telephoneOk: string;
    email: string;
    emailOk: string;
    mdp: string;
    erreur: string;
    code: string;
    succes: string;
    nom: string;
  };
};

export const THEME_AUTH: ThemeAuth = {
  "espace": "Admin",
  "slogan": "L'œil central d'Ordi'Space : utilisateurs, commandes, finances et SAV.",
  "degrade": "linear-gradient(160deg,#020617 0%,#0f2a6b 50%,#0369a1 100%)",
  "halos": [
    "rgba(56,189,248,0.25)",
    "rgba(99,102,241,0.3)",
    "rgba(255,255,255,0.08)"
  ],
  "accent": "#2563eb",
  "accentFin": "#06b6d4",
  "accentHalo": "rgba(37,99,235,0.18)",
  "accentOmbre": "rgba(37,99,235,0.4)",
  "decor": "radar",
  "posture": "flotte",
  "accessoire": "radar",
  "confettis": [
    "#2563eb",
    "#06b6d4",
    "#a5f3fc",
    "#ffffff",
    "#facc15"
  ],
  "badge": "Accès réservé · vérification en 2 étapes",
  "repliques": {
    "telephone": "Ton numéro WhatsApp 📱",
    "telephoneOk": "Parfait, je t'envoie le code 🚀",
    "email": "Ton adresse e-mail 📧",
    "emailOk": "Cet e-mail me va ✅",
    "mdp": "Je ne regarde pas 🙈",
    "code": "Regarde tes e-mails 📩",
    "salut": "Tableau de bord prêt ? 🛰️",
    "repos": "Tout est sous contrôle ? 🧭",
    "erreur": "Oups… accès refusé 😅",
    "succes": "Bienvenue aux commandes ! 🎉",
    "nom": "Comment tu t'appelles ? ✍️"
  }
};
