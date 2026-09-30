import type { Metadata } from "next";
import { Geist_Mono, Roboto } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

// Police par défaut de toutes les plateformes OrdiSpace (Admin/Fournisseur/
// Coordinateur/Livreur/Client) : Roboto, repli Arial puis sans-serif.
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ordi'Space Admin - Atlax",
  description: "Espace d'administration Ordi'Space.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-brand-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
