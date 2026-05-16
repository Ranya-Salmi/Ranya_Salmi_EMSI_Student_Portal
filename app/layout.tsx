import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Portail EMSI",
  description: "Portail EMSI - Suivi des absences, notes et alertes IA",
  icons: {
    icon: "/emsi-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-background"
        suppressHydrationWarning
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}