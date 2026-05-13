import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Portail EMSI - Suivi Pédagogique",
  description:
    "Portail de suivi des absences et notes des étudiants avec détection IA des profils à risque - EMSI Centre",
  generator: "EMSI Centre - PFA 2025/2026",
}

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased bg-background">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
