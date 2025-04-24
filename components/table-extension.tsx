"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, MoreHorizontal, Pencil, Trash, Phone, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExtensionDisplay } from "@/lib/db/types"

interface ExtensionsTableProps {
  extensions: ExtensionDisplay[]
  onEdit: (extensionId: string) => void
}

export function ExtensionsTable({ 
  extensions,
  onEdit 
}: ExtensionsTableProps) {
    return (
    <Card>
      <CardHeader className="flex flex-col space-y-4 p-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="search-extensions">Search Extensions</Label>
            <Input id="search-extensions" placeholder="Search by extension, caller ID..." className="h-9" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="extension-type">Status</Label>
            <Select defaultValue="all">
              <SelectTrigger id="extension-type" className="h-9 w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[450px] pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Extension</TableHead>
                <TableHead>CID Name</TableHead>
                <TableHead>DID Number</TableHead>
                <TableHead>Call Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extensions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No extensions found
                  </TableCell>
                </TableRow>
              ) : (
                extensions.map((extension) => (
                  <TableRow key={extension.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        {extension.extension}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {extension.outbound_caller_id_name || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {extension.call_group || 'default'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-normal",
                          !extension.disabled && "bg-green-500/15 text-green-600",
                          extension.disabled && "bg-gray-500/15 text-gray-600"
                        )}
                      >
                        {extension.disabled ? 'disabled' : 'enabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {extension.outbound_caller_id_number ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {extension.outbound_caller_id_number}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem onClick={() => onEdit(extension.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Trash className="mr-2 h-4 w-4 text-destructive" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
