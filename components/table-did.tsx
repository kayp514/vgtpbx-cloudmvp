"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataTable } from "@/components/data-table"
import { TablePagination } from "@/components/pagination-did"
import { columns } from "@/components/data-columns"
import type { Table } from "@tanstack/react-table"
import type { DidExtDisplay} from "@/lib/db/types"

export interface DIDTableProps {
  onEdit: (didId: string) => void
  did: DidExtDisplay[]
}

export function DIDTable({ 
    onEdit, 
    did
}: DIDTableProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [tableInstance, setTableInstance] = useState<Table<any> | null>(null)

  const selectedCount = Object.values(selectedItems).filter(Boolean).length

  const handleRowSelectionChange = (newSelection: Record<string, boolean>) => {
    setSelectedItems(newSelection)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
            <CardTitle>Numbers</CardTitle>
            <CardDescription>
              {selectedCount > 0 ? `${selectedCount} numbers selected` : `${did.length} numbers found`}
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <ScrollArea>
              <div className="p-1">
                <DataTable
                  columns={columns}
                  data={did}
                  onRowSelectionChange={handleRowSelectionChange}
                  onTableCreated={setTableInstance}
                />
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      {tableInstance && <TablePagination table={tableInstance} />}
    </div>
  )
}
