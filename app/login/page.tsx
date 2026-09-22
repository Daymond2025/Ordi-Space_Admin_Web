"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { user, pret, demandeOtpUserId, login, verifierOtp, annulerOtp } = useAuth();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (pret && user) router.replace("/");
  }, [pret, user, router]);

  async function soumettreConnexion(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    try {
      await login(email, motDePasse);
    } catch (err) {
      setErreur(err instanceof ApiRequestError ? err.message : "Impossible de se connecter, réessayez.");
    } finally {
      setChargement(false);
    }
  }

  async function soumettreOtp(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    try {
      await verifierOtp(code);
      router.push("/");
    } catch (err) {
      setErreur(err instanceof ApiRequestError ? err.message : "Code invalide, réessayez.");
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

        {!demandeOtpUserId ? (
          <form onSubmit={soumettreConnexion} className="mt-8 flex flex-col gap-4">
            <h1 className="text-center text-sm font-semibold text-brand-muted">Connexion à l&apos;espace admin</h1>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-brand-muted">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border border-brand-line px-3.5 text-sm text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-brand-muted">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="h-11 rounded-xl border border-brand-line px-3.5 text-sm text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]"
              />
            </div>

            {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}

            <button
              type="submit"
              disabled={chargement}
              className="bg-gradient-brand-blue mt-2 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            >
              {chargement ? "Connexion…" : "Se connecter"}
            </button>

            <Link href="/login/mot-de-passe-oublie" className="text-center text-xs font-medium text-brand-muted underline underline-offset-2">
              Mot de passe oublié ?
            </Link>
          </form>
        ) : (
          <form onSubmit={soumettreOtp} className="mt-8 flex flex-col gap-4">
            <h1 className="text-center text-sm font-semibold text-brand-muted">
              Un code de vérification vous a été envoyé par e-mail
            </h1>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="text-xs font-medium text-brand-muted">
                Code de vérification
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 rounded-xl border border-brand-line px-3.5 text-center text-lg tracking-[0.4em] text-brand-ink outline-none focus:border-[color:var(--brand-blue-end)]"
              />
            </div>

            {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}

            <button
              type="submit"
              disabled={chargement}
              className="bg-gradient-brand-blue mt-2 flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            >
              {chargement ? "Vérification…" : "Vérifier"}
            </button>

            <button
              type="button"
              onClick={() => {
                annulerOtp();
                setCode("");
                setErreur(null);
              }}
              className="text-center text-xs font-medium text-brand-muted underline underline-offset-2"
            >
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
