const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

// Sans ça, une requête dont la réponse n'arrive jamais laisse l'écran sur
// "Chargement…" indéfiniment — rien ne rejette la promesse.
const DELAI_REQUETE_MS = 20_000;

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
};

export class ApiRequestError extends Error {
  code: string;
  fields?: Record<string, string[]>;
  status: number;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.code = error.code;
    this.fields = error.fields;
    this.status = status;
  }
}

async function requeteApi(path: string, options: { method?: string; body?: unknown; token?: string } = {}) {
  const estFormData = options.body instanceof FormData;
  let methode = options.method ?? "GET";

  // PHP ne peuple $_FILES que sur un vrai POST : pour un "update" avec
  // fichier, on envoie donc un POST + _method=PUT (spoofing Laravel usuel).
  if (estFormData && (methode === "PUT" || methode === "PATCH")) {
    (options.body as FormData).append("_method", methode);
    methode = "POST";
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: methode,
      cache: "no-store",
      signal: AbortSignal.timeout(DELAI_REQUETE_MS),
      headers: {
        Accept: "application/json",
        ...(estFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: estFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (e) {
    // fetch() rejette avec une exception brute (jamais une réponse HTTP) sur
    // un réseau injoignable ou l'abandon ci-dessus — uniformisé en
    // ApiRequestError pour que tout appelant n'ait qu'une seule forme
    // d'erreur à gérer.
    const delaiDepasse = e instanceof DOMException && e.name === "TimeoutError";
    throw new ApiRequestError(
      {
        code: delaiDepasse ? "TIMEOUT" : "NETWORK_ERROR",
        message: delaiDepasse
          ? "La connexion a mis trop de temps à répondre. Vérifie ta connexion et réessaie."
          : "Impossible de joindre le serveur. Vérifie ta connexion et réessaie.",
      },
      0
    );
  }

  const json = await response.json().catch(() => null);

  if (!response.ok || !json?.success) {
    const error: ApiError = json?.error ?? {
      code: "SERVER_ERROR",
      message: "Une erreur est survenue, réessayez.",
    };

    throw new ApiRequestError(error, response.status);
  }

  return json;
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const json = await requeteApi(path, options);

  return json.data as T;
}

// Certains endpoints admin renvoient des stats globales dans `meta`, à côté
// des données paginées dans `data` (ex. GET /admin/clients) — apiFetch seul
// ne restitue que `data`, ce variant garde les deux.
export async function apiFetchAvecMeta<T, M = Record<string, unknown>>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<{ data: T; meta: M }> {
  const json = await requeteApi(path, options);

  return { data: json.data as T, meta: (json.meta ?? {}) as M };
}
