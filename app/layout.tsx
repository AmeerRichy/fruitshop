import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from "./context/CartContext";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Fruit Shop | Fresh Fruit Delivery Lahore", template: "%s | Fruit Shop" },
  description: "Premium, quality-checked fresh fruit delivered across Lahore with secure online payment and cash on delivery.",
};

import NavbarWrapper from "./components/NavbarWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CartProvider>
          <NavbarWrapper />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
