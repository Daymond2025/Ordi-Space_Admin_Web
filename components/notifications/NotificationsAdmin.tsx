"use client";

import type { ReactNode } from "react";
import { NotificationsProvider } from "@/components/notifications/Notifications";
import { LIEN_TYPE_NOTIFICATION } from "@/lib/types";

/** Notifications de l'Admin : un bandeau sans lien ouvre l'écran associé à son type. */
export function NotificationsAdmin({ children }: { children: ReactNode }) {
  return <NotificationsProvider resoudreLien={(n) => LIEN_TYPE_NOTIFICATION[n.type_notification]}>{children}</NotificationsProvider>;
}
