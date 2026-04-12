import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import { CartProvider } from "@/components/cart/CartProvider";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Revathi Store - Since 1975 | Pure Cold Pressed Oils",
  description: "From our own oil mill to your home – purity you can trust. Authentic, traditional, and pure extracting of groundnut, coconut, sesame, castor, and deepam oils.",
  keywords: "oil store in Theni, groundnut oil manufacturer Theni, cold pressed oil Tamil Nadu",
  icons: [
    {
      rel: 'icon',
      url: '/favicon.png',
      type: 'image/png',
    },
    {
      rel: 'icon',
      url: '/images/RSlogo.png',
      sizes: '32x32',
      type: 'image/png',
    },
    {
      rel: 'icon',
      url: '/images/RSlogo.png',
      sizes: '16x16',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
      sizes: '180x180',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/images/RSlogo.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/images/RSlogo.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-outfit min-h-full flex flex-col bg-background text-foreground selection:bg-primary-light selection:text-primary">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
