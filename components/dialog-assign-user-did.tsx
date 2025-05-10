"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Mock users data
const users = [
  { id: "1", name: "John Smith", email: "john.smith@example.com" },
  { id: "2", name: "Sarah Johnson", email: "sarah.johnson@example.com" },
  { id: "3", name: "Michael Brown", email: "michael.brown@example.com" },
  { id: "4", name: "Emily Davis", email: "emily.davis@example.com" },
  { id: "5", name: "David Wilson", email: "david.wilson@example.com" },
]

interface AssignDidToUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  didId: string
  currentAssignee?: string
  onAssign: (didId: string, userId: string) => void
}

export function AssignDidToUserDialog({ open, onOpenChange, didId, currentAssignee, onAssign }: AssignDidToUserDialogProps) {
  const [selectedUser, setSelectedUser] = useState<string | undefined>(currentAssignee)
  const [comboboxOpen, setComboboxOpen] = useState(false)

  const handleSave = () => {
    if (selectedUser) {
      onAssign(didId, selectedUser)
      onOpenChange(false)
    }
  }

  const selectedUserDetails = selectedUser ? users.find((user) => user.id === selectedUser) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign User</DialogTitle>
          <DialogDescription>Select a user to assign to this DID number.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between">
                {selectedUser ? users.find((user) => user.id === selectedUser)?.name : "Select user..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={(currentValue) => {
                          setSelectedUser(currentValue === selectedUser ? undefined : currentValue)
                          setComboboxOpen(false)
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedUser === user.id ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedUserDetails && (
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <Badge variant="outline" className="gap-1 px-1.5 py-0.5">
                <User className="h-3 w-3" />
                <span>Assigned to</span>
              </Badge>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{selectedUserDetails.name}</span>
                <span className="text-xs text-muted-foreground">{selectedUserDetails.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-6 w-6"
                onClick={() => setSelectedUser(undefined)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedUser}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
