"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";

// Doit correspondre à OTP_LONGUEUR côté backend (app/Helpers/const.php) —
// même code à 6 chiffres que la connexion à deux facteurs, colonnes distinctes.
const LONGUEUR_CODE = 6;

type Etape = "email" | "code" | "confirmation";

const CHAMP = "h-11 rounded-xl border border-brand-line px-3.5 text-sm text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]";
const LABEL = "text-xs font-medium text-brand-muted";

/**
 * "Mot de passe oublié" — POST /auth/mot-de-passe/oublie puis
 * /auth/mot-de-passe/reinitialiser. Toujours le même message de succès à
 * l'étape 1, qu'un compte existe ou non pour cette adresse (le backend ne le
 * révèle jamais).
 */
export default function MotDePasseOubliePage() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onDemanderCode(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await apiFetch("/auth/mot-de-passe/oublie", { method: "POST", body: { email: email.trim() } });
      setEtape("code");
    } catch (err) {
      setErreur(err instanceof ApiRequestError ? err.message : "Impossible d'envoyer le code, réessayez.");
    } finally {
      setChargement(false);
    }
  }

  async function onReinitialiser(e: FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (motDePasse !== confirmationMotDePasse) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    try {
      await apiFetch("/auth/mot-de-passe/reinitialiser", {
        method: "POST",
        body: { email: email.trim(), code, password: motDePasse, password_confirmation: confirmationMotDePasse },
      });
      setEtape("confirmation");
    } catch (err) {
      setErreur(err instanceof ApiRequestError ? err.message : "Impossible de réinitialiser le mot de passe, réessayez.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="bg-gradient-brand-blue flex min-h-screen w-full items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <p className="text-xs font-semibold text-brand-ink">Admin</p>
          <p className="text-3xl font-extrabold text-[color:var(--brand-blue-end)]">Ordi&apos;Space</p>
        </div>

        {etape === "email" ? (
          <form onSubmit={onDemanderCode} className="mt-8 flex flex-col gap-4">
            <h1 className="text-center text-sm font-semibold text-brand-muted">Mot de passe oublié</h1>
            <p className="text-center text-xs text-brand-muted">On t&apos;envoie un code à 6 chiffres par e-mail.</p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={LABEL}>
                Adresse e-mail
              </label>
              <input id="email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={CHAMP} />
            </div>

            {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}

            <button type="submit" disabled={chargement} className="bg-gradient-brand-blue mt-2 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60">
              {chargement ? "Envoi…" : "Envoyer le code"}
            </button>

            <Link href="/login" className="text-center text-xs font-medium text-brand-muted underline underline-offset-2">
              Retour à la connexion
            </Link>
          </form>
        ) : etape === "code" ? (
          <form onSubmit={onReinitialiser} className="mt-8 flex flex-col gap-4">
            <h1 className="text-center text-sm font-semibold text-brand-muted">
              Code envoyé à <span className="font-bold text-brand-ink">{email}</span>
            </h1>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className={LABEL}>
                Code de vérification
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                autoFocus
                maxLength={LONGUEUR_CODE}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${CHAMP} text-center text-lg tracking-[0.4em]`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className={LABEL}>
                Nouveau mot de passe
              </label>
              <input id="password" type="password" required value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} className={CHAMP} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password_confirmation" className={LABEL}>
                Confirmer le mot de passe
              </label>
              <input
                id="password_confirmation"
                type="password"
                required
                value={confirmationMotDePasse}
                onChange={(e) => setConfirmationMotDePasse(e.target.value)}
                className={CHAMP}
              />
            </div>

            {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}

            <button
              type="submit"
              disabled={chargement || code.length < LONGUEUR_CODE}
              className="bg-gradient-brand-blue mt-2 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            >
              {chargement ? "Validation…" : "Valider"}
            </button>

            <button type="button" onClick={onDemanderCode} disabled={chargement} className="text-center text-xs font-medium text-brand-muted underline underline-offset-2 disabled:opacity-60">
              Renvoyer le code
            </button>
          </form>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-4">
            <h1 className="text-center text-sm font-semibold text-brand-muted">Mot de passe mis à jour</h1>
            <p className="text-center text-xs text-brand-muted">Connecte-toi avec ton nouveau mot de passe.</p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="bg-gradient-brand-blue flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white"
            >
              Se connecter
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
