
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CareerAI",
    template: "%s | CareerAI",
  },
  description:
    "CareerAI analyse vos candidatures, optimise votre CV et vous prépare aux entretiens grâce à l'intelligence artificielle.",
  applicationName: "CareerAI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
