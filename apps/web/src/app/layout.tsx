import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "BuildShield AI",
  description: "Copilot IA pour la protection marge, contrat et trésorerie des pros du bâtiment."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
