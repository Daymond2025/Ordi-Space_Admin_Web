"use client";

import { useRouter } from "next/navigation";
import { useState, type ComponentType, type FormEvent, type SVGProps } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { formaterPrix, LIBELLE_TYPE_PRIVILEGE, type Privilege, type TypePrivilege } from "@/lib/types";
import { CashIcon, ChevronLeftIcon, GiftIconOutline, LivreursIcon, PercentIcon } from "@/components/icons";

const CODE_REQUIS: TypePrivilege[] = ["remise_pourcentage", "remise_montant"];
const VALEUR_REQUISE: TypePrivilege[] = ["remise_pourcentage", "remise_montant", "parrainage"];

const ICONE_TYPE: Record<TypePrivilege, ComponentType<SVGProps<SVGSVGElement>>> = {
  remise_pourcentage: PercentIcon,
  remise_montant: CashIcon,
  livraison_gratuite: LivreursIcon,
  parrainage: GiftIconOutline,
};

const DEGRADES_PREDEFINIS: { debut: string; fin: string }[] = [
  { debut: "#0077FF", fin: "#00BFFF" },
  { debut: "#FF9D00", fin: "#FF7800" },
  { debut: "#A6FF00", fin: "#007126" },
  { debut: "#FF00DD", fin: "#71004F" },
  { debut: "#7C3AED", fin: "#C026D3" },
];

