import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/storage/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/storage/**" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    // Backend API tourne en local en développement (127.0.0.1 / localhost) :
    // à retirer si l'API pointe un jour vers un domaine public en prod.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
