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
import { Hash, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { cn } from "@/lib/utils"

interface DIDData {
  id: string
  number: string
  region: string
  type: string
  status: "active" | "inactive" | "pending"
  assignedTo?: string
}

const dids: DIDData[] = [
  {
    id: "1",
    number: "+1 (555) 123-4567",
    region: "US",
    type: "Local",
    status: "active",
    assignedTo: "John Smith",
  },
  {
    id: "2",
    number: "+1 (555) 987-6543",
    region: "CA",
    type: "Toll-Free",
    status: "inactive",
  },
  {
    id: "3",
    number: "+1 (555) 456-7890",
    region: "UK",
    type: "Mobile",
    status: "pending",
    assignedTo: "Sarah Johnson",
  },
]

interface DIDTableProps {
  onEdit: (didId: string) => void
}

export function DIDTable({ onEdit }: DIDTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col space-y-4 p-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="search">Search Numbers</Label>
            <Input id="search" placeholder="Search by number or region..." className="h-9" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="region">Region</Label>
            <Select defaultValue="all">
              <SelectTrigger id="region" className="h-9 w-[180px]">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="us">US</SelectItem>
                <SelectItem value="ca">CA</SelectItem>
                <SelectItem value="uk">UK</SelectItem>
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
                <TableHead>Number</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dids.map((did) => (
                <TableRow key={did.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      {did.number}
                    </div>
                  </TableCell>
                  <TableCell>{did.region}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {did.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-normal",
                        did.status === "active" && "bg-green-500/15 text-green-600",
                        did.status === "inactive" && "bg-gray-500/15 text-gray-600",
                        did.status === "pending" && "bg-yellow-500/15 text-yellow-600",
                      )}
                    >
                      {did.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{did.assignedTo || "-"}</TableCell>
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
                        <DropdownMenuItem onClick={() => onEdit(did.id)}>
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
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t py-4">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div>
            Showing {dids.length} of {dids.length} numbers
          </div>
          <div>Updated just now</div>
        </div>
      </CardFooter>
    </Card>
  )
}