export function PrivilegeForm({ existant }: { existant?: Privilege }) {
  const router = useRouter();
  const { token } = useAuth();

  const [titre, setTitre] = useState(existant?.titre ?? "");
  const [sousTitre, setSousTitre] = useState(existant?.sous_titre ?? "");
  const [description, setDescription] = useState(existant?.description ?? "");
  const [type, setType] = useState<TypePrivilege>(existant?.type_privilege ?? "remise_pourcentage");
  const [valeur, setValeur] = useState(existant?.valeur ?? "");
  const [codePromo, setCodePromo] = useState(existant?.code_promo ?? "");
  const [limite, setLimite] = useState(existant?.limite_utilisation_par_client?.toString() ?? "");
  const [actif, setActif] = useState(existant?.actif ?? true);
  const [couleurDebut, setCouleurDebut] = useState(existant?.couleur_debut ?? DEGRADES_PREDEFINIS[0].debut);
  const [couleurFin, setCouleurFin] = useState(existant?.couleur_fin ?? DEGRADES_PREDEFINIS[0].fin);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [suppression, setSuppression] = useState(false);

  async function supprimer() {
    if (!token || !existant) return;
    if (!confirm(`Supprimer le privilège "${existant.titre}" ?`)) return;

    setErreur(null);
    setSuppression(true);

    try {
      await apiFetch(`/privileges/${existant.id}`, { method: "DELETE", token });
      router.push("/clients/privileges");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible de supprimer ce privilège.");
      setSuppression(false);
    }
  }

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setErreur(null);
    setChargement(true);

    const corps = {
      titre,
      sous_titre: sousTitre || null,
      description: description || null,
      type_privilege: type,
      valeur: VALEUR_REQUISE.includes(type) ? Number(valeur) : null,
      code_promo: CODE_REQUIS.includes(type) ? codePromo : null,
      limite_utilisation_par_client: limite ? Number(limite) : null,
      actif,
      couleur_debut: couleurDebut,
      couleur_fin: couleurFin,
    };

    try {
      if (existant) {
        await apiFetch(`/privileges/${existant.id}`, { method: "PUT", token, body: corps });
      } else {
        await apiFetch("/privileges", { method: "POST", token, body: corps });
      }
      router.push("/clients/privileges");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer ce privilège.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-brand-line">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-brand-ink">{existant ? "Modifier le privilège" : "Nouveau privilège"}</h1>
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-5">
        <form onSubmit={soumettre} className="flex flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Type de privilège</label>
            <div className="grid grid-cols-4 gap-2.5">
              {(Object.entries(LIBELLE_TYPE_PRIVILEGE) as [TypePrivilege, string][]).map(([valeurType, libelle]) => {
                const Icone = ICONE_TYPE[valeurType];
                const selectionne = type === valeurType;
                return (
                  <button
                    key={valeurType}
                    type="button"
                    onClick={() => setType(valeurType)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3.5 text-center transition-colors ${
                      selectionne ? "border-[color:var(--brand-blue-end)] bg-blue-50" : "border-brand-line bg-white hover:border-brand-ink/20"
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${selectionne ? "bg-gradient-brand-blue text-white" : "bg-[#EEF1F6] text-brand-muted"}`}>
                      <Icone className="h-4.5 w-4.5" />
                    </span>
                    <span className={`text-[11px] font-semibold leading-tight ${selectionne ? "text-brand-ink" : "text-brand-muted"}`}>{libelle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Titre</label>
              <input required value={titre} onChange={(e) => setTitre(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-brand-muted">Sous-titre</label>
              <input value={sousTitre} onChange={(e) => setSousTitre(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl border border-brand-line px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {VALEUR_REQUISE.includes(type) ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-brand-muted">
                  Valeur {type === "remise_pourcentage" ? "(%)" : "(CFA)"}
                </label>
                <input required type="number" min="0" value={valeur} onChange={(e) => setValeur(e.target.value)} className="h-11 rounded-xl border border-brand-line px-3 text-sm" />
              </div>
            ) : null}

            {CODE_REQUIS.includes(type) ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-brand-muted">Code promo</label>
                <input required value={codePromo} onChange={(e) => setCodePromo(e.target.value.toUpperCase())} className="h-11 rounded-xl border border-brand-line px-3 text-sm uppercase" />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Limite d&apos;utilisation par client (optionnel)</label>
            <input type="number" min="1" value={limite} onChange={(e) => setLimite(e.target.value)} className="h-11 w-40 rounded-xl border border-brand-line px-3 text-sm" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-brand-muted">Couleur de la carte</label>
            <div className="flex flex-wrap gap-2.5">
              {DEGRADES_PREDEFINIS.map((degrade) => {
                const selectionne = couleurDebut === degrade.debut && couleurFin === degrade.fin;
                return (
                  <button
                    key={degrade.debut + degrade.fin}
                    type="button"
                    onClick={() => {
                      setCouleurDebut(degrade.debut);
                      setCouleurFin(degrade.fin);
                    }}
                    aria-label="Choisir ce dégradé"
                    className={`h-10 w-10 rounded-full transition-transform ${selectionne ? "scale-110 ring-2 ring-brand-ink ring-offset-2" : "hover:scale-105"}`}
                    style={{ background: `linear-gradient(135deg, ${degrade.debut} 0%, ${degrade.fin} 100%)` }}
                  />
                );
              })}
            </div>
            <div className="mt-1 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-brand-muted">
                Début
                <input type="color" value={couleurDebut} onChange={(e) => setCouleurDebut(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-brand-line" />
              </label>
              <label className="flex items-center gap-2 text-xs text-brand-muted">
                Fin
                <input type="color" value={couleurFin} onChange={(e) => setCouleurFin(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-brand-line" />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-ink">
            <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
            Actif (visible des clients)
          </label>

          {erreur ? <p className="text-sm text-rose-600">{erreur}</p> : null}

          <div className="mt-2 flex gap-3">
            <button type="submit" disabled={chargement || suppression} className="bg-gradient-brand-blue flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white disabled:opacity-60">
              {chargement ? "Enregistrement…" : existant ? "Enregistrer" : "Créer le privilège"}
            </button>

            {existant ? (
              <button
                type="button"
                onClick={supprimer}
                disabled={chargement || suppression}
                className="flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-600 disabled:opacity-60"
              >
                {suppression ? "Suppression…" : "Supprimer"}
              </button>
            ) : null}
          </div>
        </form>

        <div className="sticky top-6 flex flex-col gap-2">
          <p className="text-xs font-medium text-brand-muted">Aperçu</p>
          <div
            className="relative flex h-[182px] w-full flex-col gap-1.5 overflow-hidden rounded-[28px] p-5 text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${couleurDebut} 0%, ${couleurFin} 100%)` }}
          >
            <GiftIconOutline className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-white/15" />
            <p className="relative text-sm font-semibold">{titre || "Titre du privilège"}</p>
            {sousTitre ? <p className="relative text-xs text-white/85">{sousTitre}</p> : null}
            <p className="relative mt-2 text-3xl font-extrabold">
              {VALEUR_REQUISE.includes(type) && valeur
                ? type === "remise_pourcentage"
                  ? `${valeur}%`
                  : `${formaterPrix(valeur)} CFA`
                : "—"}
            </p>
            {CODE_REQUIS.includes(type) && codePromo ? <p className="relative text-xs text-white/85">Code : {codePromo}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
