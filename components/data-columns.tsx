"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Hash, MoreHorizontal, Pencil, Trash, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { AssignDidToUserDialog } from "@/components/dialog-assign-user-did"
import type { DidExtDisplay} from "@/lib/db/types"

export const columns: ColumnDef<DidExtDisplay>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "outbound_caller_id_number",
    header: "Number",
    cell: ({ row }) => {
      const number = row.getValue("outbound_caller_id_number") as string | null
      return (
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span>{number || "-"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "extension",
    header: "Extension",
  },
  {
    accessorKey: "region",
    header: "Region",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge variant="outline" className="font-normal">
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "disabled",
    header: "Status",
    cell: ({ row }) => {
      const disabled = row.getValue("disabled") as boolean
      const status = disabled ? "disabled" : "enabled"
      return (
        <Badge
          variant="secondary"
          className={cn(
            "font-normal",
            !disabled && "bg-green-500/15 text-green-600",
            disabled && "bg-gray-500/15 text-gray-600",
          )}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => {
      const assignedTo = row.getValue("pbx_extension_users?.user_uuid") as string | undefined
      return <div className="text-muted-foreground">{assignedTo || "-"}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const did = row.original
      const [assignDialogOpen, setAssignDialogOpen] = useState(false)
      const router = useRouter()

      const handleAssignUser = (didId: string, userId: string) => {
        console.log(`Assigning user ${userId} to DID ${didId}`)
        // Here you would typically call an API to update the assignment
      }

      const handleEdit = (id: string) => {
        router.push(`/dashboard/ext-numbers/did/${id}/settings`)
      }

      return (
        <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleEdit(did.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAssignDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign User
              </DropdownMenuItem>
            <DropdownMenuItem>
              <Trash className="mr-2 h-4 w-4 text-destructive" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <AssignDidToUserDialog
            open={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            didId={did.id}
            currentAssignee={did.pbx_extension_users?.user_uuid || ''}
            onAssign={handleAssignUser}
          />
      </>
      )
    },
  },
]
