"use client"

import { useState } from "react"
import { PageWrapper } from "@/components/page-layout"
import { UsersHeader } from "@/components/headers"
import { UsersSearch } from "@/components/search"
import { UsersTable } from "@/components/table-users"
import { UserForm } from "@/components/form-user"
import type { PbxUserDisplay } from "@/lib/db/types"
import { 
  toggleUserStatus, 
  deleteUser, 
  createUser, 
  updateUser
} from "@/app/actions"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UsersClientProps {
  initialUsers: PbxUserDisplay[]
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState<PbxUserDisplay[]>(initialUsers)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<PbxUserDisplay | null>(null)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  const toggleSelected = (uid: string) => {
    setSelectedUsers((prev) => (prev.includes(uid) ? prev.filter((userId) => userId !== uid) : [...prev, uid]))
  }

  const toggleAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.auth_user_id))
    }
  }

  const handleToggleStatus = async (uid: string) => {
    setIsLoading((prev) => ({ ...prev, [uid]: true }))

    try {
      await toggleUserStatus(uid)

      // Update the local state
      setUsers((prev) =>
        prev.map((user) =>
          user.auth_user_id === uid
            ? {
                ...user,
                disabled: !user.disabled,
              }
            : user,
        ),
      )

      toast.success("Status updated", {
        description: "User status has been updated successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Failed to toggle user status:", error)
      toast.error("Error", {
        description: "Failed to update user status. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [uid]: false }))
    }
  }

  const handleDeleteUser = async (uid: string) => {
    setIsLoading((prev) => ({ ...prev, [uid]: true }))

    try {
      await deleteUser(uid)

      // Update the local state
      setUsers((prev) => prev.filter((user) => user.auth_user_id !== uid))
      setSelectedUsers((prev) => prev.filter((userId) => userId !== uid))

      toast.success("User deleted", {
        description: "User has been deleted successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast.error("Error", {
        description: "Failed to delete user. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [uid]: false }))
      setUserToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsLoading((prev) => {
      const newLoading = { ...prev }
      selectedUsers.forEach((uid) => {
        newLoading[uid] = true
      })
      return newLoading
    })

    try {
      // In a real app, you might want to use a batch delete endpoint
      await Promise.all(selectedUsers.map((uid) => deleteUser(uid)))

      // Update the local state
      setUsers((prev) => prev.filter((user) => !selectedUsers.includes(user.auth_user_id)))
      setSelectedUsers([])

      toast.success("User deleted", {
        description: `${selectedUsers.length} users have been deleted successfully.`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Failed to delete users:", error)
      toast.error("Error", {
        description: "Failed to delete users. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsLoading({})
      setIsBulkDeleteDialogOpen(false)
    }
  }

  const handleCreateUser = async (userData: Omit<PbxUserDisplay, "uid" | "createdAt" | "lastLogin">) => {
    try {
      const newUser = await createUser(userData)
      setUsers((prev) => [...prev, newUser])

      toast.success("User created", {
        description: "New user has been created successfully.",
        duration: 3000,
      })

      setIsFormOpen(false)
    } catch (error) {
      console.error("Failed to create user:", error)
      toast.error("Error", {
        description: "Failed to create user. Please try again.",
        duration: 3000,
      })
    }
  }

  const handleUpdateUser = async (userData: Partial<PbxUserDisplay>) => {
    if (!userToEdit) return

    setIsLoading((prev) => ({ ...prev, [userToEdit.auth_user_id]: true }))

    try {
      const updatedUser = await updateUser(userToEdit.auth_user_id, userData)

      // Update the local state
      setUsers((prev) => prev.map((user) => (user.auth_user_id === userToEdit.auth_user_id ? updatedUser : user)))

      toast.success("User updated", {
        description: "User has been updated successfully.",
        duration: 3000,
      })

      setUserToEdit(null)
      setIsFormOpen(false)
    } catch (error) {
      console.error("Failed to update user:", error)
      toast.error("Error", {
        description: "Failed to update user. Please try again.",
        duration: 3000,
      })
    } finally {
      setIsLoading((prev) => ({ ...prev, [userToEdit.auth_user.uid]: false }))
    }
  }

  const openCreateForm = () => {
    setUserToEdit(null)
    setIsFormOpen(true)
  }

  const openEditForm = (user: PbxUserDisplay) => {
    setUserToEdit(user)
    setIsFormOpen(true)
  }

  const confirmDeleteUser = (uid: string) => {
    setUserToDelete(uid)
    setIsDeleteDialogOpen(true)
  }

  const confirmBulkDelete = () => {
    setIsBulkDeleteDialogOpen(true)
  }

  // Apply filters
  const filteredUsers = Array.isArray(users) ? users.filter((user) => {
    if (!user?.auth_user) return false;

    const matchesSearch =
      (user.auth_user.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())

    // Check if user has the selected role
    //const userRoleResult = getPrimaryRole(user.auth_user_id)
    const matchesRole = filterRole === "all" || user.role === filterRole

    // Check status
    const status = user.disabled ? "inactive" : "active"
    const matchesStatus = filterStatus === "all" || status === filterStatus

    return matchesSearch && matchesRole && matchesStatus
  }) : []

  return (
    <PageWrapper>
      <UsersHeader
        selectedCount={selectedUsers.length}
        onCreateUser={openCreateForm}
        onBulkDelete={confirmBulkDelete}
      />

      <UsersSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      <UsersTable
        users={filteredUsers}
        selectedUsers={selectedUsers}
        toggleSelected={toggleSelected}
        toggleAll={toggleAll}
        toggleStatus={handleToggleStatus}
        onEdit={openEditForm}
        onDelete={confirmDeleteUser}
        isLoading={isLoading}
      />

      {/* User Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{userToEdit ? "Edit User" : "Create New User"}</DialogTitle>
            <DialogDescription>
              {userToEdit
                ? "Update user information and permissions."
                : "Fill in the information to create a new user."}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={userToEdit}
            onSubmit={userToEdit ? handleUpdateUser : handleCreateUser}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove their data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete {selectedUsers.length} users?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete these user accounts and remove their data from
              our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Delete {selectedUsers.length} Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  )
}

