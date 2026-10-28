import type { CatalogOption } from '@shared/services/sat-catalog.service'
import type { ComboboxOption } from '@shared/ui/combobox'

/** Splits "01 - Efectivo" into a code hint and a readable label for the combobox. */
export function toComboboxOptions(options: CatalogOption[]): ComboboxOption[] {
  return options.map((option) => {
    const [code, ...rest] = option.label.split(' - ')
    return { value: option.value, hint: code, label: rest.join(' - ') || option.label }
  })
}
