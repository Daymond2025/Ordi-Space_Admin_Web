"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";

export type Utilisateur = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  type_utilisateur: string;
  roles: string[];
  permissions: string[];
};

type SessionResult = { user: Utilisateur; token: string };

type AuthContextValue = {
  user: Utilisateur | null;
  token: string | null;
  pret: boolean;
  demandeOtpUserId: number | null;
  login: (email: string, password: string) => Promise<void>;
  verifierOtp: (code: string) => Promise<void>;
  annulerOtp: () => void;
  logout: () => Promise<void>;
};

const STOCKAGE_CLE = "ordispace.admin.session";
const NOM_APPAREIL = "admin-web";
const ROLES_AUTORISES = ["coordinateur", "administrateur"];

const AuthContext = createContext<AuthContextValue | null>(null);

function accesRefuseSiRoleInvalide(user: Utilisateur) {
  if (!ROLES_AUTORISES.includes(user.type_utilisateur)) {
    throw new ApiRequestError(
      { code: "ACCES_REFUSE", message: "Ce compte n'a pas accès à l'espace admin." },
      403
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pret, setPret] = useState(false);
  const [demandeOtpUserId, setDemandeOtpUserId] = useState<number | null>(null);

  useEffect(() => {
    const brut = localStorage.getItem(STOCKAGE_CLE);
    if (brut) {
      try {
        const session = JSON.parse(brut) as SessionResult;
        setUser(session.user);
        setToken(session.token);
      } catch {
        localStorage.removeItem(STOCKAGE_CLE);
      }
    }
    setPret(true);
  }, []);

  function memoriser(session: SessionResult) {
    setUser(session.user);
    setToken(session.token);
    setDemandeOtpUserId(null);
    localStorage.setItem(STOCKAGE_CLE, JSON.stringify(session));
  }

  async function login(email: string, password: string) {
    const reponse = await apiFetch<SessionResult | { requires_2fa: true; user_id: number }>("/auth/login", {
      method: "POST",
      body: { email, password, device_name: NOM_APPAREIL },
    });

    if ("requires_2fa" in reponse) {
      setDemandeOtpUserId(reponse.user_id);
      return;
    }

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  async function verifierOtp(code: string) {
    if (!demandeOtpUserId) return;

    const reponse = await apiFetch<SessionResult>("/auth/verify-otp", {
      method: "POST",
      body: { user_id: demandeOtpUserId, code, device_name: NOM_APPAREIL },
    });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  function annulerOtp() {
    setDemandeOtpUserId(null);
  }

  async function logout() {
    if (token) {
      await apiFetch("/auth/logout", { method: "POST", token }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    setDemandeOtpUserId(null);
    localStorage.removeItem(STOCKAGE_CLE);
  }

  return (
    <AuthContext.Provider value={{ user, token, pret, demandeOtpUserId, login, verifierOtp, annulerOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé sous <AuthProvider>.");
  return context;
}
