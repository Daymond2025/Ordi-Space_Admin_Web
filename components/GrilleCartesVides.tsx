// Grille de cartes vides — structure du dashboard reprise à l'identique du
// mockup, en attendant le contenu réel (KPIs, listes…) de chaque entité.
export function GrilleCartesVides() {
  return (
    <div className="grid grid-cols-3 gap-5">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="h-[160px] rounded-2xl border border-brand-line bg-white" />
      ))}
      <div className="col-span-3 h-[340px] rounded-2xl border border-brand-line bg-white" />
    </div>
  );
}
