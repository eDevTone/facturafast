import { useMemo, useState } from 'react'

/**
 * Hook for client-side pagination.
 * @param items - The full array of items to paginate
 * @param pageSize - Number of items per page (default: 10)
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // Reset to page 1 if items change and current page is out of bounds
  const safePage = currentPage > totalPages ? 1 : currentPage

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  return {
    items: paginatedItems,
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
    setPage: setCurrentPage,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
  }
}
