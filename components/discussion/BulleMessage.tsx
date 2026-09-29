import Image from "next/image";
import { CarteNouvelleCommande } from "@/components/discussion/CarteNouvelleCommande";
import { CarteRapportJour } from "@/components/discussion/CarteRapportJour";
import { CartePropositionPrix } from "@/components/discussion/CartePropositionPrix";
import { UserAvatarIcon } from "@/components/icons";
import type { DonneesCommandeCreee, DonneesPropositionPrix, DonneesRapport, MessageConversation } from "@/lib/types";

function formaterHeure(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formaterTempsRelatif(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  const secondes = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (secondes < 60) return "à l'instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)}min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)}h`;
  if (secondes < 604800) return `il y a ${Math.floor(secondes / 86400)}j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Avatar({ taille = 28 }: { taille?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted" style={{ height: taille, width: taille }}>
      <UserAvatarIcon style={{ height: taille * 0.55, width: taille * 0.55 }} />
    </span>
  );
}

/** Bulle de message façon messagerie. Les messages système enrichis s'affichent en pleine largeur, sans le chrome de bulle. */
export function BulleMessage({ message, estMoi }: { message: MessageConversation; estMoi: boolean }) {
  const nomAuteur = `${message.auteur.prenom ? message.auteur.prenom + " " : ""}${message.auteur.nom}`.trim();

  if (message.type === "commande_creee" || message.type === "rapport" || message.type === "proposition_prix") {
    const donnees = message.donnees;

    return (
      <div>
        {message.type === "commande_creee" && donnees ? (
          <CarteNouvelleCommande donnees={donnees as DonneesCommandeCreee} />
        ) : message.type === "rapport" && donnees ? (
          <CarteRapportJour donnees={donnees as DonneesRapport} />
        ) : message.type === "proposition_prix" && donnees ? (
          <CartePropositionPrix donnees={donnees as DonneesPropositionPrix} />
        ) : (
          <p className="mx-auto max-w-xl rounded-xl bg-white px-3.5 py-2 text-sm text-brand-ink shadow-sm shadow-slate-900/5">{message.contenu}</p>
        )}

        <div className="mx-auto mt-1.5 flex max-w-xl items-center gap-1.5">
          <Avatar taille={20} />
          <span className="text-xs font-bold text-brand-ink">{nomAuteur}</span>
          <span className="ml-auto text-[11px] text-brand-muted">{formaterTempsRelatif(message.date_envoi)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${estMoi ? "justify-end" : "justify-start"}`}>
      {!estMoi ? <Avatar /> : null}

      <div className={`max-w-[65%] rounded-2xl px-3.5 py-2 shadow-sm shadow-slate-900/5 ${estMoi ? "bg-gradient-brand-blue text-white" : "bg-white text-brand-ink"}`}>
        {!estMoi ? <p className="mb-0.5 text-xs font-bold text-[color:var(--brand-blue-end)]">{nomAuteur}</p> : null}

        {message.type === "texte" ? (
          <p className="whitespace-pre-wrap text-sm">{message.contenu}</p>
        ) : message.type === "image" && message.fichier ? (
          <div className="relative h-48 w-56 overflow-hidden rounded-xl">
            <Image src={message.fichier} alt="" fill className="object-cover" sizes="224px" />
          </div>
        ) : (message.type === "audio" || message.type === "note_vocale") && message.fichier ? (
          <audio controls src={message.fichier} className="h-10 w-56" />
        ) : (
          <p className="text-sm italic opacity-80">{message.type === "video" ? "Vidéo" : "Document"} envoyé</p>
        )}

        <p className={`mt-1 text-right text-[10px] ${estMoi ? "text-white/70" : "text-brand-muted"}`}>{formaterHeure(message.date_envoi)}</p>
      </div>
    </div>
  );
}
