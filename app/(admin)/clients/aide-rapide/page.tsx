"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  formaterDateHeure,
  type ClientConversationIa,
  type MessageAssistantIaAdmin,
  type Pagination,
} from "@/lib/types";
import { ChatIcon, ChevronDownIcon } from "@/components/icons";

function LigneConversation({ conversation, token }: { conversation: ClientConversationIa; token: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<MessageAssistantIaAdmin[] | null>(null);

  function basculer() {
    setOuvert((v) => !v);
    if (!messages) {
      apiFetch<{ client: unknown; messages: MessageAssistantIaAdmin[] }>(
        `/admin/assistant-ia/clients/${conversation.id}/messages`,
        { token }
      ).then((reponse) => setMessages(reponse.messages));
    }
  }

  const nomClient = conversation.prenom ? `${conversation.prenom} ${conversation.nom}` : conversation.nom;

  return (
    <div className="rounded-2xl border border-brand-line bg-white p-4 shadow-none">
      <button type="button" onClick={basculer} className="flex w-full items-start gap-3 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-500">
          <ChatIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-brand-ink">{nomClient}</p>
            <span className="shrink-0 text-xs text-brand-muted">{formaterDateHeure(conversation.dernier_message_date)}</span>
          </div>
          <p className="mt-0.5 text-xs text-brand-muted">
            {conversation.email} — {conversation.nombre_messages} message{conversation.nombre_messages > 1 ? "s" : ""}
          </p>
          <p className="mt-1.5 line-clamp-1 text-sm text-brand-ink">{conversation.dernier_message_contenu}</p>
        </div>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-brand-muted transition-transform ${ouvert ? "rotate-180" : ""}`} />
      </button>

      {ouvert ? (
        <div className="ml-14 mt-3 flex flex-col gap-2 border-t border-brand-line pt-3">
          {messages === null ? (
            <p className="text-xs text-brand-muted">Chargement…</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                  message.role === "client"
                    ? "self-end bg-[color:var(--brand-blue-end)] text-white"
                    : "self-start bg-[#EEF1F6] text-brand-ink"
                }`}
              >
                <p className="whitespace-pre-line">{message.contenu}</p>
                <p className={`mt-1 text-[10px] ${message.role === "client" ? "text-white/70" : "text-brand-muted"}`}>
                  {formaterDateHeure(message.date_envoi)}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function AideRapideAdminPage() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<ClientConversationIa[] | null>(null);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams({ per_page: "20" });
    if (recherche) params.set("recherche", recherche);

    apiFetch<Pagination<ClientConversationIa>>(`/admin/assistant-ia/clients?${params}`, { token }).then((page) =>
      setConversations(page.data)
    );
  }, [token, recherche]);

  return (
    <div className="rounded-3xl border border-brand-line bg-white p-6 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-ink">Aide rapide (messagerie)</h1>
          <p className="mt-0.5 text-sm text-brand-muted">
            Conversations des clients avec l&apos;agent IA Ellah — consultation seule.
          </p>
        </div>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un client…"
          className="h-10 w-56 rounded-full border border-brand-line px-4 text-sm outline-none focus:border-[color:var(--brand-blue-end)]"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {conversations === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : conversations.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune conversation pour l&apos;instant.</p>
        ) : (
          conversations.map((conversation) => (
            <LigneConversation key={conversation.id} conversation={conversation} token={token!} />
          ))
        )}
      </div>
    </div>
  );
}
