import Link from 'next/link'

import { Logo } from '@shared/components/logo'
import { Button } from '@shared/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Logo className="mb-10" />
      <div className="hoja w-full max-w-md px-6 py-10 text-center sm:px-10">
        <span className="sello text-tinta-roja" style={{ ['--sello-rot' as string]: '-4deg' }}>
          <span className="sello-titulo">No existe</span>
          <span className="text-[12px]">404</span>
        </span>
        <h1 className="mt-6 text-lg font-semibold tracking-tight text-tinta">Esta página no existe</h1>
        <p className="mt-2 text-sm text-tinta-tenue">
          Puede que el enlace esté incompleto o que la página se haya movido. Revisa la dirección o vuelve a tus facturas.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/invoices">Ver mis facturas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
