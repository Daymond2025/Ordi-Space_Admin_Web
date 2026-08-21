"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function seDeconnecter() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-brand-line bg-white p-6">
        <p className="text-sm text-brand-muted">Connecté en tant que</p>
        <p className="mt-1 text-lg font-bold text-brand-ink">
          {user?.prenom ? `${user.prenom} ${user.nom}` : user?.nom} <span className="text-sm font-normal text-brand-muted">({user?.email})</span>
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-brand-muted">{user?.type_utilisateur}</p>

        <button
          type="button"
          onClick={seDeconnecter}
          className="mt-5 flex h-10 items-center justify-center rounded-xl bg-rose-50 px-5 text-sm font-semibold text-rose-600"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
