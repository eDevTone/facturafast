import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { ClerkThemeSync } from "@/shared/components/clerk-theme-sync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FacturaFast - Sistema de Facturación CFDI 4.0",
  description: "Sistema de facturación electrónica para México",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ClerkThemeSync>
            {children}
            <Toaster position="top-right" richColors />
          </ClerkThemeSync>
        </ThemeProvider>
      </body>
    </html>
  );
}
