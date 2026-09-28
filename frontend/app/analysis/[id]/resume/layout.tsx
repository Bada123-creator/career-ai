import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV CareerAI",
  description: "CV optimisé généré avec CareerAI",
};

export default function ResumeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
