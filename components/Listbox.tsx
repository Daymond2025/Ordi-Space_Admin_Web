"use client";

import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

export type ListboxOption = {
  value: string;
  label: string;
  description?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export function Listbox({
  value,
  onChange,
  options,
  placeholder = "Choisir…",
  wrapperClassName = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: ListboxOption[];
  placeholder?: string;
  wrapperClassName?: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [monte, setMonte] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) {
      setMonte(false);
      return;
    }

    const frame = requestAnimationFrame(() => setMonte(true));

    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }

    document.addEventListener("mousedown", surClicExterieur);
    document.addEventListener("keydown", surTouche);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", surClicExterieur);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  const selectionne = options.find((o) => o.value === value);
  const IconeSelectionnee = selectionne?.icon;

  return (
    <div ref={conteneurRef} className={`relative ${wrapperClassName}`}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className={`flex h-11 w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 text-left text-sm transition-colors ${
          ouvert ? "border-[color:var(--brand-blue-end)] ring-2 ring-[color:var(--brand-blue-end)]/15" : "border-brand-line hover:border-brand-ink/30"
        }`}
      >
        {IconeSelectionnee ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[color:var(--brand-blue-end)]">
            <IconeSelectionnee className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <span className={`flex-1 truncate ${selectionne ? "text-brand-ink" : "text-brand-muted"}`}>{selectionne?.label ?? placeholder}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-brand-muted transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`} />
      </button>

      {ouvert ? (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+6px)] z-30 origin-top overflow-hidden rounded-2xl border border-brand-line bg-white p-1.5 shadow-xl transition-all duration-150 ${
            monte ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => {
              const OptionIcone = option.icon;
              const actif = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOuvert(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    actif ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "text-brand-ink hover:bg-[#F5F7FA]"
                  }`}
                >
                  {OptionIcone ? (
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${actif ? "bg-white text-[color:var(--brand-blue-end)]" : "bg-[#EEF1F6] text-brand-muted"}`}>
                      <OptionIcone className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? <span className="block truncate text-xs font-normal text-brand-muted">{option.description}</span> : null}
                  </span>
                  {actif ? <CheckIcon className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
            {options.length === 0 ? <p className="px-3 py-2.5 text-sm text-brand-muted">Aucune option.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
