import { formaterMontant, type DonneesPropositionPrix } from "@/lib/types";

/** Instantané {prix_liste, prix_propose} publié au démarrage d'une négociation de prix (coordinateur/admin → fournisseur). */
export function CartePropositionPrix({ donnees }: { donnees: DonneesPropositionPrix }) {
  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-sm shadow-slate-900/5">
      <div className="bg-gradient-brand-blue px-4 py-3 text-center text-white">
        <p className="text-sm font-extrabold uppercase tracking-wide">Négociation de prix</p>
      </div>

      <div className="space-y-2.5 px-5 py-4">
        <div className="rounded-xl bg-[#F6F8FE] px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">Prix partenaire affiché</p>
          <p className="text-base font-extrabold text-[color:var(--brand-blue-end)]">{formaterMontant(donnees.prix_liste)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3.5 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Proposition du coordinateur/admin</p>
          <p className="text-base font-extrabold text-emerald-700">{formaterMontant(donnees.prix_propose)}</p>
        </div>
      </div>
    </div>
  );
}
