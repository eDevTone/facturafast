'use client'

import { Command } from 'cmdk'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export interface ComboboxOption {
  value: string
  /** Main text of the option. */
  label: string
  /** Secondary text shown in mono (RFC, SAT code…), also searchable. */
  hint?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  /** Lets the user keep what they typed when it is not in the list (e.g. any 8-digit SAT code). */
  allowCustom?: (search: string) => string | null
  /** Rendered at the bottom of the list, e.g. "Nuevo cliente". */
  footer?: React.ReactNode
  disabled?: boolean
  className?: string
  id?: string
  'aria-invalid'?: boolean
}

/**
 * Searchable select: a button that opens a filterable list.
 * Matches on label and hint, so clients can be found by name or RFC and SAT codes by number or description.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Selecciona',
  searchPlaceholder = 'Buscar…',
  emptyText = 'Sin resultados',
  allowCustom,
  footer,
  disabled,
  className,
  id,
  'aria-invalid': ariaInvalid,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const listId = React.useId()
  const selected = options.find((option) => option.value === value)
  const custom = allowCustom && search ? allowCustom(search) : null
  const customIsListed = custom ? options.some((option) => option.value === custom) : false

  const select = (next: string) => {
    onChange(next)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-hoja px-3 text-left text-sm',
            'transition-colors hover:border-tinta-tenue/50 disabled:cursor-not-allowed disabled:opacity-50',
            'aria-[invalid=true]:border-destructive',
            className,
          )}
        >
          <span className={cn('min-w-0 flex-1 truncate', !selected && !value && 'text-muted-foreground')}>
            {selected ? (
              <>
                {selected.hint && <span className="mr-2 font-mono text-[13px] text-tinta-tenue">{selected.hint}</span>}
                {selected.label}
              </>
            ) : (
              value || placeholder
            )}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-tinta-tenue" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px]">
        <Command
          filter={(itemValue, query) => (itemValue.toLowerCase().includes(query.toLowerCase().trim()) ? 1 : 0)}
        >
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            className="h-10 w-full border-b border-renglon bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Command.List id={listId} className="max-h-64 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              {custom && !customIsListed ? null : emptyText}
            </Command.Empty>
            {options.map((option) => (
              <Command.Item
                key={option.value}
                value={`${option.hint ?? ''} ${option.label} ${option.value}`}
                onSelect={() => select(option.value)}
                className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm data-[selected=true]:bg-sello-tenue"
              >
                <Check className={cn('h-3.5 w-3.5 shrink-0 text-sello', option.value === value ? 'opacity-100' : 'opacity-0')} />
                {option.hint && <span className="shrink-0 font-mono text-[13px] text-tinta-tenue">{option.hint}</span>}
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </Command.Item>
            ))}
            {custom && !customIsListed && (
              <Command.Item
                value={`custom ${custom}`}
                forceMount
                onSelect={() => select(custom)}
                className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm data-[selected=true]:bg-sello-tenue"
              >
                <span className="font-mono text-[13px]">{custom}</span>
                <span className="text-muted-foreground">Usar esta clave</span>
              </Command.Item>
            )}
          </Command.List>
          {footer && <div className="border-t border-renglon p-1">{footer}</div>}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
