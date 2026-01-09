import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import { SessionProvider } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VASTUM - Galactic Strategy",
  description: "Build deeply, fight strategically, connect globally. A modern Sci-Fi browser strategy game.",
  keywords: ["strategy", "space", "browser game", "MMO", "sci-fi"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
