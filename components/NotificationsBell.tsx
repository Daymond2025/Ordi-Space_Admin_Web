"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterDateHeure, LIEN_TYPE_NOTIFICATION, type NotificationAdmin, type Pagination } from "@/lib/types";
import { BellIcon } from "./icons";

const INTERVALLE_RAFRAICHISSEMENT_MS = 30_000;

/**
 * L'admin est "l'œil central" du système — reçoit ici toutes les infos
 * entrantes significatives (NotificationAdminService côté backend : produit
 * à valider, réclamation, panne déclarée, retrait demandé…), via le même
 * GET/PATCH /moi/notifications que n'importe quel rôle (MoiController).
 */
export function NotificationsBell() {
  const { token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationAdmin[] | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  function charger() {
    if (!token) return;
    apiFetch<Pagination<NotificationAdmin>>("/moi/notifications?per_page=20", { token }).then((page) => setNotifications(page.data));
  }

  useEffect(charger, [token]);

  useEffect(() => {
    if (!token) return;
    const minuteur = setInterval(charger, INTERVALLE_RAFRAICHISSEMENT_MS);
    return () => clearInterval(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [ouvert]);

  async function ouvrir(notification: NotificationAdmin) {
    setOuvert(false);
    if (!notification.lu && token) {
      apiFetch(`/moi/notifications/${notification.id}/lue`, { method: "PATCH", token }).catch(() => {});
      setNotifications((liste) => liste?.map((n) => (n.id === notification.id ? { ...n, lu: true } : n)) ?? null);
    }
    const lien = LIEN_TYPE_NOTIFICATION[notification.type_notification];
    if (lien) router.push(lien);
  }

  const nonLues = notifications?.filter((n) => !n.lu).length ?? 0;

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white"
      >
        <BellIcon className="h-5 w-5 text-amber-500" />
        {nonLues > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {nonLues > 9 ? "9+" : nonLues}
          </span>
        ) : null}
      </button>

      {ouvert ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-96 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-brand-line px-4 py-3">
            <p className="text-sm font-bold text-brand-ink">Notifications</p>
            {nonLues > 0 ? <span className="text-xs font-semibold text-rose-500">{nonLues} non lue{nonLues > 1 ? "s" : ""}</span> : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications === null ? (
              <p className="py-8 text-center text-sm text-brand-muted">Chargement…</p>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-brand-muted">Aucune notification pour l&apos;instant.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => ouvrir(notification)}
                  className={`flex w-full flex-col gap-0.5 border-b border-brand-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#F7F9FC] ${
                    notification.lu ? "" : "bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!notification.lu ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand-blue-end)]" /> : null}
                    <p className="truncate text-sm font-bold text-brand-ink">{notification.titre}</p>
                  </div>
                  <p className="line-clamp-2 text-xs text-brand-muted">{notification.contenu}</p>
                  <p className="text-[11px] text-brand-muted">{formaterDateHeure(notification.date_envoi)}</p>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="block w-full border-t border-brand-line px-4 py-2.5 text-center text-xs font-semibold text-brand-muted"
          >
            Fermer
          </button>
        </div>
      ) : null}
    </div>
  );
}
