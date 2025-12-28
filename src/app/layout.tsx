import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ponnect - Dog Parent Community Australia",
  description: "Connect with fellow dog parents in Brisbane and Queensland. Get expert advice, join local meetups, and manage your pet's health all in one place.",
  keywords: ["dog community", "pet owners", "Brisbane", "Queensland", "Australia", "dog meetups", "pet health", "vet advice"],
  authors: [{ name: "Ponnect" }],
  openGraph: {
    title: "Ponnect - Dog Parent Community Australia",
    description: "The go-to community for Aussie dog lovers. Connect, learn, and care for your furry friends.",
    type: "website",
    locale: "en_AU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
