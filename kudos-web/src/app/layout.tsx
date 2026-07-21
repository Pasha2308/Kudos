import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kudos — Stop Being Lonely. Start Being Real.",
  description: "Kudos connects you to real humans through trust, not commercial intent. Your AI companion understands you first. Then introduces you to someone real.",
  keywords: ["connection", "loneliness", "cofounder", "AI companion", "real friendships"],
  openGraph: {
    title: "Kudos — The Anti-Loneliness Platform",
    description: "Not a dating app. Not a networking app. The place where you stop being lonely by being real.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
