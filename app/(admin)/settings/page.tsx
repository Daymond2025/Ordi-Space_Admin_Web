"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { estSuperAdmin, useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDate, LIBELLE_STATUT_COMPTE, STYLE_STATUT_COMPTE, type AdministrateurAdmin } from "@/lib/types";
import { NAV_ITEMS } from "@/lib/nav";
import { ModaleAdministrateur } from "@/components/ModaleAdministrateur";
import { PageHero } from "@/components/PageHero";
import { PencilIcon, PlusIcon, SettingsIcon, ShieldCheckIcon, UserAvatarIcon, UserPlusIcon } from "@/components/icons";

const ONGLETS = [
  { id: "compte", label: "Mon compte" },
  { id: "administrateurs", label: "Administrateurs" },
] as const;

type Onglet = (typeof ONGLETS)[number]["id"];

function initiales(nom: string, prenom: string | null): string {
  return `${prenom?.[0] ?? ""}${nom[0] ?? ""}`.toUpperCase() || "?";
}

function OngletMonCompte() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function seDeconnecter() {
    await logout();
    router.replace("/login");
  }

  const superAdmin = estSuperAdmin(user);

  return (
    <div className="rounded-3xl border border-brand-line bg-white p-7">
      <div className="flex items-center gap-4">
        <span className="bg-gradient-brand-blue flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-extrabold text-white">
          {user ? initiales(user.nom, user.prenom) : "?"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-brand-ink">
            {user?.prenom ? `${user.prenom} ${user.nom}` : user?.nom}
          </p>
          <p className="truncate text-sm text-brand-muted">{user?.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--brand-blue-end)]">
              {user?.type_utilisateur === "administrateur" ? (
                <>
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  {superAdmin ? "Super Admin" : "Admin"}
                </>
              ) : (
                user?.type_utilisateur
              )}
            </span>
          </div>
        </div>
      </div>

      {user?.type_utilisateur === "administrateur" && !superAdmin ? (
        <div className="mt-6 rounded-2xl bg-[#F7F9FC] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Espaces autorisés</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(user.espaces_autorises ?? []).length === 0 ? (
              <p className="text-xs text-brand-muted">Aucun espace accordé pour le moment.</p>
            ) : (
              NAV_ITEMS.filter((i) => i.espace && user.espaces_autorises?.includes(i.espace)).map((i) => (
                <span key={i.espace} className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-ink shadow-sm">
                  {i.label}
                </span>
              ))
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={seDeconnecter}
        className="mt-6 flex h-11 items-center justify-center rounded-xl bg-rose-50 px-5 text-sm font-semibold text-rose-600"
      >
        Se déconnecter
      </button>
    </div>
  );
}

function OngletAdministrateurs() {
  const { token, user } = useAuth();
  const [admins, setAdmins] = useState<AdministrateurAdmin[] | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [adminEdite, setAdminEdite] = useState<AdministrateurAdmin | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);
  const [erreur, setErreur] = useState(false);

  function recharger() {
    if (!token) return;
    apiFetch<AdministrateurAdmin[]>("/admin/administrateurs", { token })
      .then((data) => {
        setAdmins(data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }

  useEffect(recharger, [token]);

  async function basculerStatut(admin: AdministrateurAdmin) {
    if (!token) return;
    const nouveauStatut = admin.statut_compte === "actif" ? "desactive" : "actif";
    if (nouveauStatut === "desactive" && !confirm(`Désactiver le compte de ${admin.prenom ?? ""} ${admin.nom} ?`)) return;

    setEnCours(admin.id);
    try {
      await apiFetch(`/admin/utilisateurs/${admin.id}/statut`, { method: "PATCH", token, body: { statut_compte: nouveauStatut } });
      recharger();
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-muted">{admins?.length ?? "—"} compte(s) administrateur</p>
        <button
          type="button"
          onClick={() => {
            setAdminEdite(null);
            setModaleOuverte(true);
          }}
          className="bg-gradient-brand-blue flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
        >
          <PlusIcon className="h-4 w-4" />
          Nouvel administrateur
        </button>
      </div>

      {erreur ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-rose-600">Impossible de charger les administrateurs.</p>
          <button type="button" onClick={recharger} className="rounded-full border border-brand-line px-4 py-2 text-xs font-semibold text-brand-ink">
            Réessayer
          </button>
        </div>
      ) : admins === null ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {admins.map((admin) => {
            const superAdmin = admin.administrateur.est_super_admin;
            const soiMeme = admin.id === user?.id;

            return (
              <div key={admin.id} className="flex items-center gap-4 rounded-2xl border border-brand-line bg-white p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-sm font-bold text-brand-ink">
                  {initiales(admin.nom, admin.prenom)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-brand-ink">
                      {admin.prenom ? `${admin.prenom} ${admin.nom}` : admin.nom}
                      {soiMeme ? <span className="ml-1.5 text-xs font-normal text-brand-muted">(vous)</span> : null}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        superAdmin ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "bg-violet-50 text-violet-600"
                      }`}
                    >
                      {superAdmin ? <ShieldCheckIcon className="h-3 w-3" /> : null}
                      {superAdmin ? "Super Admin" : "Admin"}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STYLE_STATUT_COMPTE[admin.statut_compte]}`}>
                      {LIBELLE_STATUT_COMPTE[admin.statut_compte]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-brand-muted">
                    {admin.email} · Membre depuis {formaterDate(admin.created_at)}
                  </p>

                  {!superAdmin ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(admin.administrateur.espaces_autorises ?? []).length === 0 ? (
                        <span className="text-[11px] italic text-brand-muted">Aucun espace accordé</span>
                      ) : (
                        NAV_ITEMS.filter((i) => i.espace && admin.administrateur.espaces_autorises?.includes(i.espace)).map((i) => (
                          <span key={i.espace} className="rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
                            {i.label}
                          </span>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminEdite(admin);
                      setModaleOuverte(true);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-ink"
                    aria-label="Modifier"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {!soiMeme ? (
                    <button
                      type="button"
                      onClick={() => basculerStatut(admin)}
                      disabled={enCours === admin.id}
                      className={`rounded-full px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                        admin.statut_compte === "actif" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {admin.statut_compte === "actif" ? "Désactiver" : "Réactiver"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modaleOuverte && token ? (
        <ModaleAdministrateur
          admin={adminEdite}
          token={token}
          onClose={() => setModaleOuverte(false)}
          onEnregistre={() => {
            setModaleOuverte(false);
            recharger();
          }}
        />
      ) : null}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [onglet, setOnglet] = useState<Onglet>("compte");
  const superAdmin = estSuperAdmin(user);
  const ongletsVisibles = ONGLETS.filter((o) => o.id !== "administrateurs" || superAdmin);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Paramètres"
        description="Votre compte et, si vous êtes super-admin, la gestion des autres administrateurs."
        icone={SettingsIcon}
      />

      {ongletsVisibles.length > 1 ? (
        <div className="flex gap-2">
          {ongletsVisibles.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOnglet(o.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                onglet === o.id ? "bg-brand-ink text-white" : "border border-brand-line bg-white text-brand-muted"
              }`}
            >
              {o.id === "administrateurs" ? <UserPlusIcon className="h-4 w-4" /> : <UserAvatarIcon className="h-4 w-4" />}
              {o.label}
            </button>
          ))}
        </div>
      ) : null}

      {onglet === "compte" || !superAdmin ? <OngletMonCompte /> : <OngletAdministrateurs />}
    </div>
  );
}
