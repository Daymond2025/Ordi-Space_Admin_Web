import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
const API_ORIGIN = new URL(API_URL).origin;

// 'unsafe-eval' n'est nécessaire qu'en dev (source maps/HMR de Turbopack) —
// jamais en production, où le bundle ne l'utilise pas. Même politique que
// Livreur/Coordinateur/page_commande (voir leurs next.config.ts).
const scriptSrc = process.env.NODE_ENV === "development" ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

// Images produit/profil (backend, dev et prod) + miniatures YouTube (Tutos & Formations,
// voir remotePatterns ci-dessous) — mêmes alias de boucle locale qu'en dev uniquement.
const imgOrigins =
  process.env.NODE_ENV === "development"
    ? Array.from(new Set([API_ORIGIN, "http://127.0.0.1:8000", "http://localhost:8000", "https://i.ytimg.com"]))
    : [API_ORIGIN, "https://i.ytimg.com"];

const CSP = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${imgOrigins.join(" ")}`,
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/storage/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/storage/**" },
      { protocol: "https", hostname: "ordisapce.daymondboutique.com", pathname: "/storage/**" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    // Backend API tourne en local en développement (127.0.0.1 / localhost) :
    // à retirer si l'API pointe un jour vers un domaine public en prod.
    dangerouslyAllowLocalIP: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
