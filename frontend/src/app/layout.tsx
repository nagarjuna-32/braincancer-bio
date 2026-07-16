import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import FloatingChat from "@/components/FloatingChat";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NeuroGen AI - Brain Cancer Bioinformatics Platform",
  description: "Advanced AI-powered clinical bioinformatics platform for brain cancer research, genomic sequencing, transcriptomics, and pathway visualization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-brand-dark text-gray-100 font-sans flex flex-col">
        <Providers>
          {children}
          <FloatingChat />
        </Providers>
      </body>
    </html>
  );
}
