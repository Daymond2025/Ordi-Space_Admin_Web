"use client";

import { useRef, useState } from "react";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { Listbox } from "@/components/Listbox";
import { UserAvatarIcon, XIcon } from "@/components/icons";

const CHAMP = "h-11 rounded-xl border border-brand-line px-3 text-sm";

const OPTIONS_VEHICULE = [
  { value: "", label: "Non renseigné" },
  { value: "moto", label: "Moto" },
  { value: "voiture", label: "Voiture" },
  { value: "tricycle", label: "Tricycle" },
  { value: "velo", label: "Vélo" },
];

const LIBELLE_ROLE: Record<Role, string> = {
  coordinateur: "coordinateur",
  fournisseur: "fournisseur",
  livreur: "livreur",
};

type Role = "coordinateur" | "fournisseur" | "livreur";

/**
 * Création manuelle d'un Coordinateur/Fournisseur/Livreur par l'Admin — même
 * principe que "Nouveau client" (ModaleNouveauClient dans clients/liste),
 * mais POST /admin/utilisateurs (UtilisateurController::provisionner()) :
 * ces 3 rôles n'ont pas de connexion par téléphone/OTP, un mot de passe est
 * donc exigé ici. CRUD complet côté admin, comme pour un client.
 */
export function ModaleProvisionnerUtilisateur({
  role,
  token,
  onClose,
  onCree,
}: {
  role: Role;
  token: string;
  onClose: () => void;
  onCree: (utilisateurId: number) => void;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [typeVehicule, setTypeVehicule] = useState("");
  const [zoneCouverture, setZoneCouverture] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [apercuPhoto, setApercuPhoto] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const inputPhotoRef = useRef<HTMLInputElement>(null);

  const pretAEnvoyer = nom.trim() && email.trim() && motDePasse.trim() && (role !== "fournisseur" || nomEntreprise.trim());

  // Aperçu en data: URL (FileReader), pas un object URL "blob:" — la CSP de
  // l'app (next.config.ts) n'autorise que 'self'/data: en img-src.
  function choisirPhoto(fichier: File | undefined) {
    if (!fichier) return;
    setPhoto(fichier);
    const lecteur = new FileReader();
    lecteur.onload = () => setApercuPhoto(typeof lecteur.result === "string" ? lecteur.result : null);
    lecteur.readAsDataURL(fichier);
  }

  async function creer() {
    setErreur(null);
    setEnCours(true);
    try {
      const champs: Record<string, string | null> = {
        nom,
        prenom: prenom || null,
        email,
        telephone: telephone || null,
        password: motDePasse,
        type_utilisateur: role,
        ...(role === "fournisseur" ? { nom_entreprise: nomEntreprise } : {}),
        ...(role === "livreur" ? { type_vehicule: typeVehicule || null, zone_couverture: zoneCouverture || null } : {}),
      };

      let body: unknown = champs;
      if (photo) {
        const formData = new FormData();
        for (const [cle, valeur] of Object.entries(champs)) {
          if (valeur !== null) formData.append(cle, valeur);
        }
        formData.append("photo", photo);
        body = formData;
      }

      const utilisateur = await apiFetch<{ id: number }>("/admin/utilisateurs", { method: "POST", token, body });
      onCree(utilisateur.id);
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : `Impossible de créer ce ${LIBELLE_ROLE[role]}.`);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-ink">Nouveau {LIBELLE_ROLE[role]}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF1F6] text-brand-muted">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-xs text-brand-muted">
          Compte créé directement par l&apos;équipe — {LIBELLE_ROLE[role]} pourra se connecter avec cet e-mail et ce mot de passe.
        </p>

        {erreur ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">{erreur}</p> : null}

        <div className="mt-4 flex justify-center">
          {/* overflow-hidden ne s'applique qu'au cercle intérieur (photo) :
              posé directement sur le bouton, il rognait aussi le badge "+". */}
          <button
            type="button"
            onClick={() => inputPhotoRef.current?.click()}
            className="relative flex h-16 w-16 items-center justify-center"
            aria-label="Ajouter une photo de profil"
          >
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#EEF1F6] text-brand-muted">
              {apercuPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:), non pris en charge par next/image
                <img src={apercuPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserAvatarIcon className="h-7 w-7" />
              )}
            </span>
            <span className="bg-gradient-brand-blue absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full text-white ring-2 ring-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-2.5 w-2.5">
                <path d="M12 6v12M6 12h12" />
              </svg>
            </span>
          </button>
          <input ref={inputPhotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => choisirPhoto(e.target.files?.[0])} />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className={CHAMP} />
            <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom (optionnel)" className={CHAMP} />
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className={CHAMP} />
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone (optionnel)" className={CHAMP} />
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="Mot de passe (8 car. min, majuscule + chiffre)"
            className={CHAMP}
          />

          {role === "fournisseur" ? (
            <input value={nomEntreprise} onChange={(e) => setNomEntreprise(e.target.value)} placeholder="Nom de l'entreprise" className={CHAMP} />
          ) : null}

          {role === "livreur" ? (
            <>
              <Listbox value={typeVehicule} onChange={setTypeVehicule} options={OPTIONS_VEHICULE} placeholder="Type de véhicule (optionnel)" />
              <input value={zoneCouverture} onChange={(e) => setZoneCouverture(e.target.value)} placeholder="Zone couverte (optionnel)" className={CHAMP} />
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={creer}
          disabled={enCours || !pretAEnvoyer}
          className="bg-gradient-brand-blue mt-5 flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white disabled:opacity-50"
        >
          {enCours ? "Création…" : `Créer le ${LIBELLE_ROLE[role]}`}
        </button>
      </div>
    </div>
  );
}
