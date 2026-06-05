import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import { ToastProvider } from "@/components/notifications/toast-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "BrewCycle",
    template: "%s | BrewCycle"
  },
  description:
    "Platform sirkular ekonomi hijau untuk pengolahan ampas kopi, logistik pickup, marketplace, dan dampak lingkungan."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15803d"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
