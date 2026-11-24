"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";
import { CadreAuth, salutation } from "@/components/auth/kit/CadreAuth";
import { ChampFlottant, IconeCadenas, IconeEnveloppe } from "@/components/auth/kit/ChampFlottant";
import { SaisieCodeOtp } from "@/components/auth/kit/SaisieCodeOtp";
import { BadgeSecurite, BoutonAuth, BoutonRetour, MessageErreur } from "@/components/auth/kit/BoutonAuth";
import type { HumeurMascotte } from "@/components/auth/kit/MascotteVivante";
import { THEME_AUTH } from "@/components/auth/kit/themeAuth";

// Doit correspondre à OTP_LONGUEUR côté backend (app/Helpers/const.php).
const LONGUEUR_CODE = 6;
const DELAI_RENVOI_S = 60;
const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Connexion Admin : e-mail + mot de passe, puis code reçu par e-mail (2FA
 * obligatoire pour ce rôle). Décor « radar » propre à l'Admin (themeAuth.ts).
 */
export default function LoginPage() {
  const { user, pret, demandeOtpUserId, login, verifierOtp, annulerOtp } = useAuth();
  const router = useRouter();
  const r = THEME_AUTH.repliques;

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [compteurErreurs, setCompteurErreurs] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [focus, setFocus] = useState<"email" | "mdp" | null>(null);
  const [accueil, setAccueil] = useState(true);
  const [tentative, setTentative] = useState(false);
  const [renvoiDans, setRenvoiDans] = useState(DELAI_RENVOI_S);
  const [codeRenvoye, setCodeRenvoye] = useState(false);

  const succes = pret && Boolean(user) && tentative;
  const etapeCode = Boolean(demandeOtpUserId) && !succes;
  const emailValide = FORMAT_EMAIL.test(email.trim());

  useEffect(() => {
    if (!pret || !user) return;
    if (!tentative) {
      router.replace("/");
      return;
    }
    const t = setTimeout(() => router.replace("/"), 1600);
    return () => clearTimeout(t);
  }, [pret, user, tentative, router]);

  useEffect(() => {
    const t = setTimeout(() => setAccueil(false), 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!etapeCode || renvoiDans <= 0) return;
    const t = setTimeout(() => setRenvoiDans((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [etapeCode, renvoiDans]);

  function signalerErreur(e: unknown, parDefaut: string) {
    setErreur(e instanceof ApiRequestError ? e.message : parDefaut);
    setCompteurErreurs((n) => n + 1);
    navigator.vibrate?.(120);
  }

  async function onSoumettreConnexion(event: FormEvent) {
    event.preventDefault();
    setErreur(null);

    if (!email.trim() || !motDePasse) {
      setErreur("Entre ton e-mail et ton mot de passe.");
      setCompteurErreurs((n) => n + 1);
      return;
    }

    setChargement(true);
    setTentative(true);
    try {
      await login(email.trim(), motDePasse);
      setRenvoiDans(DELAI_RENVOI_S);
      setCodeRenvoye(false);
    } catch (e) {
      setTentative(false);
      signalerErreur(e, "Impossible de se connecter. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  async function validerCode(valeur = code) {
    if (valeur.length < LONGUEUR_CODE || chargement) return;

    setErreur(null);
    setChargement(true);
    try {
      await verifierOtp(valeur);
    } catch (e) {
      setCode("");
      signalerErreur(e, "Impossible de vérifier ce code. Vérifiez votre connexion internet.");
    } finally {
      setChargement(false);
    }
  }

  async function renvoyerCode() {
    if (renvoiDans > 0 || chargement) return;
    setErreur(null);
    setChargement(true);
    try {
      // Se reconnecter renvoie un nouveau code par e-mail.
      await login(email.trim(), motDePasse);
      setCode("");
      setRenvoiDans(DELAI_RENVOI_S);
      setCodeRenvoye(true);
    } catch (e) {
      signalerErreur(e, "Impossible de renvoyer le code.");
    } finally {
      setChargement(false);
    }
  }

  function retourConnexion() {
    annulerOtp();
    setCode("");
    setErreur(null);
    setTentative(false);
  }

  let humeur: HumeurMascotte = "repos";
  let bulle = r.repos;
  if (succes) {
    humeur = "succes";
    bulle = r.succes;
  } else if (erreur) {
    humeur = "erreur";
    bulle = r.erreur;
  } else if (etapeCode) {
    humeur = "code";
    bulle = codeRenvoye ? "Nouveau code envoyé ! 📩" : "Regarde tes e-mails 📩";
  } else if (focus === "mdp") {
    humeur = "mdp";
    bulle = r.mdp;
  } else if (focus === "email") {
    humeur = "saisie";
    bulle = emailValide ? r.emailOk : r.email;
  } else if (accueil) {
    humeur = "salut";
    bulle = `${salutation()} ! ${r.salut}`;
  }

  return (
    <CadreAuth humeur={humeur} bulle={bulle} declencheur={compteurErreurs} succes={succes}>
      {etapeCode ? (
        <>
          <BoutonRetour onClick={retourConnexion} label="Retour à la connexion" />

          <h2 className="mt-3 text-2xl font-black text-slate-900">Vérification</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Saisis le code à {LONGUEUR_CODE} chiffres envoyé à{" "}
            <span className="font-bold text-[var(--auth-accent)]">{email.trim() || "ton e-mail"}</span>.
          </p>

          <div className="mt-7">
            <SaisieCodeOtp longueur={LONGUEUR_CODE} valeur={code} onChange={setCode} onComplet={validerCode} moderne autoFocus />
          </div>

          <MessageErreur erreur={erreur} />

          <BoutonAuth type="button" onClick={() => validerCode()} disabled={code.length < LONGUEUR_CODE} chargement={chargement} succes={succes} className="mt-8">
            Valider le code
          </BoutonAuth>

          <p className="mt-5 text-center text-sm text-slate-500">
            Pas reçu ?{" "}
            {renvoiDans > 0 ? (
              <span className="font-semibold tabular-nums text-slate-400">Renvoyer dans {renvoiDans} s</span>
            ) : (
              <button type="button" onClick={renvoyerCode} className="font-bold text-[var(--auth-accent)] underline-offset-2 hover:underline">
                Renvoyer le code
              </button>
            )}
          </p>
        </>
      ) : (
        <form onSubmit={onSoumettreConnexion} className="flex flex-1 flex-col" noValidate>
          <h2 className="text-2xl font-black text-slate-900">Connexion</h2>
          <p className="mt-1.5 text-sm text-slate-500">Accès réservé à l&apos;équipe Ordi&apos;Space.</p>

          <div className="mt-7 flex flex-col gap-4">
            <ChampFlottant
              type="email"
              label="Adresse e-mail"
              value={email}
              onChange={(v) => {
                setEmail(v);
                setErreur(null);
              }}
              icone={<IconeEnveloppe />}
              valide={emailValide}
              enErreur={Boolean(erreur) && !email.trim()}
              declencheurErreur={compteurErreurs}
              autoComplete="email"
              onFocus={() => setFocus("email")}
              onBlur={() => setFocus(null)}
            />
            <ChampFlottant
              type="password"
              label="Mot de passe"
              value={motDePasse}
              onChange={(v) => {
                setMotDePasse(v);
                setErreur(null);
              }}
              icone={<IconeCadenas />}
              enErreur={Boolean(erreur)}
              declencheurErreur={compteurErreurs}
              autoComplete="current-password"
              onFocus={() => setFocus("mdp")}
              onBlur={() => setFocus(null)}
            />
          </div>

          <MessageErreur erreur={erreur} />

          <Link href="/login/mot-de-passe-oublie" className="mt-3 self-end text-xs font-bold text-[var(--auth-accent)] underline-offset-2 hover:underline">
            Mot de passe oublié ?
          </Link>

          <div className="min-h-6 flex-1" />

          <BoutonAuth type="submit" chargement={chargement} succes={succes} className="mt-8">
            Se connecter
          </BoutonAuth>

          <BadgeSecurite texte={THEME_AUTH.badge} />
        </form>
      )}
    </CadreAuth>
  );
}
