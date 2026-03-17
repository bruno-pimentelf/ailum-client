import type { Metadata } from "next";
import { Outfit, DM_Sans, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ailum — IA para Clínicas",
  description:
    "IA que agenda, cobra via Pix e confirma consultas pelo WhatsApp. Zero no-show.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${outfit.variable} ${dmSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
