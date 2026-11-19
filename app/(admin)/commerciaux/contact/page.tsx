"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { PhoneIcon } from "@/components/icons";
import { PageHero } from "@/components/PageHero";

type ContactService = { appel: string | null; whatsapp: string | null };

const CHAMP = "h-11 w-full rounded-xl border border-brand-line px-3 text-sm";

/**
 * Numéros affichés aux commerciaux dans « Contactez le service » (app
 * Commercial, depuis leur profil) : un numéro d'appel et un numéro WhatsApp.
 */
export default function ContactServiceCommercialPage() {
  const { token } = useAuth();
  const [appel, setAppel] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [charge, setCharge] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<ContactService>("/contact-commercial", { token })
      .then((c) => {
        setAppel(c.appel ?? "");
        setWhatsapp(c.whatsapp ?? "");
      })
      .catch(() => setErreur("Impossible de charger les contacts."))
      .finally(() => setCharge(true));
  }, [token]);

  async function enregistrer() {
    if (!token) return;
    setErreur(null);
    setInfo(null);
    setEnCours(true);
    try {
      const c = await apiFetch<ContactService>("/admin/parametres/contact-commercial", { method: "PUT", token, body: { appel, whatsapp } });
      setAppel(c.appel ?? "");
      setWhatsapp(c.whatsapp ?? "");
      setInfo("Contacts enregistrés — visibles tout de suite dans l'app Commercial.");
    } catch (e) {
      setErreur(e instanceof ApiRequestError ? e.message : "Impossible d'enregistrer les contacts.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        titre="Contact du service"
        description="Numéros affichés aux commerciaux dans « Contactez le service » de leur application."
        icone={PhoneIcon}
      />

      <div className="flex max-w-xl flex-col gap-4 rounded-2xl border border-brand-line bg-white p-6">
        {erreur ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{erreur}</p> : null}
        {info ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p> : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-brand-muted">Numéro d&apos;appel</span>
          <input value={appel} onChange={(e) => setAppel(e.target.value)} placeholder="Ex. 07 00 00 00 00" className={CHAMP} disabled={!charge} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-brand-muted">Numéro WhatsApp</span>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex. 07 00 00 00 00" className={CHAMP} disabled={!charge} />
        </label>

        <button
          type="button"
          onClick={enregistrer}
          disabled={enCours || !charge || !appel.trim() || !whatsapp.trim()}
          className="bg-gradient-brand-blue h-11 rounded-full text-sm font-semibold text-white disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
