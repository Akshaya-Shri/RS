"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import { CartProvider } from "@/components/cart/CartProvider";
import { LanguageProvider } from "@/context/LanguageContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <LanguageProvider>
      <CartProvider>
        {!isAdminPage && <Navbar />}
        {children}
        {!isAdminPage && <Footer />}
        {!isAdminPage && <FloatingWhatsApp />}
      </CartProvider>
    </LanguageProvider>
  );
}