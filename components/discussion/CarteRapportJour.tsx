import { TriangleAlerteIcon } from "@/components/icons";
import type { DonneesRapport } from "@/lib/types";

const LIGNES: { cle: keyof Omit<DonneesRapport, "date">; label: string; sousTexte?: string; classe: string }[] = [
  { cle: "envoyees", label: "Commandes envoyées", classe: "border-[color:var(--brand-blue-end)] bg-blue-50 text-[color:var(--brand-blue-end)]" },
  { cle: "validees", label: "Commandes validées", classe: "border-emerald-500 bg-emerald-50 text-emerald-600" },
  { cle: "reportees", label: "Commandes reportées", classe: "border-orange-400 bg-orange-50 text-orange-500" },
  { cle: "non_livre", label: "Commandes non livrées", sousTexte: "Livraison prévue demain", classe: "border-slate-400 bg-slate-100 text-slate-500" },
  { cle: "annulees", label: "Commandes annulées", classe: "border-rose-400 bg-rose-50 text-rose-500" },
];

function formaterDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

/** Rapport quotidien enrichi (5 compteurs) généré automatiquement pour le fil de discussion produit. */
export function CarteRapportJour({ donnees }: { donnees: DonneesRapport }) {
  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-900/5">
      <div className="bg-gradient-brand-blue px-4 py-3 text-center text-white">
        <p className="text-sm font-extrabold uppercase tracking-wide">Rapport du jour</p>
        <p className="text-xs capitalize text-white/85">{formaterDate(donnees.date)}</p>
      </div>

      <div className="space-y-2.5 px-5 py-4">
        {LIGNES.map(({ cle, label, sousTexte, classe }) => (
          <div key={cle} className="flex h-11 items-center gap-2.5 rounded-lg bg-[#F6F8FE] px-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-extrabold ${classe}`}>
              {donnees[cle]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-brand-ink">{label}</span>
              {sousTexte ? <span className="block truncate text-[11px] font-semibold text-[color:var(--brand-blue-end)]">{sousTexte}</span> : null}
            </span>
          </div>
        ))}

        <div className="flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2.5">
          <TriangleAlerteIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
          <p className="text-xs text-orange-800">
            Retrouvez les motifs et plus de détails sous chaque commande. Contactez vos clients pour ne pas les perdre.
          </p>
        </div>
      </div>
    </div>
  );
}
