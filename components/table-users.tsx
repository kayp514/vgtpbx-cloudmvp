"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, CheckCircle2, XCircle, RefreshCw, Edit, Trash2, UserCog, Shield, Mail } from "lucide-react"
import type { PbxUserDisplay } from "@/lib/db/types"
import { getPrimaryRole } from "@/app/actions"
import { formatDistanceToNow } from "date-fns"

interface UsersTableProps {
  users: PbxUserDisplay[]
  selectedUsers: string[]
  toggleSelected: (id: string) => void
  toggleAll: () => void
  toggleStatus: (id: string) => void
  onEdit: (user: PbxUserDisplay) => void
  onDelete: (id: string) => void
  isLoading: Record<string, boolean>
}

export function UsersTable({
  users,
  selectedUsers,
  toggleSelected,
  toggleAll,
  toggleStatus,
  onEdit,
  onDelete,
  isLoading,
}: UsersTableProps) {
  
  const getStatusBadge = (disabled: boolean) => {
    if (disabled) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800"
        >
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Inactive
        </Badge>
      )
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200 dark:border-green-800"
        >
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          Active
        </Badge>
      )
    }
  }

  const getRoleBadges = (user: PbxUserDisplay) => {
    return (
      <div className="flex flex-wrap gap-1">
        {user.role && (
          <Badge
            key={user.role}
            className={
              user.role === "superuser"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                : user.role === "admin"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                : user.role === "staff"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800"
            }
          >
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Users</CardTitle>
        <CardDescription>
          {selectedUsers.length > 0 ? `${selectedUsers.length} users selected` : `${users.length} users found`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UserCog className="h-8 w-8 mb-2 opacity-40" />
                      <p>No users found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.auth_user_id} className="group hover:bg-muted/30">
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.auth_user_id)}
                        onCheckedChange={() => toggleSelected(user.auth_user_id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.auth_user.firstName?.charAt(0)}
                            {user.auth_user.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{user.auth_user.displayName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.email}</TableCell>
                    <TableCell>{getRoleBadges(user)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!user.disabled}
                          onCheckedChange={() => toggleStatus(user.auth_user_id)}
                          disabled={isLoading[user.auth_user_id]}
                          className={!user.disabled ? "bg-green-500" : ""}
                        />
                        {isLoading[user.auth_user_id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          getStatusBadge(user.disabled)
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => onEdit(user)} 
                            className="cursor-pointer"
                          >
                            <a href={`/dashboard/users/${user.auth_user_id}/settings`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(user.auth_user_id)}
                            className="cursor-pointer text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

