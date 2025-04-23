"use client"

import { type Row, type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ArrowDownLeft, Phone, VoicemailIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type CallRecord = {
  id: string
  direction: "Inbound" | "Outbound"
  from: string
  to: string
  duration: string
  status: "Completed" | "Missed" | "Voicemail" | "Failed"
  timestamp: string
}

export const columns: ColumnDef<CallRecord>[] = [
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }: { row: Row<CallRecord> }) => {
      const direction = row.getValue("direction") as string
      return (
        <div className="flex items-center">
          {direction === "Inbound" ? (
            <ArrowDownLeft className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <ArrowUpRight className="mr-2 h-4 w-4 text-blue-500" />
          )}
          {direction}
        </div>
      )
    },
  },
  {
    accessorKey: "from",
    header: "From",
  },
  {
    accessorKey: "to",
    header: "To",
  },
  {
    accessorKey: "duration",
    header: "Duration",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: Row<CallRecord> }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "Completed"
              ? "default"
              : status === "Missed"
              ? "destructive"
              : status === "Voicemail"
              ? "outline"
              : "secondary"
          }
        >
          {status === "Voicemail" && <VoicemailIcon className="mr-1 h-3 w-3" />}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ row }: { row: Row<CallRecord> }) => {
      const timestamp = new Date(row.getValue("timestamp"))
      return timestamp.toLocaleString()
    },
  },
  {
    id: "actions",
    cell: ({ row }: { row: Row<CallRecord> }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <Phone className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Download Recording</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]