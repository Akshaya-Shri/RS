import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";

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
      <body className="font-outfit min-h-full flex flex-col bg-background text-foreground selection:bg-primary-light selection:text-primary">
        <Navbar />
        {children}
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
