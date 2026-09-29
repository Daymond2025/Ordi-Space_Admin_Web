import { redirect } from "next/navigation";

/**
 * L'écran "Maintenance" (nav principale) réutilise l'écran SAV déjà construit
 * sous /clients/declarations-panne — pas de nouvelle implémentation : ce
 * stub redirige simplement vers la source unique, pour éviter deux parcours
 * différents pour la même donnée (voir lib/nav.ts, section "/clients").
 */
export default function MaintenancePage() {
  redirect("/clients/declarations-panne");
}
