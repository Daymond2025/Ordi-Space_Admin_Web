import type { ComponentType, ReactNode, SVGProps } from "react";

export type StatPageHero = { valeur: string | number; label: string };

export function PageHero({
  titre,
  description,
  action,
  stats,
  icone: Icone,
}: {
  titre: string;
  description?: string;
  action?: ReactNode;
  stats?: StatPageHero[];
  icone?: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="bg-gradient-brand-blue relative overflow-hidden rounded-3xl px-7 pb-6 pt-7">
      {Icone ? <Icone className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-white/10" /> : null}

      <div className="relative flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-white">{titre}</h1>
        {action}
      </div>
      {description ? <p className="relative mt-1.5 text-sm text-white/80">{description}</p> : null}

      {stats && stats.length > 0 ? (
        <div className="relative mt-6 flex gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-xl font-extrabold text-white">{s.valeur}</p>
              <p className="text-[11px] font-medium text-white/80">{s.label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
