import Image from "next/image";
import { formaterMontant, type DonneesCommandeCreee } from "@/lib/types";
import { ImagePlaceholderIcon, PhoneIcon, UserAvatarIcon } from "@/components/icons";

function formaterDateLivraison(iso: string | null): string {
  if (!iso) return "Aujourd'hui, dans l'immédiat";
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "Aujourd'hui, dans l'immédiat";
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LigneDetail({ label, value, isTel }: { label: string; value: string; isTel?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-brand-muted">
        <UserAvatarIcon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      {isTel ? (
        <a href={`tel:${value}`} className="flex shrink-0 items-center gap-1 text-sm font-bold text-[color:var(--brand-blue-end)]">
          <PhoneIcon className="h-3.5 w-3.5" />
          {value}
        </a>
      ) : (
        <span className="shrink-0 text-sm font-bold text-brand-ink">{value}</span>
      )}
    </div>
  );
}

function LignePrix({ label, value, negatif }: { label: string; value: number; negatif?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-brand-muted">{label}</span>
      <span className={`text-sm font-bold ${negatif ? "text-rose-500" : "text-brand-ink"}`}>
        {negatif ? "-" : ""}
        {formaterMontant(value)}
      </span>
    </div>
  );
}

/** Contenu détaillé d'une commande — utilisé par CarteNouvelleCommande dans le fil de discussion. */
export function DetailCommande({ donnees }: { donnees: DonneesCommandeCreee }) {
  const bonusListe = donnees.bonus_offerts ? donnees.bonus_offerts.split(",").map((item) => item.trim()).filter(Boolean) : [];

  return (
    <div>
      <div className="flex gap-3 rounded-xl bg-white p-2.5 shadow-sm shadow-slate-900/5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F6F8FE]">
          {donnees.photo ? (
            <Image src={donnees.photo} alt={donnees.nom_produit} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-muted">
              <ImagePlaceholderIcon className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-sm font-bold leading-snug text-brand-ink">{donnees.nom_produit}</p>
          <p className="mt-1 text-sm font-extrabold text-brand-ink">{formaterMontant(donnees.prix_produit)}</p>
        </div>
      </div>

      <div className="my-3 h-px bg-brand-line" />

      <div className="space-y-2.5">
        <LigneDetail label="Nom pour la facture" value={donnees.nom_client} />
        <LigneDetail label="Lieu de livraison" value={donnees.zone_livraison ?? "—"} />
        {donnees.telephone ? <LigneDetail label="Numéro de téléphone" value={donnees.telephone} isTel /> : null}
        <LigneDetail label="Date et heure de livraison" value={formaterDateLivraison(donnees.date_livraison_prevue)} />
      </div>

      <div className="my-3 h-px bg-brand-line" />

      <div className="rounded-xl bg-[#F7F9FC] p-3">
        <div className="space-y-2">
          <LignePrix label="Prix du produit" value={donnees.prix_produit} />
          <LignePrix label="Frais de livraison" value={donnees.frais_livraison} />
          <LignePrix label="TVA" value={0} />
          <LignePrix label="Remise" value={donnees.remise} negatif={donnees.remise > 0} />
        </div>
        <div className="my-2 h-px bg-brand-line" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-brand-ink">Total à payer</span>
          <span className="text-sm font-extrabold text-brand-ink">{formaterMontant(donnees.total)}</span>
        </div>
      </div>

      {bonusListe.length > 0 ? (
        <div className="mt-3">
          <p className="text-sm font-bold text-brand-ink">Les bonus offerts</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bonusListe.map((item, index) => (
              <span key={index} className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
