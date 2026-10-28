'use client'

import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover'
import { Command } from 'cmdk'
import { Briefcase } from 'lucide-react'
import { useState } from 'react'
import type { CatalogItem } from '../types/catalog.types'
import { priceForInvoice } from '../utils/catalog-price'

interface CatalogPickerProps {
  items: CatalogItem[]
  /** The invoice prices include IVA: prices show (and fill) that way. */
  pricesIncludeIva: boolean
  /** IVA rate of the invoice (0 for exported services). */
  ivaRate?: number
  /** Currency of the invoice, to format the prices. */
  currency?: string
  onPick: (item: CatalogItem) => void
}

/** "De mis servicios": fills an invoice line with a saved service. */
export function CatalogPicker({ items, pricesIncludeIva, ivaRate, currency = 'MXN', onPick }: CatalogPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-[4px] px-1 text-[12px] font-medium text-sello transition-colors hover:bg-sello-tenue"
        >
          <Briefcase className="h-3 w-3" />
          De mis servicios
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <Command filter={(value, query) => (value.toLowerCase().includes(query.toLowerCase().trim()) ? 1 : 0)}>
          <Command.Input
            placeholder="Buscar servicio"
            className="h-10 w-full border-b border-renglon bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List className="max-h-64 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              Ningún servicio coincide
            </Command.Empty>
            {items.map((item) => {
              const price = priceForInvoice(item.unitPrice, pricesIncludeIva, ivaRate)
              return (
                <Command.Item
                  key={item.id}
                  value={`${item.description} ${item.productServiceCode} ${item.id}`}
                  onSelect={() => {
                    onPick(item)
                    setOpen(false)
                  }}
                  className="flex cursor-pointer items-start justify-between gap-3 rounded-[4px] px-2 py-1.5 text-sm data-[selected=true]:bg-sello-tenue"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{item.description}</span>
                    <span className="font-mono text-[12px] text-tinta-tenue">
                      {item.productServiceCode} · {item.unit}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[13px] text-tinta-tenue">
                    {price === null ? 'Varía' : formatCurrency(price, currency)}
                  </span>
                </Command.Item>
              )
            })}
          </Command.List>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
