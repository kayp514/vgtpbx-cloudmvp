"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import type { Table } from "@tanstack/react-table"

interface TablePaginationProps<TData> {
  table: Table<TData>
}

export function TablePagination<TData>({ table }: TablePaginationProps<TData>) {
  return (
    <div className="mt-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} />
          </PaginationItem>
          {Array.from({ length: table.getPageCount() }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                isActive={table.getState().pagination.pageIndex === i}
                onClick={() => table.setPageIndex(i)}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext 
              onClick={() => table.nextPage()} 
              disabled={!table.getCanNextPage()}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
