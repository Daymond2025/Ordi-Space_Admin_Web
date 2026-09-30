"use client";

import { useState } from "react";
import { ApiRequestError, apiFetch } from "@/lib/api";
import type { AdministrateurAdmin } from "@/lib/types";
import { NAV_ITEMS } from "@/lib/nav";
import { ShieldCheckIcon, XIcon } from "@/components/icons";

const CHAMP = "h-11 rounded-xl border border-brand-line px-3 text-sm";
const ESPACES_COCHABLES = NAV_ITEMS.filter((i) => i.espace);

/**
 * Création ou édition d'un compte admin — réservé au super-admin (le bouton
 * qui ouvre ce modal n'est lui-même rendu que si estSuperAdmin(user), mais
 * l'API revérifie de toute façon, cf. AdministrateurController). Le rôle
 * choisi ici est le palier super-admin/admin (Administrateur::est_super_admin),
 * distinct du rôle Spatie "administrateur" que les deux paliers partagent.
 */
export function ModaleAdministrateur({
  admin,
  token,
  onClose,
  onEnregistre,
}: {
  admin: AdministrateurAdmin | null;
  token: string;
  onClose: () => void;
  onEnregistre: () => void;
}) {
  const edition = admin !== null;
  const [nom, setNom] = useState(admin?.nom ?? "");
  const [prenom, setPrenom] = useState(admin?.prenom ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [telephone, setTelephone] = useState(admin?.telephone ?? "");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState<"super_admin" | "admin">(admin?.administrateur.est_super_admin === false ? "admin" : "super_admin");
  const [espaces, setEspaces] = useState<string[]>(admin?.administrateur.espaces_autorises ?? []);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const pretAEnvoyer =
    (edition || (nom.trim() && email.trim() && motDePasse.trim())) &&
    (edition ? nom.trim() !== "" && email.trim() !== "" : true) &&
    (role === "super_admin" || espaces.length > 0);

  function basculerEspace(valeur: string) {
    setEspaces((prev) => (prev.includes(valeur) ? prev.filter((e) => e !== valeur) : [...prev, valeur]));
  }

  async function enregistrer() {
    setErreur(null);
    setEnCours(true);
    try {
      const body = {
        nom: nom.trim(),
        prenom: prenom.trim() || null,
        email: email.trim(),
        telephone: telephone.trim() || null,
        ...(motDePasse.trim() ? { password: motDePasse.trim() } : {}),
        role,
        espaces: role === "admin" ? espaces : [],
      };

      if (edition) {
        await apiFetch(`/admin/administrateurs/${admin.id}`, { method: "PATCH", token, body });
      } else {
        await apiFetch("/admin/administrateurs", { method: "POST", token, body: { ...body, password: motDePasse.trim() } });
      }
      onEnregistre();
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer cet administrateur.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-ink">{edition ? "Modifier l'administrateur" : "Nouvel administrateur"}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {erreur ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{erreur}</p> : null}

        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className={CHAMP} />
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom (optionnel)" className={CHAMP} />
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className={CHAMP} />
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone (optionnel)" className={CHAMP} />
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder={edition ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe (8 car. min, majuscule + chiffre)"}
            className={CHAMP}
          />
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Rôle</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("super_admin")}
              className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-colors ${
                role === "super_admin" ? "border-[color:var(--brand-blue-end)] bg-blue-50" : "border-brand-line"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold text-brand-ink">
                <ShieldCheckIcon className="h-4 w-4 text-[color:var(--brand-blue-end)]" /> Super Admin
              </span>
              <span className="text-[11px] text-brand-muted">Accès total à tous les espaces.</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-3 text-left transition-colors ${
                role === "admin" ? "border-[color:var(--brand-blue-end)] bg-blue-50" : "border-brand-line"
              }`}
            >
              <span className="text-sm font-bold text-brand-ink">Admin</span>
              <span className="text-[11px] text-brand-muted">Accès limité aux espaces cochés ci-dessous.</span>
            </button>
          </div>
        </div>

        {role === "admin" ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Espaces autorisés</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ESPACES_COCHABLES.map((item) => {
                const Icon = item.icon;
                const coche = espaces.includes(item.espace!);
                return (
                  <button
                    key={item.espace}
                    type="button"
                    onClick={() => basculerEspace(item.espace!)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      coche ? "border-[color:var(--brand-blue-end)] bg-blue-50 text-[color:var(--brand-blue-end)]" : "border-brand-line text-brand-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            {role === "admin" && espaces.length === 0 ? (
              <p className="mt-2 text-[11px] text-amber-600">Sélectionnez au moins un espace.</p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours || !pretAEnvoyer}
          className="bg-gradient-brand-blue mt-5 flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : edition ? "Enregistrer les modifications" : "Créer l'administrateur"}
        </button>
      </div>
    </div>
  );
}
