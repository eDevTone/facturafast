import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { ClerkThemeSync } from "@/shared/components/clerk-theme-sync";
import "./globals.css";

// IBM Plex descends from business-form typography: Sans for the interface,
// Mono for folios, RFC, UUID and amounts (tabular figures).
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "FacturaFast",
  description: "Factura tus honorarios CFDI 4.0 con las retenciones correctas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${plexSans.variable} ${plexMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ClerkThemeSync>
            {children}
            <Toaster position="top-right" toastOptions={{ className: "font-sans" }} />
          </ClerkThemeSync>
        </ThemeProvider>
      </body>
    </html>
  );
}
