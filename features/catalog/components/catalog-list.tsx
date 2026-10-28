'use client'

import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { TablePagination } from '@shared/components/table-pagination'
import { usePagination } from '@shared/hooks/use-pagination'
import { Button } from '@shared/ui/button'
import type { ComboboxOption } from '@shared/ui/combobox'
import { Input } from '@shared/ui/input'
import { Pencil, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CatalogItem } from '../types/catalog.types'
import { CatalogItemDialog } from './catalog-item-dialog'
import { DeleteCatalogItemDialog } from './delete-catalog-item-dialog'

interface CatalogListProps {
  items: CatalogItem[]
  /** ClaveProdServ and ClaveUnidad options for the form. */
  productOptions: ComboboxOption[]
  unitOptions: ComboboxOption[]
}

const PAGE_SIZE = 10

const COLUMNS = 'lg:grid-cols-[minmax(0,1fr)_minmax(0,220px)_120px_auto]'

/** "Mis servicios": the concepts a user bills again and again, with their SAT keys and price. */
export function CatalogList({ items, productOptions, unitOptions }: CatalogListProps) {
  const [search, setSearch] = useState('')
  const productLabels = useMemo(() => new Map(productOptions.map((o) => [o.value, o.label])), [productOptions])
  const unitLabels = useMemo(() => new Map(unitOptions.map((o) => [o.value, o.label])), [unitOptions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      item.description.toLowerCase().includes(q)
      || item.productServiceCode.includes(q)
      || (productLabels.get(item.productServiceCode) ?? '').toLowerCase().includes(q))
  }, [items, search, productLabels])

  const pagination = usePagination(filtered, PAGE_SIZE)

  if (items.length === 0) {
    return (
      <div className="hoja-borrador px-6 py-14 text-center">
        <p className="text-base font-medium text-tinta">Aún no tienes servicios guardados</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-tenue">
          Guarda lo que facturas seguido, con su clave SAT y su precio, y llénalo en un clic al hacer una factura.
        </p>
        <CatalogItemDialog
          productOptions={productOptions}
          unitOptions={unitOptions}
          trigger={<Button className="mt-5">Agregar mi primer servicio</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-tenue" />
        <Input
          placeholder="Buscar por descripción o clave SAT"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Buscar servicios"
        />
      </div>

      <div className="hoja">
        <div className="divide-y divide-renglon">
          <div className={`hidden ${COLUMNS} items-center gap-4 px-5 py-2.5 text-[12px] font-medium text-tinta-tenue lg:grid`}>
            <span>Servicio</span>
            <span>Clave SAT y unidad</span>
            <span className="text-right">Precio sin IVA</span>
            <span className="sr-only">Acciones</span>
          </div>

          {filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-tinta-tenue">Ningún servicio coincide con «{search}».</p>
          ) : (
            pagination.items.map((item) => (
              <div
                key={item.id}
                className={`grid grid-cols-[minmax(0,1fr)_auto] ${COLUMNS} items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-sello-tenue/40`}
              >
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-tinta">{item.description}</p>
                  <p className="mt-0.5 truncate text-[12px] text-tinta-tenue lg:hidden">
                    <span className="font-mono">{item.productServiceCode}</span> · <span className="font-mono">{item.unit}</span>
                    {item.unitPrice !== null && (
                      <>
                        {' · '}
                        <span className="font-mono">{formatCurrency(Number(item.unitPrice))}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="hidden min-w-0 text-[13px] text-tinta-tenue lg:block">
                  <p className="truncate" title={productLabels.get(item.productServiceCode)}>
                    <span className="font-mono text-tinta">{item.productServiceCode}</span>{' '}
                    {productLabels.get(item.productServiceCode) ?? ''}
                  </p>
                  <p className="truncate text-[12px]">
                    <span className="font-mono">{item.unit}</span> {unitLabels.get(item.unit) ?? ''}
                  </p>
                </div>

                <p className="hidden text-right font-mono text-sm lg:block">
                  {item.unitPrice === null ? <span className="font-sans text-[13px] text-tinta-tenue">Varía</span> : formatCurrency(Number(item.unitPrice))}
                </p>

                <div className="row-span-2 flex items-center justify-end gap-0.5 lg:row-span-1">
                  <CatalogItemDialog
                    item={item}
                    productOptions={productOptions}
                    unitOptions={unitOptions}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Editar ${item.description}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DeleteCatalogItemDialog itemId={item.id} description={item.description} />
                </div>
              </div>
            ))
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
