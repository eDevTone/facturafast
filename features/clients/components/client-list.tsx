'use client'

import type { CatalogOption, CountryOption, TaxRegimeOption } from '@shared/services/sat-catalog.service'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { FilePlus2, Search } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePagination } from '@shared/hooks/use-pagination'
import { TablePagination } from '@shared/components/table-pagination'
import type { Client } from '../types/client.types'
import { isForeignClient } from '../utils/foreign-client'
import { DeleteClientDialog } from './delete-client-dialog'
import { EditClientDialog } from './edit-client-dialog'
import { RequestClientDataDialog } from './request-client-data-dialog'

interface ClientListProps {
  clients: Client[]
  taxRegimeLabels: Record<string, string>
  catalogs: {
    taxRegimes: TaxRegimeOption[]
    cfdiUsages: CatalogOption[]
    countries: CountryOption[]
  }
}

const PAGE_SIZE = 10

const COLUMNS = 'md:grid-cols-[minmax(0,1fr)_140px_minmax(0,180px)_minmax(0,170px)_auto]'

export function ClientList({ clients, taxRegimeLabels, catalogs }: ClientListProps) {
  const [search, setSearch] = useState('')
  const countryNames = useMemo(
    () => new Map(catalogs.countries.map(c => [c.value, c.label.replace(/^\w+\s*-\s*/, '')])),
    [catalogs.countries],
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      c =>
        c.businessName.toLowerCase().includes(q) ||
        c.rfc.toLowerCase().includes(q) ||
        c.foreignTaxId?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    )
  }, [clients, search])

  const pagination = usePagination(filtered, PAGE_SIZE)

  if (clients.length === 0) {
    return (
      <div className="hoja-borrador px-6 py-14 text-center">
        <p className="text-base font-medium text-tinta">Aún no tienes clientes</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-tenue">
          Agrega a quien le facturas. Si tienes su Constancia de Situación Fiscal en PDF, los datos se llenan solos.
        </p>
        <Button asChild className="mt-5">
          <Link href="/clients/new">Agregar mi primer cliente</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-tenue" />
        <Input
          placeholder="Buscar por nombre, RFC o correo"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Buscar clientes"
        />
      </div>

      <div className="hoja">
        <div className="divide-y divide-renglon">
          <div className={`hidden ${COLUMNS} items-center gap-4 px-5 py-2.5 text-[12px] font-medium text-tinta-tenue md:grid`}>
            <span>Cliente</span>
            <span>RFC o número fiscal</span>
            <span>Régimen</span>
            <span>Contacto</span>
            <span className="sr-only">Acciones</span>
          </div>

          {filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-tinta-tenue">
              Ningún cliente coincide con «{search}».
            </p>
          ) : (
            pagination.items.map(client => {
              const isMoral = client.rfc.length === 12
              const isForeign = isForeignClient(client)
              const taxId = isForeign ? client.foreignTaxId ?? 'XEXX010101000' : client.rfc
              return (
                <div
                  key={client.id}
                  className={`grid grid-cols-[minmax(0,1fr)_auto] ${COLUMNS} items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-sello-tenue/40`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight text-tinta">{client.businessName}</p>
                    <p className="mt-0.5 text-[12px] text-tinta-tenue">
                      {isForeign
                        ? `En el extranjero · ${countryNames.get(client.country ?? '') ?? client.country}`
                        : `Persona ${isMoral ? 'moral' : 'física'}`}
                      <span className="font-mono md:hidden"> · {taxId}</span>
                    </p>
                  </div>

                  <p className="hidden truncate font-mono text-[13px] text-tinta md:block" title={isForeign ? 'Número de identificación fiscal' : 'RFC'}>{taxId}</p>

                  <p className="hidden truncate text-[13px] text-tinta-tenue md:block" title={client.taxRegime ? taxRegimeLabels[client.taxRegime] : undefined}>
                    {client.taxRegime ? (
                      <>
                        <span className="font-mono">{client.taxRegime}</span>{' '}
                        {(taxRegimeLabels[client.taxRegime] || '').replace(/^\d+\s*-\s*/, '')}
                      </>
                    ) : (
                      '—'
                    )}
                  </p>

                  <p className="hidden truncate text-[13px] text-tinta-tenue md:block" title={client.email ?? undefined}>
                    {client.email || client.phone || (client.postalCode ? <span className="font-mono">CP {client.postalCode}</span> : '—')}
                  </p>

                  <div className="row-span-2 flex items-center justify-end gap-0.5 md:row-span-1">
                    <Button asChild variant="outline" size="sm" className="mr-1">
                      <Link href={`/invoices/new?clientId=${client.id}`} aria-label={`Facturar a ${client.businessName}`}>
                        <FilePlus2 className="h-3.5 w-3.5" />
                        {/* On a phone the icon is enough: the client's name needs the room */}
                        <span className="hidden sm:inline">Facturar</span>
                      </Link>
                    </Button>
                    {!isForeign && <RequestClientDataDialog client={client} />}
                    <EditClientDialog client={client} catalogs={catalogs} />
                    <DeleteClientDialog clientId={client.id} clientName={client.businessName} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={pagination.setPage}
        />
      </div>
    </div>
  )
}
