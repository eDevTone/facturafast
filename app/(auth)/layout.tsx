import { Receipt } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Receipt className="h-4.5 w-4.5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">
          FacturaFast
        </span>
      </Link>

      {/* Auth Content */}
      {children}

      {/* Footer */}
      <p className="mt-8 text-center text-[12px] text-muted-foreground/60">
        Facturación electrónica CFDI 4.0 para México
      </p>
    </div>
  );
}
