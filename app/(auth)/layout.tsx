import Link from "next/link";

import { Logo } from "@shared/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="mb-8" aria-label="FacturaFast, inicio">
        <Logo />
      </Link>

      {children}

      <p className="mt-8 max-w-xs text-center text-[12px] text-muted-foreground">
        Facturas CFDI 4.0 con retenciones RESICO, timbradas por un PAC autorizado por el SAT.
      </p>
    </div>
  );
}
