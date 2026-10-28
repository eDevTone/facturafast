import { CatalogItemDialog } from '@features/catalog/components/catalog-item-dialog'
import { CatalogList } from '@features/catalog/components/catalog-list'
import { getCatalogItems } from '@features/catalog/services/catalog.service'
import { getProductServiceCodeOptions, getUnitCodeOptions } from '@shared/services/sat-catalog.service'
import { Button } from '@shared/ui/button'
import { toComboboxOptions } from '@shared/utils/catalog-options'
import { auth } from '@clerk/nextjs/server'
import { Plus } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CatalogPage() {
  const { userId } = await auth()

  if (!userId) {
    notFound()
  }

  const [items, productServiceCodes, unitCodes] = await Promise.all([
    getCatalogItems(userId),
    getProductServiceCodeOptions(),
    getUnitCodeOptions(),
  ])
  const productOptions = toComboboxOptions(productServiceCodes)
  const unitOptions = toComboboxOptions(unitCodes)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Mis servicios</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {items.length > 0
              ? `${items.length} servicio${items.length !== 1 ? 's' : ''}`
              : 'Lo que facturas seguido'}
          </p>
        </div>
        <CatalogItemDialog
          productOptions={productOptions}
          unitOptions={unitOptions}
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo servicio
            </Button>
          }
        />
      </div>

      <CatalogList items={items} productOptions={productOptions} unitOptions={unitOptions} />
    </div>
  )
}
